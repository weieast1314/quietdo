<div align="center">
  <img src="apps/web/public/favicon.svg" width="88" height="88" alt="QuietDo 轻作图标">
  <h1>QuietDo · 轻作</h1>
  <p>一个把意图变成明确下一步的本地优先个人任务工作台。</p>

  简体中文 · [English](README.md)

  [![CI](https://github.com/weieast1314/quietdo/actions/workflows/ci.yml/badge.svg)](https://github.com/weieast1314/quietdo/actions/workflows/ci.yml)
  [![Release](https://img.shields.io/github/v/release/weieast1314/quietdo?include_prereleases)](https://github.com/weieast1314/quietdo/releases)
  [![License](https://img.shields.io/github/license/weieast1314/quietdo)](LICENSE)
  [![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://v2.tauri.app/)
</div>

> [!IMPORTANT]
> QuietDo 目前仍处于 **Alpha 阶段**。源码构建主要用于开发和评估；预览版 macOS DMG 使用 ad-hoc 签名且尚未公证，预览版 Android APK 使用测试证书。再次分发前请先阅读[发行指南](docs/DISTRIBUTION.zh-CN.md)。

## 为什么做 QuietDo？

许多待办软件只保存清单，仍然需要用户自己长期整理。QuietDo 关注任务的完整生命周期：快速收集、明确下一步、定义完成条件，并在回顾中找出逾期、停滞或含糊不清的任务。

`QuietDo` 由两个直白的词组成：**Quiet** 表示低打扰、尊重注意力，**Do** 表示把下一步真正做起来。中文名“轻作”强调轻量和低摩擦——任务管理本身不应该成为新的负担。

QuietDo 不会变成拥有无限权限的万能助理，而是坚持几个边界：

- **任务优先：** 打开产品首先看到任务工作台，而不是聊天窗口。
- **本地优先：** 任务正文保存在设备上，断网也能使用。
- **建议优先：** 智能能力只提出建议，不在后台擅自操作其他应用。
- **数据属于用户：** 可以导出结构明确的 JSON 备份并重新导入。
- **没有 AI 也完整可用：** 收集、回顾、项目和备份不依赖模型服务。

## 当前能力

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 收件箱、今天、项目、领域、智能视图 | 已实现 | Web 与原生壳共用 |
| 下一步动作与完成条件 | 已实现 | 随任务一起保存在本地 |
| 离线智能收集 | 已实现 | 通过确定性规则识别日期、优先级和 `#项目` |
| 任务回顾 | 已实现 | 在本地发现逾期、停滞、含糊和信息不完整的任务 |
| JSON 备份与恢复 | 已实现 | 兼容 QuietDo 及旧版遂事/TaskFlow 数据 |
| PWA / 离线应用外壳 | 已实现 | 仅 Web 使用；原生端不会注册 Service Worker |
| AI 服务商及隐私范围设置 | 仅配置 | 0.4.0 **不会**把任务内容发送给大模型 |
| WebDAV | 仅配置 | 凭据保存与同步引擎尚未实现 |
| 加密多端同步 | 规划中 | 参见[路线图](#路线图) |

## 平台与安装包

维护者发布预览安装包时，会将其附加到 [GitHub Releases](https://github.com/weieast1314/quietdo/releases)，不会提交到 Git 历史。

| 平台 | 最低版本 / 目标 | 发行形式 | 状态 |
| --- | --- | --- | --- |
| Web / PWA | 主流现代浏览器 | 从 `apps/web` 自行部署 | 支持 |
| macOS | macOS 12+，Apple Silicon 与 Intel | Universal DMG | 预览版 |
| Android | Android 7.0+（API 24），ARM64/ARMv7 | APK 侧载 | 预览版 |
| Windows | Windows 10/11 | 草稿发行工作流生成 NSIS | 实验性，尚未真机验证 |
| Linux | Ubuntu 22.04+ 或兼容发行版 | 草稿发行工作流生成 DEB 与 AppImage | 实验性，尚未真机验证 |
| iOS | — | — | 规划中 |

正式进入应用商店前，Android 必须使用长期保存的发布密钥和 AAB，macOS 必须使用 Developer ID 签名并完成 Apple 公证。详见[发行指南](docs/DISTRIBUTION.zh-CN.md)。

### 从旧版遂事预览版升级

QuietDo 0.4.0 使用新的原生应用标识 `com.weieast.quietdo`，不会自动读取旧预览版的数据容器。替换安装前，请先在旧应用的“数据”窗口导出 JSON 备份，再安装 QuietDo 并导入。导入器会继续兼容旧版遂事和原 TaskFlow 导出的数据。

## 快速开始

### 环境要求

- Node.js 22.13 或更高版本及 npm
- 构建原生端需要 Rust stable
- [Tauri 2](https://v2.tauri.app/start/prerequisites/) 对应平台的系统依赖

### Web / PWA

```bash
cd apps/web
npm ci
npm run dev
```

打开 <http://localhost:3000>。完整质量检查：

```bash
npm run lint
npm test
```

`npm test` 会执行生产构建、产物检查、数据库迁移检查、领域规则测试和 API 输入校验测试。

### macOS 桌面端

```bash
cd apps/desktop
npm ci
npm run desktop:dev
```

构建同时支持 Apple Silicon 与 Intel 的 DMG：

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
npm run desktop:build:universal
```

### Android 预览版

先安装 JDK 17+、Android SDK/NDK 和 Android Rust targets，然后执行：

```bash
cd apps/desktop
npm ci
npm run android:init -- --ci
npm run android:build
```

最后一个命令会生成经过优化、使用本地 Android 测试密钥签名的 APK。它只适合侧载和测试，不能直接提交 Google Play。准确的依赖版本与正式签名边界参见[发行指南](docs/DISTRIBUTION.zh-CN.md)。

## 架构

```text
apps/web/
├── app/             React 界面与 Web API 路由
├── application/     应用用例与乐观更新
├── domain/          任务模型与纯领域规则
└── infrastructure/  IndexedDB、投递队列、运行时适配

apps/desktop/
├── src/             Tauri 专用 React 入口与样式
└── src-tauri/       桌面及 Android 共用的 Rust/Tauri 原生壳
```

代码依赖方向为 `UI → Application → Domain`，浏览器与原生能力放在基础设施适配层。Tauri 原生壳直接复用 React 应用和领域模型，不维护另一套任务服务端。

### 数据与隐私边界

- 任务、分类和任务 outbox 以设备 IndexedDB 中的数据为准。
- 主题、AI 授权开关和非敏感 WebDAV 字段等偏好保存在设备上。
- 0.4.0 不持久化 WebDAV 密码。
- 本地智能收集与回顾都是确定性规则，不需要网络请求。
- 原生版本不会发送 Web 端匿名埋点。
- 部署后的 Web 版本可以向配置好的 D1 API 发送匿名产品事件和用户主动提交的反馈；其中不包含任务标题和备注。

更完整的设计背景请阅读[产品需求](docs/PRD.zh-CN.md)和[系统架构](docs/ARCHITECTURE.zh-CN.md)。

## 仓库结构

```text
.github/       CI、草稿发行工作流、社区模板和 Dependabot
apps/web/      共享 React 应用及可选的 Web/PWA 部署
apps/desktop/  macOS、Android、Windows、Linux 共用的 Tauri 2 原生壳
docs/          产品、架构、开发与发行文档
releases/      只保存发行说明；二进制放在 GitHub Releases
```

## 路线图

- 支持冲突查看与恢复的加密、操作日志式 WebDAV 同步。
- 用户可控的本地模型或 OpenAI-compatible 模型接入。
- 正式签名、公证及 Android AAB 商店发行。
- Windows 与 Linux 稳定性验证。
- 在同步模型稳定后探索 iOS。

路线图只表示方向，不承诺具体日期。准备开发较大功能前，请先提交 [Feature Request](https://github.com/weieast1314/quietdo/issues/new/choose)。

## 参与贡献

欢迎提交 Issue 和 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，遵守[行为准则](CODE_OF_CONDUCT.md)；安全漏洞请按照 [SECURITY.md](SECURITY.md) 私下报告。

## 发行方式

QuietDo 遵循语义化版本。常规 Pull Request 会运行 Web 测试与原生编译检查；维护者手动启动草稿发行工作流，检查生成的跨平台产物，在预览流程之外完成正式签名，确认无误后再发布 GitHub Release。详见[发行指南](docs/DISTRIBUTION.zh-CN.md)。

## 开源许可证

QuietDo 使用 [MIT License](LICENSE)。

“QuietDo / 轻作”目前只经过初步重名检索，不构成法律意义上的商标清查。再次发行者需要自行确认所在地区的名称、商标及应用商店要求。
