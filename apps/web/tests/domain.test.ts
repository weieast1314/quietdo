import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateStats,
  buildTaskReview,
  createDefaultCategories,
  createTask,
  deleteTask,
  filterAndSortTasks,
  formatDueDate,
  migrateLegacySnapshot,
  normalizeTaskRecord,
  parseSmartCapture,
  TASK_SCHEMA_VERSION,
  toggleTask,
  updateTask,
  type Task,
} from "../domain/task";

function task(overrides: Partial<Task>): Task {
  return {
    id: "task-base",
    title: "基础任务",
    note: "",
    nextAction: "执行下一步",
    successCriteria: "结果可以被检查",
    categoryId: "inbox",
    priority: "medium",
    dueDate: "",
    done: false,
    completedAt: null,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    revision: 1,
    schemaVersion: TASK_SCHEMA_VERSION,
    ...overrides,
  };
}

test("due date labels use calendar-day semantics", () => {
  assert.equal(formatDueDate("2026-07-16", "2026-07-16"), "今天");
  assert.equal(formatDueDate("2026-07-17", "2026-07-16"), "明天");
  assert.equal(formatDueDate("2026-07-14", "2026-07-16"), "逾期 2 天");
});

test("filtering excludes tombstones and sorts active high priority first", () => {
  const tasks = [
    task({ id: "done", title: "完成", done: true, priority: "high" }),
    task({ id: "low", title: "低", priority: "low" }),
    task({ id: "high", title: "高", priority: "high" }),
    task({ id: "deleted", title: "已删除", deletedAt: 3 }),
  ];

  assert.deepEqual(
    filterAndSortTasks(tasks, "all", "").map((item) => item.id),
    ["high", "low", "done"],
  );
});

test("lifetime completion rate keeps completed tombstones in the denominator", () => {
  const completed = toggleTask(task({ id: "completed" }), 10);
  const deletedCompleted = deleteTask(completed, 20);
  const stats = calculateStats([deletedCompleted, task({ id: "active" })]);

  assert.equal(stats.total, 1);
  assert.equal(stats.completed, 0);
  assert.equal(stats.completionRate, 50);
});

test("task updates increment revision and validate title", () => {
  const created = createTask({
    title: "  新任务  ",
    categoryId: "inbox",
    priority: "medium",
  }, 10);
  const updated = updateTask(created, { title: "更新" }, 20);

  assert.equal(created.title, "新任务");
  assert.equal(updated.revision, 2);
  assert.equal(updated.updatedAt, 20);
  assert.throws(() => updateTask(created, { title: "   " }), /不能为空/);
});

test("legacy prototype data migrates into the v3 model", () => {
  const migrated = migrateLegacySnapshot({
    cats: [{ id: "work", name: "工作", color: "#123456" }],
    tasks: [{ id: "old", title: "旧任务", cat: "work", priority: "high", done: false, createdAt: 1 }],
  }, 100);

  assert.ok(migrated);
  assert.equal(migrated.tasks[0].categoryId, "work");
  assert.equal(migrated.tasks[0].schemaVersion, 3);
  assert.equal(migrated.tasks[0].nextAction, "");
  assert.equal(migrated.categories[0].schemaVersion, 3);
  assert.equal(createDefaultCategories(100).length, 4);
});

test("smart capture extracts date, priority and project without a network call", () => {
  const captured = parseSmartCapture(
    "明天 整理周报 #工作 紧急",
    createDefaultCategories(100),
    new Date("2026-07-16T12:00:00"),
  );

  assert.equal(captured.draft.title, "整理周报");
  assert.equal(captured.draft.dueDate, "2026-07-17");
  assert.equal(captured.draft.priority, "high");
  assert.equal(captured.draft.categoryId, "work");
  assert.deepEqual(captured.hints, ["明天", "高优先级", "工作"]);
});

test("review finds overdue, stale and unclear tasks", () => {
  const now = Date.parse("2026-07-16T12:00:00Z");
  const review = buildTaskReview(
    [
      task({
        title: "优化方案",
        dueDate: "2026-07-10",
        nextAction: "",
        successCriteria: "",
        updatedAt: now - 15 * 86_400_000,
      }),
    ],
    "2026-07-16",
    now,
  );

  assert.equal(review.summary.total, 1);
  assert.equal(review.summary.overdue, 1);
  assert.equal(review.summary.stale, 1);
  assert.equal(review.summary.missingNextAction, 1);
  assert.ok(review.items[0].reasons.includes("vague"));
});

test("v2 task records normalize without losing user content", () => {
  const migrated = normalizeTaskRecord({
    id: "old-v2",
    title: "旧数据",
    note: "仍然保留",
    categoryId: "work",
    priority: "high",
    dueDate: "",
    done: false,
    createdAt: 1,
    updatedAt: 2,
    deletedAt: null,
    revision: 1,
    schemaVersion: 2,
  }, 100);

  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.note, "仍然保留");
  assert.equal(migrated.nextAction, "");
});
