export const TASK_SCHEMA_VERSION = 3 as const;

export type Priority = "high" | "medium" | "low";
export type CategoryKind = "area" | "project";
export type TaskFilter =
  | "all"
  | "today"
  | "upcoming"
  | "overdue"
  | "completed"
  | `category:${string}`;

export interface Task {
  id: string;
  title: string;
  note: string;
  nextAction: string;
  successCriteria: string;
  categoryId: string;
  priority: Priority;
  dueDate: string;
  done: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  revision: number;
  schemaVersion: typeof TASK_SCHEMA_VERSION;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  kind: CategoryKind;
  outcome: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  schemaVersion: typeof TASK_SCHEMA_VERSION;
}

export interface TaskDraft {
  title: string;
  note?: string;
  nextAction?: string;
  successCriteria?: string;
  categoryId: string;
  priority: Priority;
  dueDate?: string;
}

export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
  overdue: number;
}

export interface TaskFlowSnapshot {
  tasks: Task[];
  categories: Category[];
}

export interface TaskFlowExport extends TaskFlowSnapshot {
  format: "taskflow-export";
  schemaVersion: typeof TASK_SCHEMA_VERSION;
  exportedAt: string;
}

export interface OutboxOperation {
  operationId: string;
  entityType: "task" | "category";
  entityId: string;
  mutation: "create" | "update" | "delete";
  baseRevision: number;
  patch: Record<string, unknown>;
  clientId: string;
  createdAt: number;
}

export interface LegacySnapshot {
  tasks?: Array<Record<string, unknown>>;
  cats?: Array<Record<string, unknown>>;
}

export type ReviewReason =
  | "overdue"
  | "stale"
  | "vague"
  | "missing-next-action"
  | "missing-success-criteria";

export interface TaskReviewItem {
  task: Task;
  reasons: ReviewReason[];
  suggestion: string;
  severity: number;
}

export interface ReviewSummary {
  overdue: number;
  stale: number;
  vague: number;
  missingNextAction: number;
  missingSuccessCriteria: number;
  total: number;
}

export interface SmartCaptureResult {
  draft: TaskDraft;
  hints: string[];
}

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const VAGUE_TITLE_PATTERN = /^(完善|优化|处理|推进|研究|学习|准备|整理|跟进|看看|搞定)(一下|下)?/;
const DAY_IN_MS = 86_400_000;

export const CATEGORY_COLORS = [
  "#6d5dfc",
  "#16a47a",
  "#e09a2d",
  "#e45b65",
  "#c0529c",
  "#476fe6",
  "#1a9cb0",
  "#7c9b32",
] as const;

export function createId(prefix = "id"): string {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value}`;
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addLocalDays(days: number, from = new Date()): string {
  const next = new Date(from);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return localDateString(next);
}

function dateKey(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function priorityFrom(value: unknown): Priority {
  return value === "high" || value === "low" ? value : "medium";
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.valueOf()) && localDateString(parsed) === value;
}

export function isOverdue(task: Task, today = localDateString()): boolean {
  return Boolean(
    !task.deletedAt &&
      !task.done &&
      task.dueDate &&
      dateKey(task.dueDate) < dateKey(today),
  );
}

export function formatDueDate(
  dueDate: string,
  today = localDateString(),
): string {
  if (!dueDate) return "";
  const difference = Math.round(
    (dateKey(dueDate) - dateKey(today)) / DAY_IN_MS,
  );
  if (difference === 0) return "今天";
  if (difference === 1) return "明天";
  if (difference === -1) return "昨天";
  if (difference < 0) return `逾期 ${Math.abs(difference)} 天`;
  if (difference <= 7) return `${difference} 天后`;
  const [, month, day] = dueDate.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

export function createDefaultCategories(now = Date.now()): Category[] {
  return [
    { id: "inbox", name: "收件箱", color: "#9aa0b0", kind: "area" as const, outcome: "" },
    { id: "work", name: "工作", color: "#6d5dfc", kind: "area" as const, outcome: "让重要工作持续向前" },
    { id: "personal", name: "个人", color: "#16a47a", kind: "area" as const, outcome: "为生活留出清晰空间" },
    { id: "study", name: "学习", color: "#e09a2d", kind: "area" as const, outcome: "把输入转化为可使用的知识" },
  ].map((category) => ({
    ...category,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    schemaVersion: TASK_SCHEMA_VERSION,
  }));
}

export function createSeedTasks(now = Date.now()): Task[] {
  const from = new Date(now);
  const drafts: TaskDraft[] = [
    {
      title: "完成产品需求文档评审",
      note: "确认 MVP 边界、验收口径和数据指标",
      nextAction: "列出评审中必须确认的三个问题",
      successCriteria: "评审结论已记录，所有阻塞项都有负责人",
      categoryId: "work",
      priority: "high",
      dueDate: localDateString(from),
    },
    {
      title: "整理下周工作重点",
      note: "只保留最重要的三件事",
      nextAction: "回看本周未完成任务并删除不再重要的事项",
      successCriteria: "下周三个重点已经确定",
      categoryId: "work",
      priority: "medium",
      dueDate: addLocalDays(1, from),
    },
    {
      title: "阅读《精益创业》第三章",
      note: "记录一个可以马上尝试的实验",
      nextAction: "完成第三章并记下一个实验假设",
      successCriteria: "形成一条可执行的实验卡片",
      categoryId: "study",
      priority: "low",
      dueDate: addLocalDays(3, from),
    },
  ];
  return drafts.map((draft, index) =>
    createTask(draft, now - index * 1_000),
  );
}

export function createTask(draft: TaskDraft, now = Date.now()): Task {
  const title = draft.title.trim();
  if (!title) throw new Error("任务标题不能为空");
  if (draft.dueDate && !isValidDateString(draft.dueDate)) {
    throw new Error("截止日期格式不正确");
  }
  return {
    id: createId("task"),
    title,
    note: draft.note?.trim() ?? "",
    nextAction: draft.nextAction?.trim() ?? "",
    successCriteria: draft.successCriteria?.trim() ?? "",
    categoryId: draft.categoryId || "inbox",
    priority: draft.priority,
    dueDate: draft.dueDate ?? "",
    done: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    revision: 1,
    schemaVersion: TASK_SCHEMA_VERSION,
  };
}

type EditableTaskFields = Pick<
  Task,
  | "title"
  | "note"
  | "nextAction"
  | "successCriteria"
  | "categoryId"
  | "priority"
  | "dueDate"
>;

export function updateTask(
  task: Task,
  patch: Partial<EditableTaskFields>,
  now = Date.now(),
): Task {
  const title = patch.title === undefined ? task.title : patch.title.trim();
  const dueDate = patch.dueDate === undefined ? task.dueDate : patch.dueDate;
  if (!title) throw new Error("任务标题不能为空");
  if (dueDate && !isValidDateString(dueDate)) {
    throw new Error("截止日期格式不正确");
  }
  return {
    ...task,
    ...patch,
    title,
    note: patch.note === undefined ? task.note : patch.note.trim(),
    nextAction:
      patch.nextAction === undefined ? task.nextAction : patch.nextAction.trim(),
    successCriteria:
      patch.successCriteria === undefined
        ? task.successCriteria
        : patch.successCriteria.trim(),
    dueDate,
    updatedAt: now,
    revision: task.revision + 1,
    schemaVersion: TASK_SCHEMA_VERSION,
  };
}

export function toggleTask(task: Task, now = Date.now()): Task {
  const done = !task.done;
  return {
    ...task,
    done,
    completedAt: done ? now : null,
    updatedAt: now,
    revision: task.revision + 1,
  };
}

export function deleteTask(task: Task, now = Date.now()): Task {
  return {
    ...task,
    deletedAt: now,
    updatedAt: now,
    revision: task.revision + 1,
  };
}

export function activeTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.deletedAt === null);
}

export function filterAndSortTasks(
  tasks: Task[],
  filter: TaskFilter,
  search: string,
  today = localDateString(),
): Task[] {
  const query = search.trim().toLocaleLowerCase();
  const visible = tasks.filter((task) => {
    if (task.deletedAt) return false;
    if (query) {
      const haystack = `${task.title}\n${task.note}\n${task.nextAction}\n${task.successCriteria}`.toLocaleLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filter === "today") return task.dueDate === today;
    if (filter === "upcoming") {
      return Boolean(
        !task.done && task.dueDate && dateKey(task.dueDate) > dateKey(today),
      );
    }
    if (filter === "overdue") return isOverdue(task, today);
    if (filter === "completed") return task.done;
    if (filter.startsWith("category:")) {
      return task.categoryId === filter.slice("category:".length);
    }
    return true;
  });

  return visible.toSorted((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });
}

export function calculateStats(
  tasks: Task[],
  today = localDateString(),
): TaskStats {
  let total = 0;
  let active = 0;
  let completed = 0;
  let overdue = 0;
  let lifetimeCreated = 0;
  let lifetimeCompleted = 0;

  for (const task of tasks) {
    lifetimeCreated += 1;
    if (task.completedAt) lifetimeCompleted += 1;
    if (task.deletedAt) continue;
    total += 1;
    if (task.done) completed += 1;
    else active += 1;
    if (isOverdue(task, today)) overdue += 1;
  }

  return {
    total,
    active,
    completed,
    completionRate: lifetimeCreated
      ? Math.round((lifetimeCompleted / lifetimeCreated) * 100)
      : 0,
    overdue,
  };
}

export function filterCounts(
  tasks: Task[],
  today = localDateString(),
): Record<"all" | "today" | "upcoming" | "overdue" | "completed", number> {
  const counts = { all: 0, today: 0, upcoming: 0, overdue: 0, completed: 0 };
  for (const task of tasks) {
    if (task.deletedAt) continue;
    counts.all += 1;
    if (task.dueDate === today) counts.today += 1;
    if (!task.done && task.dueDate && dateKey(task.dueDate) > dateKey(today)) {
      counts.upcoming += 1;
    }
    if (isOverdue(task, today)) counts.overdue += 1;
    if (task.done) counts.completed += 1;
  }
  return counts;
}

export function parseSmartCapture(
  input: string,
  categories: Category[],
  now = new Date(),
): SmartCaptureResult {
  let title = input.trim();
  let dueDate = "";
  let priority: Priority = "medium";
  let categoryId = "inbox";
  const hints: string[] = [];

  const dateTerms: Array<[string, number]> = [
    ["今天", 0],
    ["明天", 1],
    ["后天", 2],
  ];
  for (const [term, days] of dateTerms) {
    if (!title.includes(term)) continue;
    dueDate = addLocalDays(days, now);
    title = title.replaceAll(term, " ");
    hints.push(term);
    break;
  }

  if (/紧急|高优先级|!高/.test(title)) {
    priority = "high";
    title = title.replace(/紧急|高优先级|!高/g, " ");
    hints.push("高优先级");
  } else if (/低优先级|!低/.test(title)) {
    priority = "low";
    title = title.replace(/低优先级|!低/g, " ");
    hints.push("低优先级");
  }

  for (const category of categories) {
    const token = `#${category.name}`;
    if (!title.includes(token)) continue;
    categoryId = category.id;
    title = title.replaceAll(token, " ");
    hints.push(category.name);
    break;
  }

  return {
    draft: {
      title: title.replace(/\s+/g, " ").trim(),
      categoryId,
      priority,
      dueDate,
    },
    hints,
  };
}

export function buildTaskReview(
  tasks: Task[],
  today = localDateString(),
  now = Date.now(),
): { items: TaskReviewItem[]; summary: ReviewSummary } {
  const items: TaskReviewItem[] = [];
  const summary: ReviewSummary = {
    overdue: 0,
    stale: 0,
    vague: 0,
    missingNextAction: 0,
    missingSuccessCriteria: 0,
    total: 0,
  };

  for (const task of tasks) {
    if (task.deletedAt || task.done) continue;
    const reasons: ReviewReason[] = [];
    if (isOverdue(task, today)) {
      reasons.push("overdue");
      summary.overdue += 1;
    }
    if (now - task.updatedAt >= 14 * DAY_IN_MS) {
      reasons.push("stale");
      summary.stale += 1;
    }
    if (VAGUE_TITLE_PATTERN.test(task.title) || task.title.length < 5) {
      reasons.push("vague");
      summary.vague += 1;
    }
    if (!task.nextAction.trim()) {
      reasons.push("missing-next-action");
      summary.missingNextAction += 1;
    }
    if (!task.successCriteria.trim()) {
      reasons.push("missing-success-criteria");
      summary.missingSuccessCriteria += 1;
    }
    if (!reasons.length) continue;

    const suggestion = reasons.includes("overdue")
      ? "重新安排日期，或确认这件事是否仍然值得做。"
      : reasons.includes("missing-next-action")
        ? "把它改写成一个现在就能开始的具体动作。"
        : reasons.includes("missing-success-criteria")
          ? "补充一个可以被检查的完成条件。"
          : reasons.includes("stale")
            ? "确认继续、暂停，或从清单中移除。"
            : "把标题改得更具体，减少再次理解的成本。";
    items.push({ task, reasons, suggestion, severity: reasons.length });
  }

  items.sort((a, b) => {
    if (a.reasons.includes("overdue") !== b.reasons.includes("overdue")) {
      return a.reasons.includes("overdue") ? -1 : 1;
    }
    if (a.severity !== b.severity) return b.severity - a.severity;
    return a.task.updatedAt - b.task.updatedAt;
  });
  summary.total = items.length;
  return { items, summary };
}

export function normalizeCategoryRecord(
  value: unknown,
  now = Date.now(),
): Category | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.name !== "string") return null;
  const name = item.name.trim().slice(0, 40);
  if (!name) return null;
  return {
    id: item.id,
    name,
    color: typeof item.color === "string" ? item.color : "#9aa0b0",
    kind: item.kind === "project" ? "project" : "area",
    outcome: typeof item.outcome === "string" ? item.outcome.trim().slice(0, 240) : "",
    createdAt: finiteNumber(item.createdAt, now),
    updatedAt: finiteNumber(item.updatedAt, now),
    revision: Math.max(1, finiteNumber(item.revision, 1)),
    schemaVersion: TASK_SCHEMA_VERSION,
  };
}

export function normalizeTaskRecord(
  value: unknown,
  now = Date.now(),
): Task | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.title !== "string") return null;
  const title = item.title.trim().slice(0, 120);
  if (!title) return null;
  const dueDate =
    typeof item.dueDate === "string" &&
    (!item.dueDate || isValidDateString(item.dueDate))
      ? item.dueDate
      : "";
  const done = Boolean(item.done);
  const createdAt = finiteNumber(item.createdAt, now);
  return {
    id: item.id,
    title,
    note: typeof item.note === "string" ? item.note.slice(0, 1_000) : "",
    nextAction:
      typeof item.nextAction === "string" ? item.nextAction.trim().slice(0, 240) : "",
    successCriteria:
      typeof item.successCriteria === "string"
        ? item.successCriteria.trim().slice(0, 500)
        : "",
    categoryId: typeof item.categoryId === "string" ? item.categoryId : "inbox",
    priority: priorityFrom(item.priority),
    dueDate,
    done,
    completedAt: done ? nullableNumber(item.completedAt) ?? now : null,
    createdAt,
    updatedAt: finiteNumber(item.updatedAt, createdAt),
    deletedAt: nullableNumber(item.deletedAt),
    revision: Math.max(1, finiteNumber(item.revision, 1)),
    schemaVersion: TASK_SCHEMA_VERSION,
  };
}

export function migrateLegacySnapshot(
  legacy: LegacySnapshot,
  now = Date.now(),
): TaskFlowSnapshot | null {
  if (!Array.isArray(legacy.tasks) || !Array.isArray(legacy.cats)) return null;
  const categories = legacy.cats
    .map((item) =>
      normalizeCategoryRecord(
        {
          ...item,
          id: item.id,
          name: item.name,
          createdAt: now,
          updatedAt: now,
          revision: 1,
        },
        now,
      ),
    )
    .filter((item): item is Category => item !== null);
  const categoryIds = new Set(categories.map((category) => category.id));
  const tasks = legacy.tasks
    .map((item, index) => {
      const done = Boolean(item.done);
      const createdAt = finiteNumber(item.createdAt, now - index);
      const legacyCategoryId = typeof item.cat === "string" ? item.cat : "inbox";
      return normalizeTaskRecord(
        {
          ...item,
          id: typeof item.id === "string" ? item.id : createId("task"),
          title: item.title,
          note: item.note,
          categoryId: categoryIds.has(legacyCategoryId) ? legacyCategoryId : "inbox",
          dueDate: item.date,
          done,
          completedAt: done ? now : null,
          createdAt,
          updatedAt: now,
          deletedAt: null,
          revision: 1,
        },
        now,
      );
    })
    .filter((item): item is Task => item !== null);

  return {
    tasks,
    categories: categories.length ? categories : createDefaultCategories(now),
  };
}

export function parseTaskFlowExport(input: string): TaskFlowExport {
  const parsed = JSON.parse(input) as Record<string, unknown>;
  if (
    parsed.format !== "taskflow-export" ||
    (parsed.schemaVersion !== 2 && parsed.schemaVersion !== TASK_SCHEMA_VERSION) ||
    !Array.isArray(parsed.tasks) ||
    !Array.isArray(parsed.categories)
  ) {
    throw new Error("这不是受支持的 QuietDo、遂事或原 TaskFlow 数据文件");
  }

  const tasks = parsed.tasks.map((task) => normalizeTaskRecord(task));
  const categories = parsed.categories.map((category) =>
    normalizeCategoryRecord(category),
  );
  if (tasks.some((task) => task === null)) {
    throw new Error("导入文件包含无效任务");
  }
  if (categories.some((category) => category === null)) {
    throw new Error("导入文件包含无效分类");
  }

  return {
    format: "taskflow-export",
    schemaVersion: TASK_SCHEMA_VERSION,
    exportedAt:
      typeof parsed.exportedAt === "string"
        ? parsed.exportedAt
        : new Date().toISOString(),
    tasks: tasks as Task[],
    categories: categories as Category[],
  };
}
