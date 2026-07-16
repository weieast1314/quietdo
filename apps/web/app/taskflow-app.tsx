"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePreferences } from "@/application/use-preferences";
import { useTaskFlow } from "@/application/use-taskflow";
import {
  CATEGORY_COLORS,
  formatDueDate,
  isOverdue,
  localDateString,
  parseSmartCapture,
  type Category,
  type Priority,
  type Task,
  type TaskDraft,
  type TaskFilter,
} from "@/domain/task";
import type { FeedbackInput } from "@/infrastructure/telemetry";
import {
  currentRuntime,
  isNativeRuntime,
} from "@/infrastructure/runtime";
import {
  ProjectsPanel,
  ReviewPanel,
  SettingsPanel,
} from "@/app/taskflow-panels";

type WorkspacePage = "tasks" | "projects" | "review" | "settings";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "long",
});

const FILTERS: Array<{
  key: Exclude<TaskFilter, `category:${string}`>;
  label: string;
  icon: string;
}> = [
  { key: "all", label: "全部任务", icon: "◇" },
  { key: "today", label: "今天", icon: "●" },
  { key: "upcoming", label: "即将到来", icon: "↗" },
  { key: "overdue", label: "已逾期", icon: "!" },
  { key: "completed", label: "已完成", icon: "✓" },
];

const SECONDARY_FILTERS = FILTERS.filter(
  (item) => item.key !== "today",
);

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

function filterHeading(filter: TaskFilter, categories: Category[]) {
  if (filter.startsWith("category:")) {
    const category = categories.find(
      (item) => item.id === filter.slice("category:".length),
    );
    return {
      title: category?.name ?? "分类任务",
      subtitle: "聚焦这个分类中的全部任务",
    };
  }
  const headings: Record<Exclude<TaskFilter, `category:${string}`>, string[]> = {
    all: ["把重要的事放在眼前", "轻量整理，专注完成"],
    today: ["今天", "只处理今天真正重要的事情"],
    upcoming: ["即将到来", "提前看见未来几天的安排"],
    overdue: ["已逾期", "先补上最需要处理的任务"],
    completed: ["已完成", "回看已经推进的每一步"],
  };
  const smartFilter = filter as Exclude<TaskFilter, `category:${string}`>;
  return {
    title: headings[smartFilter][0],
    subtitle: headings[smartFilter][1],
  };
}

interface ModalProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "small" | "medium";
}

function Modal({ title, eyebrow, children, onClose, size = "medium" }: ModalProps) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

interface QuickAddProps {
  categories: Category[];
  onAdd: (draft: TaskDraft) => boolean;
  onClose: () => void;
}

function QuickAdd({ categories, onAdd, onClose }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "inbox");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const smartCapture = useMemo(
    () => parseSmartCapture(title, categories),
    [categories, title],
  );

  const applySmartCapture = () => {
    if (!smartCapture.hints.length) return;
    setTitle(smartCapture.draft.title);
    setCategoryId(smartCapture.draft.categoryId);
    setPriority(smartCapture.draft.priority);
    setDueDate(smartCapture.draft.dueDate ?? "");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const added = onAdd({ title, categoryId, priority, dueDate });
    if (added) onClose();
  };

  return (
    <form className="quick-add" onSubmit={submit} data-testid="quick-add-form">
      <div className="quick-add-heading">
        <span className="quick-add-mark">+</span>
        <div>
          <strong>快速添加</strong>
          <span>输入标题后按 Enter</span>
        </div>
      </div>
      <input
        className="quick-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="下一件要完成的事是什么？"
        aria-label="任务标题"
        autoFocus
        maxLength={120}
      />
      <div className="smart-capture-row">
        <span>可直接输入“明天 整理周报 #工作 紧急”</span>
        {smartCapture.hints.length ? (
          <button type="button" onClick={applySmartCapture}>
            应用识别：{smartCapture.hints.join(" · ")}
          </button>
        ) : null}
      </div>
      <div className="quick-fields">
        <label>
          <span>分类</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>优先级</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>
        <label>
          <span>截止日期</span>
          <input
            type="date"
            value={dueDate}
            min={localDateString()}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>
      <div className="quick-actions">
        <button className="button button-ghost" type="button" onClick={onClose}>
          取消
        </button>
        <button className="button button-primary" type="submit">
          添加任务
        </button>
      </div>
    </form>
  );
}

interface TaskCardProps {
  task: Task;
  category?: Category;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskCard({ task, category, onToggle, onEdit, onDelete }: TaskCardProps) {
  const overdue = isOverdue(task);
  return (
    <article
      className={`task-card ${task.done ? "is-done" : ""} ${overdue ? "is-overdue" : ""}`}
      data-testid="task-card"
    >
      <button
        className="task-check"
        type="button"
        aria-label={task.done ? `恢复任务：${task.title}` : `完成任务：${task.title}`}
        aria-pressed={task.done}
        onClick={onToggle}
      >
        {task.done ? "✓" : ""}
      </button>
      <button className="task-body" type="button" onClick={onEdit}>
        <span className="task-title">{task.title}</span>
        {task.note ? <span className="task-note">{task.note}</span> : null}
        {task.nextAction ? (
          <span className="task-next-action">下一步 · {task.nextAction}</span>
        ) : null}
        <span className="task-meta">
          <span className="tag">
            <i style={{ background: category?.color ?? "#9aa0b0" }} />
            {category?.name ?? "收件箱"}
          </span>
          <span className={`tag priority-${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.dueDate ? (
            <span className={`tag due-tag ${overdue ? "danger" : ""}`}>
              {formatDueDate(task.dueDate)}
            </span>
          ) : null}
          {!task.nextAction || !task.successCriteria ? (
            <span className="tag clarity-tag">待澄清</span>
          ) : null}
        </span>
      </button>
      <div className="task-actions">
        <button className="icon-button" type="button" onClick={onEdit} aria-label={`编辑：${task.title}`}>
          ↗
        </button>
        <button
          className="icon-button danger-button"
          type="button"
          onClick={onDelete}
          aria-label={`删除：${task.title}`}
        >
          ×
        </button>
      </div>
    </article>
  );
}

interface EditTaskModalProps {
  task: Task;
  categories: Category[];
  onClose: () => void;
  onSave: (patch: Partial<Task>) => boolean;
  onDelete: () => void;
}

function EditTaskModal({ task, categories, onClose, onSave, onDelete }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note);
  const [nextAction, setNextAction] = useState(task.nextAction);
  const [successCriteria, setSuccessCriteria] = useState(task.successCriteria);
  const [categoryId, setCategoryId] = useState(task.categoryId);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      onSave({
        title,
        note,
        nextAction,
        successCriteria,
        categoryId,
        priority,
        dueDate,
      })
    ) {
      onClose();
    }
  };

  return (
    <Modal title="编辑任务" eyebrow="保持下一步清晰" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label className="field field-wide">
          <span>任务标题</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} autoFocus />
        </label>
        <label className="field field-wide">
          <span>备注</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1_000} rows={4} />
        </label>
        <label className="field field-wide clarity-field">
          <span>下一步动作</span>
          <input
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            maxLength={240}
            placeholder="例如：列出评审中必须确认的三个问题"
          />
          <small>写成一个现在就能开始的动作。</small>
        </label>
        <label className="field field-wide clarity-field">
          <span>完成条件</span>
          <textarea
            value={successCriteria}
            onChange={(event) => setSuccessCriteria(event.target.value)}
            maxLength={500}
            rows={2}
            placeholder="例如：结论已记录，阻塞项都有负责人"
          />
          <small>用可以被检查的结果代替“我觉得做完了”。</small>
        </label>
        <label className="field">
          <span>分类</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>优先级</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>
        <label className="field field-wide">
          <span>截止日期</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <footer className="modal-footer split-footer">
          <button
            className="button button-danger"
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            删除任务
          </button>
          <div>
            <button className="button button-ghost" type="button" onClick={onClose}>
              取消
            </button>
            <button className="button button-primary" type="submit">
              保存更改
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}

interface CategoryModalProps {
  onClose: () => void;
  onCreate: (name: string, color: string, outcome: string) => Promise<boolean>;
}

function CategoryModal({ onClose, onCreate }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [outcome, setOutcome] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onCreate(name, color, outcome)) onClose();
  };
  return (
    <Modal title="新建项目" eyebrow="先写结果，再列任务" onClose={onClose} size="small">
      <form className="modal-form" onSubmit={submit}>
        <label className="field field-wide">
          <span>项目名称</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：QuietDo Android MVP" maxLength={40} autoFocus />
        </label>
        <label className="field field-wide">
          <span>期望结果</span>
          <textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder="做到什么程度，这个项目才算成功？"
            maxLength={240}
            rows={3}
          />
        </label>
        <fieldset className="color-field field-wide">
          <legend>颜色</legend>
          <div className="color-options">
            {CATEGORY_COLORS.map((option) => (
              <button
                key={option}
                className={color === option ? "is-selected" : ""}
                type="button"
                style={{ background: option }}
                onClick={() => setColor(option)}
                aria-label={`选择颜色 ${option}`}
                aria-pressed={color === option}
              />
            ))}
          </div>
        </fieldset>
        <footer className="modal-footer">
          <button className="button button-ghost" type="button" onClick={onClose}>
            取消
          </button>
          <button className="button button-primary" type="submit">
            创建项目
          </button>
        </footer>
      </form>
    </Modal>
  );
}

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (input: FeedbackInput) => Promise<boolean>;
}

function FeedbackModal({ onClose, onSubmit }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackInput["type"]>("idea");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSubmit({ type, rating, content, email })) onClose();
  };
  return (
    <Modal title="告诉我们你的感受" eyebrow="每条反馈都帮助我们做减法" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <fieldset className="feedback-types field-wide">
          <legend>反馈类型</legend>
          {[
            ["like", "喜欢", "做得好的地方"],
            ["idea", "建议", "希望更顺手"],
            ["bug", "问题", "遇到异常"],
          ].map(([value, label, hint]) => (
            <button
              className={type === value ? "is-selected" : ""}
              key={value}
              type="button"
              onClick={() => setType(value as FeedbackInput["type"])}
            >
              <strong>{label}</strong>
              <span>{hint}</span>
            </button>
          ))}
        </fieldset>
        <label className="field field-wide">
          <span>满意度：{rating} / 5</span>
          <input type="range" min="1" max="5" value={rating} onChange={(event) => setRating(Number(event.target.value))} />
        </label>
        <label className="field field-wide">
          <span>具体说明</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} maxLength={2_000} placeholder="什么地方最有帮助，或最需要调整？" />
        </label>
        <label className="field field-wide">
          <span>联系邮箱（选填）</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200} placeholder="仅用于就这条反馈与你联系" />
        </label>
        <p className="privacy-note">任务标题和备注不会随反馈或埋点上传。</p>
        <footer className="modal-footer">
          <button className="button button-ghost" type="button" onClick={onClose}>
            稍后再说
          </button>
          <button className="button button-primary" type="submit">
            提交反馈
          </button>
        </footer>
      </form>
    </Modal>
  );
}

interface DataModalProps {
  onClose: () => void;
  onExport: () => Promise<string | null>;
  onImport: (content: string) => Promise<boolean>;
  onClear: () => Promise<boolean>;
}

function DataModal({ onClose, onExport, onImport, onClear }: DataModalProps) {
  const exportData = async () => {
    const content = await onExport();
    if (!content) return;
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `quietdo-${localDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (await onImport(await file.text())) onClose();
  };
  return (
    <Modal title="本地数据" eyebrow="数据属于你" onClose={onClose} size="small">
      <div className="data-actions">
        <button className="data-action" type="button" onClick={exportData}>
          <span className="data-action-icon">↓</span>
          <span><strong>导出备份</strong><small>下载版本化 JSON 文件</small></span>
        </button>
        <label className="data-action">
          <span className="data-action-icon">↑</span>
          <span><strong>导入备份</strong><small>兼容 QuietDo、遂事及原 TaskFlow 数据</small></span>
          <input className="sr-only" type="file" accept="application/json,.json" onChange={importData} />
        </label>
        <button
          className="data-action danger-action"
          type="button"
          onClick={async () => {
            if (!window.confirm("确定清空全部本地任务吗？建议先导出备份。")) return;
            if (await onClear()) onClose();
          }}
        >
          <span className="data-action-icon">×</span>
          <span><strong>清空本地数据</strong><small>此操作不可撤销</small></span>
        </button>
      </div>
    </Modal>
  );
}

function ServiceWorkerRegistration() {
  useEffect(() => {
    if (isNativeRuntime() || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}

export function TaskFlowApp() {
  const taskFlow = useTaskFlow();
  const preferenceState = usePreferences();
  const runtime = currentRuntime();
  const desktopRuntime = runtime === "desktop";
  const nativeRuntime = runtime !== "web";
  const [workspacePage, setWorkspacePage] = useState<WorkspacePage>("tasks");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("taskflow_theme_v2");
    const next = saved === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
  }, []);

  const closeDialogs = useCallback(() => {
    setEditingId(null);
    setCategoryOpen(false);
    setFeedbackOpen(false);
    setDataOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialogs();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDialogs]);

  const categoriesById = useMemo(
    () => new Map(taskFlow.categories.map((category) => [category.id, category])),
    [taskFlow.categories],
  );
  const categoryActiveCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of taskFlow.tasks) {
      if (task.deletedAt || task.done) continue;
      counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [taskFlow.tasks]);
  const heading = filterHeading(taskFlow.filter, taskFlow.categories);
  const chooseFilter = taskFlow.chooseFilter;
  const editingTask = editingId
    ? taskFlow.tasks.find((task) => task.id === editingId && !task.deletedAt) ?? null
    : null;

  const openTaskView = useCallback(
    (filter: TaskFilter) => {
      setWorkspacePage("tasks");
      chooseFilter(filter);
    },
    [chooseFilter],
  );

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("taskflow_theme_v2", next);
    void taskFlow.trackEvent("theme_toggle", { theme: next });
  };

  if (taskFlow.loading) {
    return (
      <main className="loading-screen" role="status" aria-live="polite">
        <div className="brand-mark">Q</div>
        <p>正在整理你的任务空间…</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <ServiceWorkerRegistration />
      <header className={`topbar ${desktopRuntime ? "desktop-topbar" : ""}`} data-tauri-drag-region={desktopRuntime ? "" : undefined}>
        <a className="brand" href="#main-content" aria-label="QuietDo 首页">
          <span className="brand-mark">Q</span>
          <span><strong>QuietDo</strong><small>轻作 · 把注意力留给重要的事</small></span>
        </a>
        <div className="topbar-actions">
          <span className={`storage-status ${taskFlow.persistenceReady ? "" : "is-warning"}`}>
            <i />{taskFlow.persistenceReady ? (runtime === "desktop" ? "已保存在此 Mac" : runtime === "android" ? "已保存在此手机" : "已保存在此设备") : "仅本次会话"}
          </span>
          <button className="topbar-button" type="button" onClick={() => setDataOpen(true)}>
            数据
          </button>
          {nativeRuntime ? null : (
            <button className="topbar-button" type="button" onClick={() => setFeedbackOpen(true)}>
              反馈
            </button>
          )}
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="切换明暗主题">
            ◐
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="任务导航">
          <nav>
            <p className="sidebar-label">工作台</p>
            <button
              className={`nav-item ${workspacePage === "tasks" && taskFlow.filter === "category:inbox" ? "is-active" : ""}`}
              type="button"
              onClick={() => openTaskView("category:inbox")}
            >
              <span className="nav-icon">□</span>
              <span>收件箱</span>
              <strong>{categoryActiveCounts.get("inbox") ?? 0}</strong>
            </button>
            <button
              className={`nav-item ${workspacePage === "tasks" && taskFlow.filter === "today" ? "is-active" : ""}`}
              type="button"
              onClick={() => openTaskView("today")}
            >
              <span className="nav-icon">●</span>
              <span>今天</span>
              <strong>{taskFlow.counts.today}</strong>
            </button>
            <button
              className={`nav-item ${workspacePage === "projects" ? "is-active" : ""}`}
              type="button"
              onClick={() => setWorkspacePage("projects")}
            >
              <span className="nav-icon">▦</span>
              <span>项目</span>
              <strong>{Math.max(0, taskFlow.categories.length - 1)}</strong>
            </button>
            <button
              className={`nav-item ${workspacePage === "review" ? "is-active" : ""}`}
              type="button"
              onClick={() => setWorkspacePage("review")}
            >
              <span className="nav-icon">↻</span>
              <span>回顾</span>
              <strong>{taskFlow.review.summary.total}</strong>
            </button>
            <button
              className={`nav-item ${workspacePage === "settings" ? "is-active" : ""}`}
              type="button"
              onClick={() => setWorkspacePage("settings")}
            >
              <span className="nav-icon">⌘</span>
              <span>设置</span>
              <strong>·</strong>
            </button>
          </nav>
          <nav>
            <p className="sidebar-label">智能视图</p>
            {SECONDARY_FILTERS.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${workspacePage === "tasks" && taskFlow.filter === item.key ? "is-active" : ""}`}
                type="button"
                onClick={() => openTaskView(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                <strong>{taskFlow.counts[item.key]}</strong>
              </button>
            ))}
          </nav>
          <nav className="category-nav">
            <div className="sidebar-section-heading">
              <p className="sidebar-label">项目与领域</p>
              <button type="button" onClick={() => setCategoryOpen(true)} aria-label="新建项目">+</button>
            </div>
            {taskFlow.categories.filter((category) => category.id !== "inbox").map((category) => {
              const key = `category:${category.id}` as TaskFilter;
              return (
                <button
                  className={`nav-item ${workspacePage === "tasks" && taskFlow.filter === key ? "is-active" : ""}`}
                  key={category.id}
                  type="button"
                  onClick={() => openTaskView(key)}
                >
                  <span className="category-dot" style={{ background: category.color }} />
                  <span>{category.name}</span>
                  <strong>{categoryActiveCounts.get(category.id) ?? 0}</strong>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-note">
            <span>LOCAL FIRST</span>
            <p>任务正文只保存在此设备。匿名埋点不会包含标题和备注。</p>
          </div>
        </aside>

        <main className="main-content" id="main-content">
          <div className="mobile-filters" aria-label="移动端工作台导航">
            <button
              className={workspacePage === "tasks" && taskFlow.filter === "today" ? "is-active" : ""}
              type="button"
              onClick={() => openTaskView("today")}
            >今天</button>
            <button
              className={workspacePage === "tasks" && taskFlow.filter === "category:inbox" ? "is-active" : ""}
              type="button"
              onClick={() => openTaskView("category:inbox")}
            >收件箱</button>
            <button className={workspacePage === "projects" ? "is-active" : ""} type="button" onClick={() => setWorkspacePage("projects")}>项目</button>
            <button className={workspacePage === "review" ? "is-active" : ""} type="button" onClick={() => setWorkspacePage("review")}>回顾</button>
            <button className={workspacePage === "settings" ? "is-active" : ""} type="button" onClick={() => setWorkspacePage("settings")}>设置</button>
          </div>

          {workspacePage === "projects" ? (
            <ProjectsPanel
              categories={taskFlow.categories}
              tasks={taskFlow.tasks}
              onOpenProject={(categoryId) => openTaskView(`category:${categoryId}`)}
              onCreateProject={() => setCategoryOpen(true)}
            />
          ) : workspacePage === "review" ? (
            <ReviewPanel
              items={taskFlow.review.items}
              summary={taskFlow.review.summary}
              categories={taskFlow.categories}
              onEditTask={(taskId) => setEditingId(taskId)}
            />
          ) : workspacePage === "settings" ? (
            <SettingsPanel
              preferences={preferenceState.preferences}
              onSave={preferenceState.savePreferences}
              onOpenData={() => setDataOpen(true)}
            />
          ) : (
            <>
              <section className="hero-row">
                <div>
                  <p className="eyebrow">{DATE_FORMATTER.format(new Date())}</p>
                  <h1>{heading.title}</h1>
                  <p>{heading.subtitle}</p>
                </div>
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    type="search"
                    value={taskFlow.search}
                    onChange={(event) => taskFlow.setSearch(event.target.value)}
                    onFocus={() => void taskFlow.trackEvent("search_focus")}
                    placeholder="搜索标题、下一步和完成条件"
                    aria-label="搜索任务"
                  />
                </label>
              </section>

              <section className="focus-strip" aria-label="今日重点">
                <div>
                  <span>需要你关注</span>
                  <strong>{taskFlow.review.summary.total}</strong>
                  <small>项任务需要澄清或重新安排</small>
                </div>
                <button type="button" onClick={() => setWorkspacePage("review")}>开始回顾 →</button>
              </section>

              <section className="stats-grid" aria-label="任务统计">
                {[
                  ["总任务", taskFlow.stats.total, "01"],
                  ["进行中", taskFlow.stats.active, "02"],
                  ["已完成", taskFlow.stats.completed, "03"],
                  ["完成率", `${taskFlow.stats.completionRate}%`, "04"],
                  ["已逾期", taskFlow.stats.overdue, "05"],
                ].map(([label, value, index]) => (
                  <article className="stat-card" key={label}>
                    <span>{index}</span>
                    <strong>{value}</strong>
                    <small>{label}</small>
                  </article>
                ))}
              </section>

              <section className="task-section">
                <div className="section-heading">
                  <div>
                    <h2>任务清单</h2>
                    <p>{taskFlow.visibleTasks.length} 项正在当前视图中</p>
                  </div>
                  <button className="button button-primary add-button" type="button" onClick={() => setQuickAddOpen(true)}>
                    <span>+</span> 添加任务
                  </button>
                </div>

                {quickAddOpen ? (
                  <QuickAdd categories={taskFlow.categories} onAdd={taskFlow.addTask} onClose={() => setQuickAddOpen(false)} />
                ) : null}

                <div className="task-list" aria-live="polite">
                  {taskFlow.visibleTasks.length ? (
                    taskFlow.visibleTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        category={categoriesById.get(task.categoryId)}
                        onToggle={() => taskFlow.toggle(task.id)}
                        onEdit={() => {
                          setEditingId(task.id);
                          void taskFlow.trackEvent("task_edit_open");
                        }}
                        onDelete={() => taskFlow.removeTask(task.id)}
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <span>✓</span>
                      <h3>这里已经很清爽</h3>
                      <p>{taskFlow.search ? "换个关键词试试，或清空搜索。" : "添加一项具体、可完成的下一步。"}</p>
                      <button className="button button-primary" type="button" onClick={() => setQuickAddOpen(true)}>
                        添加任务
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {workspacePage === "tasks" ? (
        <button className="floating-add" type="button" onClick={() => setQuickAddOpen(true)} aria-label="添加任务">+</button>
      ) : null}

      {editingTask ? (
        <EditTaskModal
          task={editingTask}
          categories={taskFlow.categories}
          onClose={() => setEditingId(null)}
          onSave={(patch) => taskFlow.editTask(editingTask.id, patch)}
          onDelete={() => taskFlow.removeTask(editingTask.id)}
        />
      ) : null}
      {categoryOpen ? <CategoryModal onClose={() => setCategoryOpen(false)} onCreate={taskFlow.addCategory} /> : null}
      {feedbackOpen ? <FeedbackModal onClose={() => setFeedbackOpen(false)} onSubmit={taskFlow.submitFeedback} /> : null}
      {dataOpen ? (
        <DataModal
          onClose={() => setDataOpen(false)}
          onExport={taskFlow.exportData}
          onImport={taskFlow.importData}
          onClear={taskFlow.clearData}
        />
      ) : null}
      {taskFlow.notice ? (
        <div className={`toast toast-${taskFlow.notice.tone}`} role="status" key={taskFlow.notice.id}>
          <span>{taskFlow.notice.tone === "success" ? "✓" : "!"}</span>
          {taskFlow.notice.message}
        </div>
      ) : null}
    </div>
  );
}
