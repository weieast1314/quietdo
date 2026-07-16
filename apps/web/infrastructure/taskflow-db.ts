import {
  createDefaultCategories,
  createId,
  createSeedTasks,
  migrateLegacySnapshot,
  normalizeCategoryRecord,
  normalizeTaskRecord,
  parseTaskFlowExport,
  TASK_SCHEMA_VERSION,
  type Category,
  type LegacySnapshot,
  type OutboxOperation,
  type Task,
  type TaskFlowExport,
  type TaskFlowSnapshot,
} from "@/domain/task";

const DATABASE_NAME = "taskflow";
const DATABASE_VERSION = 1;
const LEGACY_STORAGE_KEY = "taskflow_data_v1";

type DeliveryEndpoint = "/api/events" | "/api/feedback";

export interface DeliveryRecord {
  id: string;
  endpoint: DeliveryEndpoint;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
}

interface MetaRecord {
  key: string;
  value: unknown;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), {
      once: true,
    });
    request.addEventListener(
      "error",
      () => reject(request.error ?? new Error("IndexedDB request failed")),
      { once: true },
    );
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener(
      "abort",
      () => reject(transaction.error ?? new Error("IndexedDB transaction aborted")),
      { once: true },
    );
    transaction.addEventListener(
      "error",
      () => reject(transaction.error ?? new Error("IndexedDB transaction failed")),
      { once: true },
    );
  });
}

class TaskFlowDatabase {
  private databasePromise: Promise<IDBDatabase> | null = null;
  private initializationPromise: Promise<void> | null = null;

  private open(): Promise<IDBDatabase> {
    if (typeof indexedDB === "undefined") {
      return Promise.reject(
        new Error("当前浏览器不支持 IndexedDB，任务无法可靠保存"),
      );
    }
    if (this.databasePromise) return this.databasePromise;

    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.addEventListener("upgradeneeded", () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("tasks")) {
          const store = database.createObjectStore("tasks", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("deletedAt", "deletedAt");
        }
        if (!database.objectStoreNames.contains("categories")) {
          database.createObjectStore("categories", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("outbox")) {
          const store = database.createObjectStore("outbox", {
            keyPath: "operationId",
          });
          store.createIndex("createdAt", "createdAt");
        }
        if (!database.objectStoreNames.contains("deliveries")) {
          const store = database.createObjectStore("deliveries", {
            keyPath: "id",
          });
          store.createIndex("createdAt", "createdAt");
        }
        if (!database.objectStoreNames.contains("meta")) {
          database.createObjectStore("meta", { keyPath: "key" });
        }
      });
      request.addEventListener("success", () => {
        const database = request.result;
        database.addEventListener("versionchange", () => database.close());
        resolve(database);
      });
      request.addEventListener(
        "error",
        () => reject(request.error ?? new Error("无法打开 IndexedDB")),
        { once: true },
      );
      request.addEventListener(
        "blocked",
        () => reject(new Error("数据库升级被其他 QuietDo 页面阻塞，请关闭旧页面后重试")),
        { once: true },
      );
    });

    return this.databasePromise;
  }

  private ensureInitialized(): Promise<void> {
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this.initialize();
    return this.initializationPromise;
  }

  private async initialize(): Promise<void> {
    const database = await this.open();
    const readTransaction = database.transaction("meta", "readonly");
    const initialized = await requestResult<MetaRecord | undefined>(
      readTransaction.objectStore("meta").get("initialized"),
    );
    if (initialized?.value === true) return;

    let snapshot: TaskFlowSnapshot | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          snapshot = migrateLegacySnapshot(JSON.parse(raw) as LegacySnapshot);
        }
      } catch {
        snapshot = null;
      }
    }

    const now = Date.now();
    snapshot ??= {
      tasks: createSeedTasks(now),
      categories: createDefaultCategories(now),
    };

    const transaction = database.transaction(
      ["tasks", "categories", "meta"],
      "readwrite",
    );
    const done = transactionDone(transaction);
    const taskStore = transaction.objectStore("tasks");
    const categoryStore = transaction.objectStore("categories");
    for (const task of snapshot.tasks) taskStore.put(task);
    for (const category of snapshot.categories) categoryStore.put(category);
    transaction.objectStore("meta").put({ key: "initialized", value: true });
    transaction.objectStore("meta").put({
      key: "schemaVersion",
      value: TASK_SCHEMA_VERSION,
    });
    await done;
  }

  async loadSnapshot(): Promise<TaskFlowSnapshot> {
    await this.ensureInitialized();
    const database = await this.open();
    const transaction = database.transaction(
      ["tasks", "categories"],
      "readonly",
    );
    const [taskRecords, categoryRecords] = await Promise.all([
      requestResult<unknown[]>(transaction.objectStore("tasks").getAll()),
      requestResult<unknown[]>(transaction.objectStore("categories").getAll()),
    ]);
    const tasks = taskRecords
      .map((record) => normalizeTaskRecord(record))
      .filter((task): task is Task => task !== null);
    const categories = categoryRecords
      .map((record) => normalizeCategoryRecord(record))
      .filter((category): category is Category => category !== null);

    const requiresMigration =
      tasks.length !== taskRecords.length ||
      categories.length !== categoryRecords.length ||
      taskRecords.some(
        (record) =>
          !record ||
          typeof record !== "object" ||
          (record as { schemaVersion?: unknown }).schemaVersion !==
            TASK_SCHEMA_VERSION,
      ) ||
      categoryRecords.some(
        (record) =>
          !record ||
          typeof record !== "object" ||
          (record as { schemaVersion?: unknown }).schemaVersion !==
            TASK_SCHEMA_VERSION,
      );
    if (requiresMigration) {
      await this.persistMigratedSnapshot({ tasks, categories });
    }
    return { tasks, categories };
  }

  private async persistMigratedSnapshot(snapshot: TaskFlowSnapshot): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(
      ["tasks", "categories", "meta"],
      "readwrite",
    );
    const done = transactionDone(transaction);
    const taskStore = transaction.objectStore("tasks");
    const categoryStore = transaction.objectStore("categories");
    taskStore.clear();
    categoryStore.clear();
    for (const task of snapshot.tasks) taskStore.put(task);
    for (const category of snapshot.categories) categoryStore.put(category);
    transaction.objectStore("meta").put({
      key: "schemaVersion",
      value: TASK_SCHEMA_VERSION,
    });
    await done;
  }

  async saveTask(task: Task, operation: OutboxOperation): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(["tasks", "outbox"], "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore("tasks").put(task);
    transaction.objectStore("outbox").put(operation);
    await done;
  }

  async saveCategory(
    category: Category,
    operation: OutboxOperation,
  ): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(
      ["categories", "outbox"],
      "readwrite",
    );
    const done = transactionDone(transaction);
    transaction.objectStore("categories").put(category);
    transaction.objectStore("outbox").put(operation);
    await done;
  }

  async reset(): Promise<TaskFlowSnapshot> {
    const database = await this.open();
    const categories = createDefaultCategories();
    const transaction = database.transaction(
      ["tasks", "categories", "outbox", "deliveries"],
      "readwrite",
    );
    const done = transactionDone(transaction);
    transaction.objectStore("tasks").clear();
    transaction.objectStore("categories").clear();
    transaction.objectStore("outbox").clear();
    transaction.objectStore("deliveries").clear();
    for (const category of categories) {
      transaction.objectStore("categories").put(category);
    }
    await done;
    return { tasks: [], categories };
  }

  async exportData(): Promise<string> {
    const snapshot = await this.loadSnapshot();
    const payload: TaskFlowExport = {
      format: "taskflow-export",
      schemaVersion: TASK_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      ...snapshot,
    };
    return JSON.stringify(payload, null, 2);
  }

  async importData(input: string): Promise<TaskFlowSnapshot> {
    const payload = parseTaskFlowExport(input);
    const database = await this.open();
    const transaction = database.transaction(
      ["tasks", "categories", "outbox"],
      "readwrite",
    );
    const done = transactionDone(transaction);
    const taskStore = transaction.objectStore("tasks");
    const categoryStore = transaction.objectStore("categories");
    taskStore.clear();
    categoryStore.clear();
    transaction.objectStore("outbox").clear();
    for (const task of payload.tasks) taskStore.put(task);
    for (const category of payload.categories) categoryStore.put(category);
    await done;
    return { tasks: payload.tasks, categories: payload.categories };
  }

  async getClientId(): Promise<string> {
    await this.ensureInitialized();
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("meta", "readwrite");
      const store = transaction.objectStore("meta");
      const request = store.get("clientId");
      let clientId = "";
      request.addEventListener("success", () => {
        const existing = request.result as MetaRecord | undefined;
        clientId =
          typeof existing?.value === "string" ? existing.value : createId("client");
        if (typeof existing?.value !== "string") {
          store.put({ key: "clientId", value: clientId });
        }
      });
      transaction.addEventListener("complete", () => resolve(clientId), {
        once: true,
      });
      transaction.addEventListener(
        "error",
        () => reject(transaction.error ?? new Error("无法创建本地设备标识")),
        { once: true },
      );
      transaction.addEventListener(
        "abort",
        () => reject(transaction.error ?? new Error("无法创建本地设备标识")),
        { once: true },
      );
    });
  }

  async queueDelivery(
    endpoint: DeliveryEndpoint,
    payload: Record<string, unknown>,
  ): Promise<DeliveryRecord> {
    const delivery: DeliveryRecord = {
      id: createId("delivery"),
      endpoint,
      payload,
      createdAt: Date.now(),
      attempts: 0,
    };
    const database = await this.open();
    const transaction = database.transaction("deliveries", "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore("deliveries").put(delivery);
    await done;
    return delivery;
  }

  async pendingDeliveries(limit = 50): Promise<DeliveryRecord[]> {
    const database = await this.open();
    const transaction = database.transaction("deliveries", "readonly");
    const records = await requestResult<DeliveryRecord[]>(
      transaction.objectStore("deliveries").getAll(),
    );
    return records.toSorted((a, b) => a.createdAt - b.createdAt).slice(0, limit);
  }

  async completeDelivery(id: string): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction("deliveries", "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore("deliveries").delete(id);
    await done;
  }

  async recordDeliveryAttempt(delivery: DeliveryRecord): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction("deliveries", "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore("deliveries").put({
      ...delivery,
      attempts: delivery.attempts + 1,
    });
    await done;
  }
}

export const taskFlowDatabase = new TaskFlowDatabase();
