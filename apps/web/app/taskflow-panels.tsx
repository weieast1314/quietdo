"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { AppPreferences } from "@/application/use-preferences";
import type {
  Category,
  ReviewReason,
  Task,
  TaskReviewItem,
} from "@/domain/task";

interface ProjectsPanelProps {
  categories: Category[];
  tasks: Task[];
  onOpenProject: (categoryId: string) => void;
  onCreateProject: () => void;
}

export function ProjectsPanel({
  categories,
  tasks,
  onOpenProject,
  onCreateProject,
}: ProjectsPanelProps) {
  const projects = useMemo(
    () =>
      categories
        .filter((category) => category.id !== "inbox")
        .map((category) => {
          let active = 0;
          let completed = 0;
          for (const task of tasks) {
            if (task.deletedAt || task.categoryId !== category.id) continue;
            if (task.done) completed += 1;
            else active += 1;
          }
          const total = active + completed;
          return {
            category,
            active,
            completed,
            progress: total ? Math.round((completed / total) * 100) : 0,
          };
        }),
    [categories, tasks],
  );

  return (
    <section className="panel-page" aria-labelledby="projects-title">
      <header className="panel-page-header">
        <div>
          <p className="eyebrow">PROJECTS, NOT PILES</p>
          <h1 id="projects-title">项目与领域</h1>
          <p>每个项目都应该指向一个结果，而不是继续堆积任务。</p>
        </div>
        <button className="button button-primary" type="button" onClick={onCreateProject}>
          + 新建项目
        </button>
      </header>

      <div className="project-grid">
        {projects.map(({ category, active, completed, progress }) => (
          <button
            className="project-card"
            key={category.id}
            type="button"
            onClick={() => onOpenProject(category.id)}
          >
            <span className="project-card-topline">
              <i style={{ background: category.color }} />
              {category.kind === "project" ? "项目" : "领域"}
            </span>
            <strong>{category.name}</strong>
            <p>{category.outcome || "还没有写下期望结果"}</p>
            <span className="progress-track" aria-label={`完成进度 ${progress}%`}>
              <i style={{ width: `${progress}%`, background: category.color }} />
            </span>
            <span className="project-card-footer">
              <small>{active} 项进行中</small>
              <small>{completed} 项已完成</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const REVIEW_REASON_LABELS: Record<ReviewReason, string> = {
  overdue: "已逾期",
  stale: "长期未推进",
  vague: "标题较模糊",
  "missing-next-action": "缺少下一步",
  "missing-success-criteria": "缺少完成条件",
};

interface ReviewPanelProps {
  items: TaskReviewItem[];
  summary: {
    overdue: number;
    stale: number;
    vague: number;
    missingNextAction: number;
    total: number;
  };
  categories: Category[];
  onEditTask: (taskId: string) => void;
}

export function ReviewPanel({
  items,
  summary,
  categories,
  onEditTask,
}: ReviewPanelProps) {
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  return (
    <section className="panel-page" aria-labelledby="review-title">
      <header className="panel-page-header review-header">
        <div>
          <p className="eyebrow">LOCAL REVIEW</p>
          <h1 id="review-title">让清单重新可信</h1>
          <p>这些建议完全在本地生成。你决定修改、保留还是删除。</p>
        </div>
        <span className="local-intelligence-badge">不发送任务内容</span>
      </header>

      <div className="review-summary-grid" aria-label="回顾摘要">
        {[
          ["需要回顾", summary.total],
          ["已逾期", summary.overdue],
          ["缺少下一步", summary.missingNextAction],
          ["长期未推进", summary.stale],
        ].map(([label, value]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>

      <div className="review-list">
        {items.length ? (
          items.map((item) => {
            const category = categoriesById.get(item.task.categoryId);
            return (
              <article className="review-item" key={item.task.id}>
                <div className="review-item-main">
                  <span className="review-project">
                    <i style={{ background: category?.color ?? "#9aa0b0" }} />
                    {category?.name ?? "收件箱"}
                  </span>
                  <h2>{item.task.title}</h2>
                  <p>{item.suggestion}</p>
                  <div className="review-reasons">
                    {item.reasons.map((reason) => (
                      <span key={reason}>{REVIEW_REASON_LABELS[reason]}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="button button-ghost"
                  type="button"
                  onClick={() => onEditTask(item.task.id)}
                >
                  整理任务
                </button>
              </article>
            );
          })
        ) : (
          <div className="empty-state compact-empty">
            <span>✓</span>
            <h3>清单目前很可信</h3>
            <p>没有逾期、模糊或长期未推进的任务。</p>
          </div>
        )}
      </div>
    </section>
  );
}

interface SettingsPanelProps {
  preferences: AppPreferences;
  onSave: (next: AppPreferences) => AppPreferences;
  onOpenData: () => void;
}

export function SettingsPanel({
  preferences,
  onSave,
  onOpenData,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState(preferences);
  const [saved, setSaved] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setDraft(onSave(draft));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2_000);
  };

  return (
    <section className="panel-page settings-page" aria-labelledby="settings-title">
      <header className="panel-page-header">
        <div>
          <p className="eyebrow">CONTROL & OWNERSHIP</p>
          <h1 id="settings-title">设置</h1>
          <p>没有 AI，它仍然是一款完整的本地任务工具。</p>
        </div>
      </header>

      <form className="settings-form" onSubmit={submit}>
        <section className="settings-card">
          <div className="settings-card-heading">
            <div>
              <span>01</span>
              <h2>AI 模式</h2>
            </div>
            <p>默认关闭；只有你明确选择的内容才会被发送。</p>
          </div>
          <div className="choice-grid">
            {[
              ["off", "关闭 AI", "只使用本地规则完成整理和回顾"],
              ["local", "本地模型", "连接 Ollama、LM Studio 等兼容接口"],
              ["cloud", "云端模型", "使用自定义的 OpenAI 兼容接口"],
            ].map(([value, label, hint]) => (
              <label className={`choice-card ${draft.aiMode === value ? "is-selected" : ""}`} key={value}>
                <input
                  type="radio"
                  name="ai-mode"
                  value={value}
                  checked={draft.aiMode === value}
                  onChange={() =>
                    setDraft((current) => ({
                      ...current,
                      aiMode: value as AppPreferences["aiMode"],
                    }))
                  }
                />
                <strong>{label}</strong>
                <span>{hint}</span>
              </label>
            ))}
          </div>

          {draft.aiMode !== "off" ? (
            <div className="settings-fields">
              <label className="field">
                <span>接口地址</span>
                <input
                  type="url"
                  value={draft.aiEndpoint}
                  placeholder={draft.aiMode === "local" ? "http://127.0.0.1:11434/v1" : "https://api.example.com/v1"}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, aiEndpoint: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>模型名称</span>
                <input
                  value={draft.aiModel}
                  placeholder="例如：qwen3:8b"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, aiModel: event.target.value }))
                  }
                />
              </label>
              <fieldset className="scope-options">
                <legend>允许发送给 AI 的内容</legend>
                {[
                  ["currentTask", "当前任务标题和备注"],
                  ["projectTasks", "所属项目中的其他任务"],
                  ["completedTasks", "历史已完成任务"],
                  ["attachments", "附件内容（尚未启用）"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={draft.aiScope[key as keyof AppPreferences["aiScope"]]}
                      disabled={key === "attachments"}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          aiScope: { ...current.aiScope, [key]: event.target.checked },
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <p className="settings-callout">当前版本只保存连接配置，不会在后台自动调用模型。API Key 将在桌面版中使用系统钥匙串保存。</p>
            </div>
          ) : null}
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div>
              <span>02</span>
              <h2>数据与同步</h2>
            </div>
            <p>本地数据库始终是主数据源，远端只负责传输。</p>
          </div>
          <div className="choice-grid two-columns">
            {[
              ["manual", "仅本机 + 手动备份", "现在可用，适合单设备使用"],
              ["webdav", "WebDAV", "保存配置，桌面同步引擎接入后启用"],
            ].map(([value, label, hint]) => (
              <label className={`choice-card ${draft.syncProvider === value ? "is-selected" : ""}`} key={value}>
                <input
                  type="radio"
                  name="sync-provider"
                  value={value}
                  checked={draft.syncProvider === value}
                  onChange={() =>
                    setDraft((current) => ({
                      ...current,
                      syncProvider: value as AppPreferences["syncProvider"],
                    }))
                  }
                />
                <strong>{label}</strong>
                <span>{hint}</span>
              </label>
            ))}
          </div>
          {draft.syncProvider === "webdav" ? (
            <div className="settings-fields">
              <label className="field">
                <span>WebDAV 地址</span>
                <input
                  type="url"
                  value={draft.webdavUrl}
                  placeholder="https://dav.example.com/taskflow"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, webdavUrl: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>用户名</span>
                <input
                  autoComplete="username"
                  value={draft.webdavUsername}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, webdavUsername: event.target.value }))
                  }
                />
              </label>
              <p className="settings-callout warning-callout">Web 版不会发起 WebDAV 同步，避免 CORS 和凭据泄露。这里保存的非敏感配置会供后续 macOS 桌面端使用。</p>
            </div>
          ) : null}
          <button className="data-settings-button" type="button" onClick={onOpenData}>
            <span>导出、导入或清空本地数据</span>
            <strong>管理本地数据 →</strong>
          </button>
        </section>

        <footer className="settings-footer">
          <span>{saved ? "设置已保存在此设备" : "设置不会随匿名埋点上传"}</span>
          <button className="button button-primary" type="submit">保存设置</button>
        </footer>
      </form>
    </section>
  );
}
