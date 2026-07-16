# QuietDo · 轻作 Web

QuietDo 是一个本地优先、AI-native 的个人任务工作台。它不做万能助理，而是帮助用户快速收集任务、明确下一步和完成条件，并通过本地回顾重新建立对清单的信任。任务正文保存在浏览器 IndexedDB；匿名埋点和用户主动提交的反馈通过可靠投递队列写入 D1。

## 当前功能

- 收件箱、今天、智能视图、项目与领域导航。
- 任务的下一步动作与可检查完成条件。
- 离线智能收集：识别“今天/明天/后天”、优先级和 `#项目`。
- 本地回顾：发现逾期、长期未推进、标题模糊和缺少关键信息的任务。
- AI 模式和内容授权范围配置；默认关闭，不会自动调用模型。
- 手动备份和 WebDAV 非敏感配置；Web 版不伪装成已完成同步。

## 本地运行

```bash
npm install
npm run dev
```

开发地址默认为 `http://localhost:3000`。

## 质量检查

```bash
npm run lint
npm test
```

`npm test` 会执行生产构建、构建产物检查、D1 迁移检查、领域规则测试和 API 输入校验测试。

## 目录边界

```text
app/             React UI 与 API routes
application/     应用用例与乐观更新
domain/          任务模型和纯领域函数
infrastructure/  IndexedDB、Outbox、埋点投递
db/              D1 Drizzle schema
drizzle/         可审计 SQL 迁移
public/          PWA 与分享资源
```

依赖方向为 `UI → Application → Domain`，浏览器和云平台能力封装在 `Infrastructure`。

## 数据策略

- `tasks`、`categories`：IndexedDB 权威数据。
- `outbox`：记录未来 Phase 2 云同步需要的幂等变更。
- `deliveries`：暂存尚未被 API 确认的匿名事件和反馈。
- `localStorage`：只保存主题、版本化设备偏好，以及只读迁移旧原型 `taskflow_data_v1`。
- D1：只保存匿名事件和反馈，不保存任务标题、备注或分类名称。

任务模型当前为 v3。加载时会把已有 v2 记录原地标准化，v2/v3 JSON 备份均可导入。

## AI 与同步边界

- 本地智能收集和回顾是确定性规则，不需要网络，也不发送任务内容。
- AI 接口地址、模型名和内容授权范围只作为设备偏好保存；当前版本不会后台调用。
- WebDAV 地址和用户名可预先保存，但凭据及同步引擎留给 macOS 桌面端；浏览器不会尝试绕过 CORS。

## D1

`.openai/hosting.json` 声明逻辑绑定 `DB`。数据库结构位于 `db/schema.ts`，迁移位于 `drizzle/`。

```bash
npm run db:generate
```

## PWA

`public/sw.js` 提供应用 Shell 离线缓存。网络恢复、页面重新可见和应用启动时，客户端会主动重试投递队列；不把兼容性有限的 Background Sync 当作正确性前提。
