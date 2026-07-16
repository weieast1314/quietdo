# Distribution Guide

[简体中文](DISTRIBUTION.zh-CN.md) · English

This document separates reproducible source builds, preview packages, and production store releases. A successful local build does not by itself make a package suitable for public distribution.

## Release channels

| Channel | Audience | Signing expectation | Published from |
| --- | --- | --- | --- |
| Development | Contributors | Development/test identity | Local machine or CI artifact |
| GitHub preview | Early testers | Clearly disclosed test/ad-hoc signature | Draft or prerelease on GitHub |
| Direct stable | General users | Production identity, notarization where required | Reviewed GitHub Release |
| App store | General users | Store-specific production identity | App Store / Google Play / Microsoft Store |
| Web | Browser users | HTTPS deployment and platform secrets | Cloudflare-compatible Web deployment |

GitHub Release assets are used for installers. Installers, signing keys, generated native projects, and build caches must not be committed to Git history.

## Versioning

QuietDo follows Semantic Versioning and uses tags in the form `vMAJOR.MINOR.PATCH`, for example `v0.4.0`.

Before a release, keep these versions identical:

- `apps/web/package.json`
- `apps/desktop/package.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/desktop/src-tauri/tauri.conf.json`

Android derives `versionName` and `versionCode` from the Tauri version during project generation. Review `CHANGELOG.md`, regenerate lockfiles when dependency metadata changes, and run CI before creating a tag.

## Supported and experimental outputs

### Web / PWA

`apps/web` is a Vinext/React application prepared for a Cloudflare-compatible runtime. The task database remains in browser IndexedDB. D1 is optional and stores only anonymous product events and feedback submitted by the user; it is not the task database.

```bash
cd apps/web
npm ci
npm run lint
npm test
```

Deploy only over HTTPS. Configure the logical D1 binding `DB` when the event and feedback endpoints are enabled. Do not add provider keys or deployment tokens to the repository.

### macOS preview

Requirements:

- macOS with Xcode Command Line Tools
- Node.js 22.13+
- Rust stable with Apple targets

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
cd apps/desktop
npm ci
npm run desktop:build:universal
```

Expected universal DMG location:

```text
apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

The repository currently sets `bundle.macOS.signingIdentity` to `-`, which creates an ad-hoc-signed preview. This avoids an entirely unsigned Apple Silicon binary but does **not** establish publisher identity and does **not** notarize the application.

For a public stable DMG:

1. Join the Apple Developer Program.
2. Use a `Developer ID Application` certificate for distribution outside the Mac App Store.
3. Replace the ad-hoc identity with the production identity or provide the supported signing environment in CI.
4. Configure Apple notarization credentials.
5. Build on macOS, verify the signature, submit for notarization, staple the ticket, and verify Gatekeeper acceptance.
6. Test the downloaded asset on a clean Apple Silicon Mac and a clean Intel Mac.

Never upload the certificate export or its password to Git. Store CI credentials as GitHub Actions secrets with access limited to the release environment.

### Android preview

Tested toolchain for 0.4.0:

- JDK 21 (JDK 17+ supported by the project setup)
- Android SDK platform 36
- Android build tools 35.0.0
- Android NDK 28.0.13004108
- Rust targets `aarch64-linux-android` and `armv7-linux-androideabi`

Configure the Android environment for your operating system:

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

`android:build` creates an optimized ARM64 + ARMv7 APK and signs it with the local Android test keystore. The default output is under `releases/` and is intentionally ignored by Git. This package is suitable only for side-loading and device testing.

For Google Play:

1. Generate a dedicated upload keystore once and back it up securely.
2. Keep the keystore, aliases, and passwords outside the repository.
3. Configure the generated Gradle Android project to read signing values from an untracked properties file or CI secrets.
4. Run `npm run android:build:aab` with the release signing configuration.
5. Verify the signed AAB and upload it to an internal test track first.
6. Use Play App Signing and promote through closed/open testing only after device coverage checks.

Changing the signing key after distribution can prevent upgrades. A debug/test key must never be used for a store release.

### Windows experimental package

The manual draft release workflow builds an NSIS package on a GitHub-hosted Windows runner. Windows has not yet received project-level device acceptance testing, so generated packages must remain draft/prerelease assets.

Before stable distribution, test installation, upgrade, uninstall, WebView2 availability, local database persistence, and Windows 10/11 behavior. Production direct downloads should use a trusted code-signing identity; otherwise Microsoft SmartScreen may warn users.

### Linux experimental packages

The draft workflow builds DEB and AppImage packages on Ubuntu 22.04 to maintain a conservative glibc baseline. Linux has not yet received project-level device acceptance testing.

Before stable distribution, verify at least Ubuntu/Debian and one non-Debian distribution, desktop launchers, WebKitGTK dependencies, local database persistence, upgrade behavior, and Wayland/X11 behavior. Checksums are required even where platform signing is optional.

### iOS

iOS is not initialized or supported in version 0.4.0. Icon assets alone do not indicate platform support. iOS work should start only after the sync and mobile data model are stable.

## GitHub Actions

### Continuous integration

`.github/workflows/ci.yml` runs on pushes to `main` and pull requests:

- Web lint, production build, and automated tests on Ubuntu.
- Native TypeScript/Vite build and Rust compile check on macOS.

Workflows have read-only repository permissions unless a release job explicitly needs `contents: write`.

### Draft release workflow

`.github/workflows/release.yml` is started manually by a maintainer. Manual kickoff is intentional: the release is created as a draft/prerelease so generated assets can be reviewed before publication.

The workflow:

1. Confirms the requested tag matches the version in `tauri.conf.json`.
2. Re-runs Web quality checks.
3. Builds universal macOS DMG, Windows NSIS, Linux DEB/AppImage, and an Android preview APK.
4. Attaches artifacts to one draft GitHub Release.
5. Leaves publication and production-signing decisions to a maintainer.

The automated outputs are preview artifacts unless the maintainer has separately configured and verified production signing. Do not change `releaseDraft` or `prerelease` to false merely because the workflow is green.

## Release checklist

### Code and data

- [ ] Version fields match and `CHANGELOG.md` is current.
- [ ] Database migrations are backward-compatible and tested with an exported backup.
- [ ] `npm run lint` and `npm test` pass in `apps/web`.
- [ ] `npm run build` and Cargo check pass in `apps/desktop`.
- [ ] No secrets, personal task data, generated projects, or installers are staged in Git.

### Package verification

- [ ] Package names, identifiers, versions, and minimum OS versions are correct.
- [ ] Every asset has a SHA-256 checksum.
- [ ] Signatures are verified using platform tools.
- [ ] Install, first launch, data persistence, upgrade, export, import, and uninstall are tested.
- [ ] Tests cover each advertised architecture/device family.
- [ ] Preview signing limitations are visible in release notes.

### Publication

- [ ] Release notes distinguish supported, preview, experimental, and planned platforms.
- [ ] A maintainer reviews draft assets before publication.
- [ ] Store builds pass internal testing tracks before staged rollout.
- [ ] Rollback and previous stable assets remain available.

## Checksums

Generate SHA-256 files next to local artifacts before uploading them:

```bash
shasum -a 256 QuietDo-0.4.0-universal.dmg > QuietDo-0.4.0-universal.dmg.sha256
shasum -a 256 QuietDo-0.4.0-android-preview-arm.apk > QuietDo-0.4.0-android-preview-arm.apk.sha256
```

On Linux, use `sha256sum` instead. Verify after transferring an artifact, not only immediately after building it.
