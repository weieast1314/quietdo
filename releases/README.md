# Releases

Installers are published on [GitHub Releases](https://github.com/weieast1314/quietdo/releases). This directory keeps release notes only; `.gitignore` prevents platform binaries, signatures, and checksums from entering Git history.

## 0.4.0 source release

- Product name changed to QuietDo (轻作).
- Repository, application metadata, package identifiers, documentation, and release workflow use the new brand.
- Binaries are created as draft GitHub Release assets after the workflow is manually started and reviewed.

Read the [v0.4.0 release notes](v0.4.0.md) and the [distribution guide](../docs/DISTRIBUTION.md).

## 0.3.0 preview

- Product name changed from TaskFlow to Suishi (遂事).
- macOS: universal Apple Silicon + Intel DMG, macOS 12+.
- Android: optimized ARM64 + ARMv7 APK, Android 7.0+ (API 24).
- macOS is ad-hoc signed and not notarized.
- Android is signed with a local Android test certificate.
- Windows and Linux have not completed device acceptance testing.

The [v0.3.0 notes](v0.3.0.md) are retained as historical documentation for the former Suishi name.
