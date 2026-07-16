# QuietDo · 轻作多平台发行指南

简体中文 · [English](DISTRIBUTION.md)

本文严格区分可复现的源码构建、预览安装包和面向应用商店的正式发行。能够在本机成功编译，并不等于安装包已经适合公开分发。

## 发行渠道

| 渠道 | 面向用户 | 签名要求 | 发布位置 |
| --- | --- | --- | --- |
| 开发构建 | 贡献者 | 开发/测试身份 | 本机或 CI Artifact |
| GitHub 预览版 | 早期测试者 | 明确披露测试/ad-hoc 签名 | GitHub Draft 或 Prerelease |
| 直接稳定版 | 普通用户 | 正式发布身份；需要时完成公证 | 审核后的 GitHub Release |
| 应用商店 | 普通用户 | 商店要求的正式签名 | App Store / Google Play / Microsoft Store |
| Web | 浏览器用户 | HTTPS 与部署平台密钥 | Cloudflare-compatible Web 环境 |

安装包应作为 GitHub Release assets 发布。安装包、签名私钥、生成的原生工程和构建缓存都不能进入 Git 历史。

## 版本规则

QuietDo 遵循语义化版本，Git 标签格式为 `v主版本.次版本.修订号`，例如 `v0.4.0`。

发行前必须确保以下版本一致：

- `apps/web/package.json`
- `apps/desktop/package.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/desktop/src-tauri/tauri.conf.json`

Android 原生工程会在生成时从 Tauri 版本导出 `versionName` 和 `versionCode`。创建标签前还应更新 `CHANGELOG.md`；依赖元数据变化时重新生成 lockfile，并确保 CI 已经通过。

## 各平台产物

### Web / PWA

`apps/web` 是为 Cloudflare-compatible 运行时准备的 Vinext/React 应用。任务数据库始终位于浏览器 IndexedDB。D1 是可选能力，只保存匿名产品事件和用户主动提交的反馈，不保存任务正文。

```bash
cd apps/web
npm ci
npm run lint
npm test
```

生产环境必须使用 HTTPS。启用事件与反馈接口时，需要配置逻辑 D1 绑定 `DB`。模型密钥、部署 Token 等秘密不能写入仓库。

### macOS 预览版

环境要求：

- 安装 Xcode Command Line Tools 的 macOS
- Node.js 22.13+
- Rust stable 与 Apple 双架构 targets

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
cd apps/desktop
npm ci
npm run desktop:build:universal
```

Universal DMG 默认位于：

```text
apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

当前仓库把 `bundle.macOS.signingIdentity` 设置为 `-`，因此生成 ad-hoc 签名预览版。它可以避免 Apple Silicon 下载包完全未签名，但不能证明发布者身份，也没有完成 Apple 公证。

面向普通用户公开发行 DMG 前：

1. 加入 Apple Developer Program。
2. 直接分发使用 `Developer ID Application` 证书。
3. 将 ad-hoc 身份替换为正式身份，或使用 Tauri 支持的 CI 签名环境变量。
4. 配置 Apple 公证凭据。
5. 在 macOS 构建，校验签名，提交公证，staple 公证票据并验证 Gatekeeper。
6. 在干净的 Apple Silicon 与 Intel Mac 上分别测试从网络取得的最终资产。

证书导出文件和密码不能上传到 Git，应存放在限制访问的 GitHub Actions release environment secrets 中。

### Android 预览版

0.4.0 已验证的工具链：

- JDK 21（工程配置支持 JDK 17+）
- Android SDK Platform 36
- Android Build Tools 35.0.0
- Android NDK 28.0.13004108
- Rust targets：`aarch64-linux-android`、`armv7-linux-androideabi`

根据操作系统设置 Android 环境：

```bash
export JAVA_HOME=/path/to/jdk
export ANDROID_HOME=/path/to/Android/sdk
export NDK_HOME="$ANDROID_HOME/ndk/28.0.13004108"
rustup target add aarch64-linux-android armv7-linux-androideabi

cd apps/desktop
npm ci
npm run android:init -- --ci
npm run android:build
```

`android:build` 会生成优化后的 ARM64 + ARMv7 APK，并用本机 Android 测试密钥签名。默认产物写入已被 Git 忽略的 `releases/`，只适合侧载和真机测试。

提交 Google Play 前：

1. 只生成一次专用 upload keystore，并做好安全备份。
2. keystore、别名和密码全部放在仓库之外。
3. 让生成的 Gradle Android 工程从未跟踪的配置文件或 CI secrets 读取签名信息。
4. 在正式签名配置下执行 `npm run android:build:aab`。
5. 验证签名后的 AAB，先上传内部测试轨道。
6. 启用 Play App Signing；完成设备覆盖验证后，再逐步进入封闭、开放和正式发布。

应用开始分发后更换签名密钥可能导致无法升级。调试/测试密钥绝不能用于商店正式版。

### Windows 实验性产物

手动草稿发行工作流会在 GitHub Windows runner 上构建 NSIS 安装包。目前尚未完成项目级 Windows 真机验收，因此只能保留为 Draft/Prerelease。

进入稳定版前，需要验证安装、升级、卸载、WebView2 可用性、本地数据库持久化以及 Windows 10/11 行为。直接对外提供的正式安装包应使用可信代码签名，否则可能出现 Microsoft SmartScreen 警告。

### Linux 实验性产物

草稿工作流在 Ubuntu 22.04 上生成 DEB 与 AppImage，以维持较保守的 glibc 基线。目前尚未完成项目级 Linux 真机验收。

进入稳定版前，至少需要验证 Ubuntu/Debian 和一个非 Debian 发行版，并检查桌面启动器、WebKitGTK 依赖、本地数据库持久化、升级以及 Wayland/X11 行为。即使平台签名不是强制要求，也必须提供校验和。

### iOS

0.4.0 没有初始化或支持 iOS。存在 iOS 图标资源不代表平台已经可用。应在同步协议和移动端数据模型稳定后再启动 iOS 工作。

## GitHub Actions

### 持续集成

`.github/workflows/ci.yml` 在推送到 `main` 和 Pull Request 时执行：

- Ubuntu：Web lint、生产构建与自动化测试。
- macOS：原生 TypeScript/Vite 构建及 Rust 编译检查。

除明确需要创建 Release 的任务外，工作流只授予仓库只读权限。

### 草稿发行工作流

`.github/workflows/release.yml` 由维护者手动启动。人工触发是有意设计：工作流只创建 Draft/Prerelease，让维护者在公开前审核所有产物。

工作流会：

1. 校验输入标签与 `tauri.conf.json` 中的版本一致。
2. 重新运行 Web 质量检查。
3. 构建 macOS Universal DMG、Windows NSIS、Linux DEB/AppImage 和 Android 预览 APK。
4. 把产物附加到同一个 GitHub Draft Release。
5. 把正式签名和发布决定留给维护者。

除非维护者另外配置并验证了生产签名，否则所有自动生成的产物都仍是预览版。不能因为工作流通过，就直接把 `releaseDraft` 或 `prerelease` 改成 false。

## 发行检查清单

### 代码与数据

- [ ] 四处版本字段一致，`CHANGELOG.md` 已更新。
- [ ] 数据库迁移保持向后兼容，并用真实导出格式的脱敏备份测试。
- [ ] `apps/web` 中的 lint 与 test 全部通过。
- [ ] `apps/desktop` 中的前端 build 与 Cargo check 通过。
- [ ] Git 暂存区没有秘密、个人任务数据、生成工程或安装包。

### 安装包验证

- [ ] 应用名、包标识、版本和最低系统版本正确。
- [ ] 每个资产都附带 SHA-256。
- [ ] 使用平台工具验证签名。
- [ ] 测试安装、首次启动、数据持久化、升级、导出、导入和卸载。
- [ ] 覆盖所有对外宣称支持的架构与设备族。
- [ ] Release Notes 明确展示预览签名限制。

### 发布

- [ ] Release Notes 区分支持、预览、实验性与规划中平台。
- [ ] 维护者在公开前审核 Draft 资产。
- [ ] 商店包先通过内部测试轨道，再分阶段放量。
- [ ] 保留回滚方案和上一稳定版本资产。

## 校验和

上传前在本地产物旁生成 SHA-256：

```bash
shasum -a 256 QuietDo-0.4.0-universal.dmg > QuietDo-0.4.0-universal.dmg.sha256
shasum -a 256 QuietDo-0.4.0-android-preview-arm.apk > QuietDo-0.4.0-android-preview-arm.apk.sha256
```

Linux 使用 `sha256sum`。校验动作应在文件传输后再次执行，不能只在刚构建完成时运行。
