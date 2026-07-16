# QuietDo · 轻作原生端（macOS + Android）

这个目录提供 QuietDo 的 Tauri 2 原生壳。React UI、领域规则和 IndexedDB 数据层直接复用 `apps/web`；原生运行时不注册 Service Worker，也不会把匿名埋点排入不存在的 Web API。

## 开发

```bash
npm install
npm run desktop:dev
```

## 构建 macOS 安装包

```bash
npm run desktop:build
```

同时支持 Apple Silicon 和 Intel Mac：

```bash
rustup target add x86_64-apple-darwin
npm run desktop:build:universal
```

产物位于 `src-tauri/target/release/bundle/`：

- `macos/QuietDo.app`
- `dmg/QuietDo_0.4.0_aarch64.dmg`
- `target/universal-apple-darwin/release/bundle/dmg/QuietDo_0.4.0_universal.dmg`

当前构建使用 ad-hoc 签名，适合本机和内部测试。面向外部用户公开下载前，需要配置 Apple Developer ID 并完成 notarization。

## 构建 Android 安装包

首次构建需要 JDK 17+、Android SDK/NDK 和 Android Rust targets。下面使用通用路径，具体版本参见根目录的发行指南：

```bash
export JAVA_HOME=/path/to/jdk
export ANDROID_HOME=/path/to/Android/sdk
export NDK_HOME="$ANDROID_HOME/ndk/28.0.13004108"
npm run android:init -- --ci
npm run android:build
```

`android:build` 生成经过优化、可侧载的 ARM64 + ARMv7 预览 APK，并使用本机 Android 测试证书签名。`android:build:debug` 保留四 ABI 开发包；`android:build:aab` 用于生成商店上传格式，正式发布前仍需配置独立签名密钥。

完整的跨平台签名、校验和商店发行边界参见 [`docs/DISTRIBUTION.zh-CN.md`](../../docs/DISTRIBUTION.zh-CN.md)。
