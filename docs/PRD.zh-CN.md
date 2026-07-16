# QuietDo · 轻作待办事项管理应用 — 产品需求文档（PRD）

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.3 |
| 编写日期 | 2026-06-26（2026-07-16 品牌与 Android 同步） |
| 编写人 | Wei East |
| 文档状态 | 已评审，Phase 1 实施中 |
| 原型参考 | `index.html`（已通过原型验证） |

---

## 一、背景

### 1.1 需求背景
团队在需求规划阶段提出构建一款待办事项管理应用，用以解决现有备忘录工具**结构化能力不足**的问题。通过高保真可交互原型对目标用户进行了验证，核心假设（结构化管理需求、完成正反馈、逾期提醒价值）均得到确认，验证通过。本 PRD 基于原型验证结论编写，作为研发与设计的正式输入。

### 1.2 现状与问题
| 问题 | 影响 |
|------|------|
| 系统备忘录无分类、优先级、截止日期 | 任务混杂，难以区分轻重缓急 |
| 缺乏逾期提醒 | 重要任务容易被遗漏 |
| 无完成进度可视化 | 缺乏成就感激励，难以持续使用 |

### 1.3 竞品参考
Todoist、滴答清单、Microsoft To Do。本产品差异化定位：**任务优先、本地优先、建议优先、用户拥有数据**。AI 不作为聊天入口，也不自动接管用户设备。

---

## 二、目标

### 2.1 业务目标
- 提供一款开箱即用的待办管理工具，验证结构化任务管理的用户价值
- 建立用户使用习惯，为后续账号体系与多端同步奠定基础

### 2.2 产品目标
| 目标 | 衡量指标 |
|------|----------|
| 核心流程可用 | 创建→编辑→完成 流程完成率 ≥ 80% |
| 持续使用 | 7 日回访率 ≥ 40% |
| 反馈正向 | 反馈提交率 ≥ 30%，正向反馈占比 ≥ 60% |

---

## 三、用户故事

| 编号 | 角色 | 故事 | 优先级 |
|------|------|------|--------|
| US-01 | 用户 | 我希望能快速创建一个待办任务，以便记录脑海中的事项 | P0 |
| US-02 | 用户 | 我希望能为任务设置分类、优先级和截止日期，以便区分轻重缓急 | P0 |
| US-03 | 用户 | 我希望能标记任务完成，以便获得完成感 | P0 |
| US-04 | 用户 | 我希望能按"今天/即将到来/已逾期/已完成"筛选任务，以便聚焦当前要事 | P0 |
| US-05 | 用户 | 我希望能看到逾期任务的高亮提醒，以便及时补救 | P0 |
| US-06 | 用户 | 我希望能搜索任务，以便快速定位 | P1 |
| US-07 | 用户 | 我希望能自定义分类，以便匹配我的工作/生活场景 | P1 |
| US-08 | 用户 | 我希望能看到任务统计（完成率等），以便了解自己的执行力 | P1 |
| US-09 | 用户 | 我希望能切换深色模式，以便在不同光线环境下使用 | P2 |
| US-10 | 用户 | 我希望能提交使用反馈，以便帮助产品改进 | P2 |
| US-11 | 用户 | 我希望为任务写下下一步和完成条件，以便减少再次理解的成本 | P0 |
| US-12 | 用户 | 我希望系统在本地发现逾期、模糊和停滞任务，以便定期清理清单 | P0 |
| US-13 | 用户 | 我希望明确控制 AI 能读取哪些内容，以便保护任务隐私 | P1 |
| US-14 | 用户 | 我希望保留手动备份和 WebDAV 配置，以便未来在多端间迁移和同步 | P1 |

---

## 四、功能清单

| 模块 | 功能 | 优先级 | 说明 |
|------|------|--------|------|
| 任务管理 | 创建任务 | P0 | 标题必填；分类/优先级/截止日期可选 |
| | 下一步与完成条件 | P0 | 任务可记录当前可执行动作和可检查结果 |
| 智能收集 | 自然语言解析 | P1 | 本地识别相对日期、优先级与 `#项目`，不调用云端 |
| 回顾 | 本地整理建议 | P0 | 识别逾期、停滞、模糊和缺少关键信息的任务 |
| 项目 | 项目结果与进度 | P1 | 项目页展示期望结果、进行中和已完成数量 |
| 设置 | AI 模式与内容范围 | P1 | 默认关闭；设置只保存于设备，当前不自动调用 |
| | 同步方式 | P1 | 手动备份已可用；WebDAV 仅保存非敏感配置，等待桌面同步引擎 |
| | 编辑任务 | P0 | 编辑全部字段 |
| | 删除任务 | P0 | 列表快捷删除 + 编辑弹窗删除 |
| | 标记完成/取消完成 | P0 | 复选框交互 |
| 视图筛选 | 全部/今天/即将到来/已逾期/已完成 | P0 | 侧边栏切换，实时计数 |
| 分类管理 | 新建分类（名称+颜色） | P1 | 自定义分类 |
| | 按分类筛选 | P1 | 侧边栏分类列表 |
| 优先级 | 高/中/低 | P0 | 颜色标签 + 列表排序依据 |
| 截止日期 | 日期选择 + 智能展示 | P0 | 今天/明天/逾期N天 |
| | 逾期高亮 | P0 | 红色边框 + 红色标签 |
| 搜索 | 关键词搜索 | P1 | 标题+备注匹配 |
| 统计 | 5 项核心指标卡片 | P1 | 总数/进行中/已完成/完成率/逾期 |
| 主题 | 浅色/深色切换 | P2 | 状态持久化 |
| 数据持久化 | IndexedDB | P0 | 刷新/离线不丢失；支持旧原型数据迁移与 JSON 导入导出 |
| 反馈收集 | 反馈弹窗 | P2 | 类型+评分+文字+联系方式 |
| 埋点 | 事件埋点 | P1 | 本地可靠队列 + 匿名远程采集 |

---

## 五、需求描述（EARS 原则）

> 采用 EARS（Easy Approach to Requirements Syntax）确保表述无歧义。

### 5.1 任务管理

| 编号 | 类型 | 需求描述 |
|------|------|----------|
| REQ-01 | Ubiquitous | The system shall persist task and category data to IndexedDB, ensuring no data loss on page refresh or temporary network loss. |
| REQ-02 | Event-driven | **When** the user clicks the add button (FAB), **the system shall** display the quick-add panel with title input focused. |
| REQ-03 | Event-driven | **When** the user enters a title and presses Enter or clicks "添加任务", **the system shall** create a new task with the selected category, priority, and due date, and prepend it to the task list. |
| REQ-04 | Unwanted | **If** the user attempts to add/save a task with an empty title, **the system shall** show a warning toast and prevent creation. |
| REQ-05 | Event-driven | **When** the user clicks the task checkbox, **the system shall** toggle the task's completion state, play the check animation, and show a celebratory toast on completion. |
| REQ-06 | Event-driven | **When** the user clicks a task card, **the system shall** open the edit modal pre-filled with the task's current values. |
| REQ-07 | Event-driven | **When** the user clicks the delete action, **the system shall** remove the task immediately and show a deletion toast. |
| REQ-08 | Event-driven | **When** the user clicks "清空数据", **the system shall** show a confirmation dialog; only upon confirmation shall it clear all tasks and categories. |

### 5.2 视图与筛选

| 编号 | 类型 | 需求描述 |
|------|------|----------|
| REQ-09 | State-driven | **While** a filter (全部/今天/即将到来/已逾期/已完成) is active, **the system shall** display only tasks matching that filter, and highlight the active nav item. |
| REQ-10 | State-driven | **While** a category filter is active, **the system shall** display only tasks in that category. |
| REQ-11 | Ubiquitous | The system shall display real-time task counts next to each filter and category in the sidebar. |
| REQ-12 | Event-driven | **When** the user types in the search box, **the system shall** filter tasks by matching the query against task titles and notes in real time. |

### 5.3 截止日期与逾期

| 编号 | 类型 | 需求描述 |
|------|------|----------|
| REQ-13 | Event-driven | **When** a task has a due date, **the system shall** display a smart date label (今天/明天/昨天/逾期N天/M月D日). |
| REQ-14 | State-driven | **While** a task is overdue (due date < today) and not completed, **the system shall** apply a red left border and red date tag. |

### 5.4 分类与优先级

| 编号 | 类型 | 需求描述 |
|------|------|----------|
| REQ-15 | Event-driven | **When** the user creates a new category with a name and color, **the system shall** add it to the sidebar category list and make it selectable. |
| REQ-16 | Ubiquitous | The system shall sort incomplete tasks before completed tasks, then by priority (high>medium>low), then by due date ascending. |
| REQ-17 | Optional | **Where** a task has a priority, **the system shall** display a color-coded priority tag (red/yellow/green). |

### 5.5 统计与主题

| 编号 | 类型 | 需求描述 |
|------|------|----------|
| REQ-18 | Ubiquitous | The system shall display 5 stat cards: 总任务, 进行中, 已完成, 完成率, 已逾期. |
| REQ-19 | Event-driven | **When** the user clicks the theme toggle, **the system shall** switch between light and dark themes and persist the preference. |

### 5.6 反馈与埋点

| 编号 | 类型 | 需求描述 |
|------|------|----------|
| REQ-20 | Event-driven | **When** the user clicks the feedback button, **the system shall** open the feedback modal with type selection, star rating, and text fields. |
| REQ-21 | Event-driven | **When** the user submits feedback, **the system shall** enqueue and submit it to the feedback endpoint, retrying after network failure, and show a thank-you toast after local acceptance. |
| REQ-22 | Ubiquitous | The system shall track key events (task create/toggle/edit/delete, filter change, search, theme toggle, feedback submit) with anonymousId, sessionId and schemaVersion, persist unsent events locally, and retry remote delivery. |

### 5.7 边界与异常

| 编号 | 类型 | 需求描述 |
|------|------|----------|
| REQ-23 | Unwanted | **If** IndexedDB is unavailable or a write fails, **the system shall** keep the current UI session usable, roll back any falsely confirmed mutation where possible, and clearly warn that data was not persisted. |
| REQ-24 | Unwanted | **If** a due date is in an invalid format, **the system shall** reject it and prompt for correct YYYY-MM-DD format. |
| REQ-25 | State-driven | **While** the filtered task list is empty, **the system shall** display an empty state illustration with guidance. |
| REQ-26 | State-driven | **While** the screen width ≤ 768px, **the system shall** hide the sidebar and keep task actions always visible. |
| REQ-27 | Event-driven | **When** the user exports or imports data, **the system shall** use a versioned JSON envelope, validate imported data, and preserve tombstones required for future synchronization. |

---

## 六、流程说明

### 6.1 核心流程：任务创建到完成

```
用户点击 FAB(+) → 快速添加面板展开 → 输入标题
  → (可选)选择分类/优先级/截止日期 → 回车/点击添加
  → 任务进入列表(未完成)
  → 用户点击复选框 → 标记完成(动效+Toast)
  → 任务移至已完成区/视图
```

### 6.2 任务编辑流程

```
用户点击任务卡片 → 编辑弹窗展开(预填值)
  → 修改字段 → 点击保存 → 更新列表
  → (或)点击删除 → 二次确认? 否(直接删除+Toast)
```

### 6.3 筛选流程

```
用户点击侧边栏视图/分类 → 切换 currentFilter
  → 重新过滤+排序任务列表 → 更新标题与计数
```

---

## 七、交互说明

### 7.1 快速添加面板
- 点击 FAB 后从底部展开，标题输入框自动聚焦
- 分类/优先级/日期通过下拉面板选择（**优化项**：原型使用 prompt，正式版改为原生下拉面板）
- Enter 键快速提交；取消按钮收起面板

### 7.2 任务列表项
- Hover 显示编辑/删除操作按钮（移动端常驻显示）
- 复选框点击有缩放弹动动效
- 已完成任务：标题删除线 + 整体降低透明度
- 逾期任务：左侧 3px 红色边框

### 7.3 编辑弹窗
- 居中展示，遮罩层模糊背景
- 优先级用按钮组单选，选中态高亮
- Esc 键或点击遮罩关闭
- 底部含删除/取消/保存三个操作

### 7.4 反馈弹窗
- 三种反馈类型卡片单选（喜欢/建议/问题）
- 5 星评分，hover 放大
- 文字说明 + 联系方式（选填）

### 7.5 Toast 提示
- 底部居中，2.5 秒自动消失
- 成功（绿色对勾）/ 警告（黄色感叹号）两种样式

---

## 八、数据指标

### 8.1 业务指标
| 指标 | 定义 | 目标 |
|------|------|------|
| 任务完成率 | 完成任务数 / 创建任务数 | ≥ 60% |
| 核心流程完成率 | 完成创建→编辑→完成的用户占比 | ≥ 80% |
| 7 日回访率 | 首次使用 7 天内回访 | ≥ 40% |
| 反馈提交率 | 提交反馈 / 使用用户 | ≥ 30% |

### 8.2 埋点事件清单
| 事件名 | 触发时机 | 关键属性 |
|--------|----------|----------|
| app_open | 打开应用 | taskCount |
| task_create | 创建任务 | priority, hasDate, cat |
| task_toggle | 完成/取消完成 | done |
| task_edit_open | 打开编辑 | - |
| task_edit_save | 保存编辑 | - |
| task_delete | 删除任务 | from |
| filter_change | 切换视图/分类 | filter, cat |
| search_focus | 聚焦搜索框 | - |
| theme_toggle | 切换主题 | theme |
| feedback_open | 打开反馈 | - |
| feedback_submit | 提交反馈 | type, rating, hasContent |
| category_create | 新建分类 | - |
| data_clear | 清空数据 | - |

### 8.3 数据口径
- "今天"：截止日期 = 当天日期（按本地时区 00:00 计算）
- "逾期"：截止日期 < 当天 且 任务未完成
- "完成率"：已完成任务数 / 全部任务数（含已删除前的累计）

---

## 九、验收标准

### 9.1 功能验收
| 编号 | 验收点 | 验收标准 |
|------|--------|----------|
| AC-01 | 创建任务 | 输入标题后可成功创建，空标题被拦截并提示 |
| AC-02 | 编辑任务 | 点击任务卡可编辑所有字段，保存后列表实时更新 |
| AC-03 | 删除任务 | 列表与编辑弹窗均可删除，删除后有 Toast |
| AC-04 | 标记完成 | 复选框点击切换状态，有动效与 Toast |
| AC-05 | 视图筛选 | 5 个视图筛选结果正确，计数实时更新 |
| AC-06 | 分类筛选 | 按分类筛选结果正确，计数实时更新 |
| AC-07 | 新建分类 | 可创建自定义分类，出现在侧边栏并可选 |
| AC-08 | 逾期高亮 | 逾期未完成任务显示红色边框与红色日期标签 |
| AC-09 | 智能日期 | 显示今天/明天/逾期N天/M月D日 |
| AC-10 | 搜索 | 关键词匹配标题与备注，实时过滤 |
| AC-11 | 统计卡片 | 5 项指标数值正确，完成率计算准确 |
| AC-12 | 主题切换 | 浅色/深色正常切换并持久化 |
| AC-13 | 数据持久化 | 刷新后数据不丢失 |
| AC-14 | 反馈收集 | 可选择类型/评分/填写文字并提交；断网时进入本地投递队列，恢复联网后重试 |
| AC-15 | 埋点 | 所有关键操作产生带版本的匿名事件；API 成功确认前保留在本地投递队列 |
| AC-16 | 空状态 | 无任务时显示空状态引导 |
| AC-17 | 响应式 | ≤768px 隐藏侧边栏，操作按钮常驻 |
| AC-18 | 清空数据 | 二次确认后清空，取消则不执行 |
| AC-19 | 任务澄清 | 可编辑下一步动作与完成条件，列表标识待澄清任务 |
| AC-20 | 智能收集 | 可在本地识别今天/明天/后天、优先级与 `#项目` |
| AC-21 | 项目视图 | 展示项目结果、进行中/已完成数量与完成进度 |
| AC-22 | 本地回顾 | 可发现逾期、停滞、模糊、缺少下一步或完成条件的任务 |
| AC-23 | AI 权限 | AI 默认关闭，设置页明确展示允许发送的数据范围 |
| AC-24 | 同步状态 | WebDAV 配置与真实同步状态严格区分，不显示虚假的成功状态 |

### 9.2 兼容性验收
- 主流浏览器（Chrome/Edge/Safari/Firefox）最新版正常
- 移动端浏览器（iOS Safari/Android Chrome）正常

---

## 十、待确认问题（需评审决议）

| 编号 | 问题 | 决策方 | 影响 |
|------|------|--------|------|
| Q1 | MVP 是否纳入拖拽排序 | 产品+研发 | 范围与工期 |
| Q2 | ~~本期数据存储方案：纯本地 or 后端账号体系~~ | 产品+技术 | **已决议：Phase 1 本地优先，远程仅采集匿名埋点/反馈** |
| Q3 | 是否做多端同步及优先级 | 产品 | 范围 |
| Q4 | 提醒通知技术方案 | 技术负责人 | 技术可行性 |
| Q5 | ~~快速添加字段选择器交互：下拉面板的具体形态~~ | 设计师 | **已决议：应用内原生控件，不使用 prompt** |

---

## 十一、附录

### 11.1 数据结构
```javascript
Task {
  id: string,          // 唯一ID
  title: string,       // 标题（必填）
  note: string,        // 备注
  nextAction: string,  // 当前可执行的下一步
  successCriteria: string, // 可检查的完成条件
  categoryId: string,  // 分类ID
  priority: 'high'|'medium'|'low',
  dueDate: string,     // 截止日期 YYYY-MM-DD（空串=无日期）
  done: boolean,
  completedAt: number|null,
  createdAt: number,
  updatedAt: number,
  deletedAt: number|null,
  revision: number,
  schemaVersion: 3
}

Category {
  id: string,
  name: string,
  color: string,       // hex 色值
  kind: 'area'|'project',
  outcome: string      // 项目或领域的期望结果
}
```

### 11.2 默认分类
收件箱（#9aa0b0）、工作（#6366f1）、个人（#10b981）、学习（#f59e0b）

### 11.3 关联文档
- 可交互原型：`index.html`
- 原型说明：`README.md`
- 验证结论：[`PROTOTYPE-VALIDATION.zh-CN.md`](PROTOTYPE-VALIDATION.zh-CN.md)
