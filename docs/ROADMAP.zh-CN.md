# QuietDo · 轻作研发任务清单

> **版本** v2.3 | **更新日期** 2026-07-16
> 基于 [`ARCHITECTURE.zh-CN.md`](ARCHITECTURE.zh-CN.md) v2.3，状态以当前工作区实现为准。

## 一、Phase 1 交付状态

| 模块 | 任务 | 优先级 | 状态 | 验收证据 |
|---|---|---:|---|---|
| 架构 | macOS-first + local-first + 多端共享演进方案 | P0 | ✅ 完成 | 架构方案 v2.2 |
| macOS 壳 | Tauri 2 原生窗口、图标、最小权限 | P0 | ✅ 完成 | `apps/desktop/src-tauri` |
| 桌面复用 | 共享 React UI、Application、Domain、IndexedDB | P0 | ✅ 完成 | 桌面 Vite 别名与运行时适配 |
| macOS 安装包 | `.app` + Universal `.dmg` | P0 | ✅ 构建链路完成 | 通过 GitHub Release 草稿工作流生成 |
| Android 壳 | Tauri 2、API 24+、安全区与移动运行时 | P0 | ✅ 完成 | `apps/desktop/src-tauri/gen/android` |
| Android 安装包 | ARM64/ARMv7 优化测试 `.apk` | P0 | ✅ 构建链路完成 | 通过 GitHub Release 草稿工作流生成 |
| 工程 | Vite/vinext + React + TypeScript 工程化 | P0 | ✅ 完成 | `apps/web` 生产构建 |
| 领域 | Task/Category v3、下一步、完成条件、项目结果、tombstone、revision | P0 | ✅ 完成 | `domain/task.ts` + 单元测试 |
| 应用 | 创建、编辑、删除、完成、分类用例 | P0 | ✅ 完成 | `application/use-taskflow.ts` |
| 视图 | 全部/今天/即将到来/逾期/完成/分类筛选 | P0 | ✅ 完成 | 领域测试 + UI |
| 搜索 | 标题与备注延迟搜索 | P1 | ✅ 完成 | `useDeferredValue` + 领域函数 |
| 统计 | 总数、进行中、完成、累计完成率、逾期 | P1 | ✅ 完成 | `calculateStats` 测试 |
| 本地存储 | IndexedDB 任务/分类仓储 | P0 | ✅ 完成 | `infrastructure/taskflow-db.ts` |
| 智能收集 | 本地识别日期、优先级和 `#项目` | P1 | ✅ 完成 | `parseSmartCapture` 测试 + UI |
| 智能回顾 | 逾期、停滞、模糊、缺少下一步/完成条件 | P0 | ✅ 完成 | `buildTaskReview` 测试 + 回顾页 |
| 项目 | 项目结果、进度和任务入口 | P1 | ✅ 完成 | 项目页 + 新建项目弹窗 |
| AI 设置 | 关闭/本地/云端模式与内容授权范围 | P1 | ✅ 配置完成 | 默认关闭；当前不自动调用模型 |
| 同步设置 | 手动备份与 WebDAV 非敏感配置 | P1 | ✅ 配置完成 | Web 端明确不执行 WebDAV 同步 |
| 数据迁移 | 原型 localStorage / v2 IndexedDB → v3 | P0 | ✅ 完成 | 兼容迁移与导入测试 |
| 数据可携带 | 版本化 JSON 导入/导出 | P1 | ✅ 完成 | 数据管理弹窗 |
| 同步预留 | 事务化 Outbox、operationId、baseRevision | P0 | ✅ 完成 | IndexedDB `outbox` store |
| 埋点 | anonymousId/sessionId/schemaVersion | P1 | ✅ 完成 | `infrastructure/telemetry.ts` |
| 可靠投递 | 本地队列、联网/可见性重试、幂等 ID | P0 | ✅ 完成 | `deliveries` store + API |
| 反馈 | 类型、评分、内容、选填邮箱 | P2 | ✅ 完成 | 反馈弹窗 + `/api/feedback` |
| 薄后端 | 事件与反馈 D1 API | P0 | ✅ 完成 | API routes + SQL migration |
| PWA | manifest、Service Worker、应用 Shell 缓存 | P1 | ✅ 完成 | `public/manifest.webmanifest`、`sw.js` |
| 响应式 | 桌面侧栏、移动筛选条、移动底部弹窗 | P0 | ✅ 完成 | `app/globals.css` |
| 无障碍 | 标签、焦点态、状态播报、减少动效 | P1 | ✅ 完成 | UI 语义与 CSS |
| 质量 | 构建产物、领域、API 校验、迁移测试 | P0 | ✅ 完成 | `npm test` |
| 发布 | Sites 生产版本 | P0 | ⚠️ 平台账户身份不可用 | 本地构建与 D1 迁移已就绪；待 Sites 恢复账户上下文后发布 |

## 二、里程碑

| 里程碑 | 范围 | 状态 |
|---|---|---|
| M0 架构基线 | ADR、分层、数据/同步协议 | ✅ 完成 |
| M1 本地核心闭环 | 任务、项目、下一步、完成条件、筛选、搜索、统计、主题 | ✅ 完成 |
| M2 可靠数据层 | IndexedDB、迁移、Outbox、导入导出 | ✅ 完成 |
| M3 可测量 MVP | 匿名埋点、反馈、D1、失败重试 | ✅ 完成 |
| M3.1 AI-native 工作台 | 智能收集、本地回顾、AI/同步权限边界 | ✅ 完成 |
| M4 macOS 首发 | Tauri、ad-hoc 签名、Universal DMG、运行验证 | ✅ 完成 |
| M4.1 Android MVP | Tauri Android、共享 UI、通用 APK | ✅ 完成 |
| M5 Web 发布 | PWA、响应式、Sites 生产发布 | ⚠️ 质量完成，发布受平台账户阻塞 |

## 三、Phase 2 待办（需产品信号触发）

| 编号 | 任务 | 触发条件 | 说明 |
|---|---|---|---|
| P2-01 | 桌面 SQLite Adapter | 桌面数据规模或可靠性需要 | 保持 Storage Port，迁移 IndexedDB 数据 |
| P2-02 | WebDAV SyncProvider | 多设备同步进入验证 | operation 文件、哈希、快照、单并发保守写入 |
| P2-03 | 冲突处理 UI | 真实冲突率可观测 | 非重叠字段自动合并，同字段由用户决策 |
| P2-04 | Android 正式发布 | 进入外部测试或商店上架 | 独立 release keystore、AAB、Play Console 合规资料 |
| P2-05 | 官方同步服务 | 用户明确需要免配置同步 | 账号、增量 push/pull 与可选 PostgreSQL |
| P2-06 | 提醒通知 | 提醒被确定为高价值需求 | 使用平台通知能力，不与核心 CRUD 耦合 |
| P2-07 | Apple 正式签名 | 外部公开下载前 | Developer ID、notarization、stapling |

## 四、不进入当前范围

- Redis、Kafka/RabbitMQ、Elasticsearch、ClickHouse、Kubernetes。
- Auth/Task/User/Sync 多个独立部署服务。
- 因 DAU 数字自动触发微服务拆分。
- 普通任务字段使用 CRDT。
- 在未验证多端需求前上传任务正文。

## 五、发布前后检查

- [x] `npm run lint`
- [x] `npm test`
- [x] D1 迁移已生成并检查
- [x] 分享图与元数据已接入
- [x] Universal DMG 已构建并校验
- [x] `.app` ad-hoc 签名验证通过
- [x] 打包后的原生进程已启动验证
- [ ] Sites 版本保存成功（当前会话缺少平台账户身份）
- [ ] 生产部署状态为 Ready
- [ ] 回填生产 URL 与版本号
