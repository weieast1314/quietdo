"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CATEGORY_COLORS,
  TASK_SCHEMA_VERSION,
  buildTaskReview,
  calculateStats,
  createDefaultCategories,
  createId,
  createSeedTasks,
  createTask,
  deleteTask,
  filterAndSortTasks,
  filterCounts,
  toggleTask,
  updateTask,
  type Category,
  type OutboxOperation,
  type Task,
  type TaskDraft,
  type TaskFilter,
} from "@/domain/task";
import { taskFlowDatabase } from "@/infrastructure/taskflow-db";
import {
  telemetry,
  type FeedbackInput,
} from "@/infrastructure/telemetry";

export interface Notice {
  id: string;
  message: string;
  tone: "success" | "warning";
}

function replaceTask(tasks: Task[], next: Task): Task[] {
  const index = tasks.findIndex((task) => task.id === next.id);
  if (index < 0) return [next, ...tasks];
  return tasks.map((task) => (task.id === next.id ? next : task));
}

export function useTaskFlow() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilterState] = useState<TaskFilter>("today");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [loading, setLoading] = useState(true);
  const [persistenceReady, setPersistenceReady] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback(
    (message: string, tone: Notice["tone"] = "success") => {
      setNotice({ id: createId("notice"), message, tone });
    },
    [],
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    let active = true;
    let stopAutoFlush: () => void = () => undefined;
    void taskFlowDatabase
      .loadSnapshot()
      .then((snapshot) => {
        if (!active) return;
        setTasks(snapshot.tasks);
        setCategories(snapshot.categories);
        setPersistenceReady(true);
        stopAutoFlush = telemetry.startAutoFlush();
        void telemetry.track("app_open", {
          taskCount: snapshot.tasks.filter((task) => !task.deletedAt).length,
        });
      })
      .catch(() => {
        if (!active) return;
        setTasks(createSeedTasks());
        setCategories(createDefaultCategories());
        setPersistenceReady(false);
        notify("本地数据库不可用；当前更改只在本次会话保留", "warning");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      stopAutoFlush();
    };
  }, [notify]);

  const visibleTasks = useMemo(
    () => filterAndSortTasks(tasks, filter, deferredSearch),
    [deferredSearch, filter, tasks],
  );
  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  const counts = useMemo(() => filterCounts(tasks), [tasks]);
  const review = useMemo(() => buildTaskReview(tasks), [tasks]);

  const persistTask = useCallback(
    async (
      task: Task,
      mutation: OutboxOperation["mutation"],
      baseRevision: number,
      eventName: string,
      eventProperties: Record<string, unknown> = {},
    ) => {
      try {
        const clientId = await taskFlowDatabase.getClientId();
        await taskFlowDatabase.saveTask(task, {
          operationId: createId("op"),
          entityType: "task",
          entityId: task.id,
          mutation,
          baseRevision,
          patch: { ...task },
          clientId,
          createdAt: Date.now(),
        });
        setPersistenceReady(true);
        void telemetry.track(eventName, eventProperties);
      } catch {
        setPersistenceReady(false);
        notify("更改已保留在当前页面，但尚未写入本地数据库", "warning");
      }
    },
    [notify],
  );

  const addTask = useCallback(
    (draft: TaskDraft) => {
      try {
        const task = createTask(draft);
        setTasks((current) => [task, ...current]);
        void persistTask(task, "create", 0, "task_create", {
          priority: task.priority,
          hasDate: Boolean(task.dueDate),
          categoryId: task.categoryId,
        });
        notify("任务已添加");
        return true;
      } catch (error) {
        notify(error instanceof Error ? error.message : "无法创建任务", "warning");
        return false;
      }
    },
    [notify, persistTask],
  );

  const editTask = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          Task,
          | "title"
          | "note"
          | "nextAction"
          | "successCriteria"
          | "categoryId"
          | "priority"
          | "dueDate"
        >
      >,
    ) => {
      const current = tasks.find((task) => task.id === id);
      if (!current) return false;
      try {
        const next = updateTask(current, patch);
        setTasks((all) => replaceTask(all, next));
        void persistTask(next, "update", current.revision, "task_edit_save");
        notify("任务已更新");
        return true;
      } catch (error) {
        notify(error instanceof Error ? error.message : "无法更新任务", "warning");
        return false;
      }
    },
    [notify, persistTask, tasks],
  );

  const toggle = useCallback(
    (id: string) => {
      const current = tasks.find((task) => task.id === id);
      if (!current) return;
      const next = toggleTask(current);
      setTasks((all) => replaceTask(all, next));
      void persistTask(next, "update", current.revision, "task_toggle", {
        done: next.done,
      });
      notify(next.done ? "完成得漂亮" : "任务已恢复");
    },
    [notify, persistTask, tasks],
  );

  const removeTask = useCallback(
    (id: string) => {
      const current = tasks.find((task) => task.id === id);
      if (!current) return;
      const next = deleteTask(current);
      setTasks((all) => replaceTask(all, next));
      void persistTask(next, "delete", current.revision, "task_delete");
      notify("任务已删除");
    },
    [notify, persistTask, tasks],
  );

  const addCategory = useCallback(
    async (name: string, color: string = CATEGORY_COLORS[0], outcome = "") => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        notify("请输入分类名称", "warning");
        return false;
      }
      if (
        categories.some(
          (category) => category.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
        )
      ) {
        notify("这个分类已经存在", "warning");
        return false;
      }
      const now = Date.now();
      const category: Category = {
        id: createId("category"),
        name: trimmedName.slice(0, 40),
        color,
        kind: "project",
        outcome: outcome.trim().slice(0, 240),
        createdAt: now,
        updatedAt: now,
        revision: 1,
        schemaVersion: TASK_SCHEMA_VERSION,
      };
      setCategories((current) => [...current, category]);
      try {
        const clientId = await taskFlowDatabase.getClientId();
        await taskFlowDatabase.saveCategory(category, {
          operationId: createId("op"),
          entityType: "category",
          entityId: category.id,
          mutation: "create",
          baseRevision: 0,
          patch: { ...category },
          clientId,
          createdAt: now,
        });
        setPersistenceReady(true);
        void telemetry.track("category_create");
        notify("分类已创建");
      } catch {
        setPersistenceReady(false);
        notify("分类只在当前页面保留，尚未写入本地数据库", "warning");
      }
      return true;
    },
    [categories, notify],
  );

  const chooseFilter = useCallback((next: TaskFilter) => {
    setFilterState(next);
    void telemetry.track("filter_change", { filter: next });
  }, []);

  const clearData = useCallback(async () => {
    try {
      const snapshot = await taskFlowDatabase.reset();
      setTasks(snapshot.tasks);
      setCategories(snapshot.categories);
      setFilterState("all");
      setPersistenceReady(true);
      void telemetry.track("data_clear");
      notify("本地任务数据已清空");
      return true;
    } catch {
      notify("无法清空本地数据", "warning");
      return false;
    }
  }, [notify]);

  const exportData = useCallback(async () => {
    try {
      return await taskFlowDatabase.exportData();
    } catch {
      notify("导出失败，请稍后重试", "warning");
      return null;
    }
  }, [notify]);

  const importData = useCallback(
    async (content: string) => {
      try {
        const snapshot = await taskFlowDatabase.importData(content);
        setTasks(snapshot.tasks);
        setCategories(snapshot.categories);
        setFilterState("all");
        setPersistenceReady(true);
        notify("数据导入完成");
        return true;
      } catch (error) {
        notify(error instanceof Error ? error.message : "导入失败", "warning");
        return false;
      }
    },
    [notify],
  );

  const submitFeedback = useCallback(
    async (input: FeedbackInput) => {
      try {
        await telemetry.submitFeedback(input);
        notify("感谢反馈；断网时会自动稍后提交");
        return true;
      } catch {
        notify("反馈暂时无法保存，请稍后重试", "warning");
        return false;
      }
    },
    [notify],
  );

  return {
    tasks,
    visibleTasks,
    categories,
    filter,
    search,
    stats,
    counts,
    review,
    loading,
    persistenceReady,
    notice,
    setSearch,
    chooseFilter,
    addTask,
    editTask,
    toggle,
    removeTask,
    addCategory,
    clearData,
    exportData,
    importData,
    submitFeedback,
    trackEvent: telemetry.track.bind(telemetry),
  };
}
