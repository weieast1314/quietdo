# Changelog

All notable changes to QuietDo are recorded here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned

- Encrypted WebDAV synchronization with conflict recovery.
- Explicit, provider-controlled AI suggestions.
- Production signing and store distribution.

## [0.4.0] - 2026-07-16

### Changed

- Renamed the product from Suishi (遂事) to QuietDo (轻作) after a new collision and pronunciation review.
- Updated application metadata, package identifiers, backup filenames, documentation, and release automation.
- Prepared the repository for public development with bilingual READMEs, community files, CI, Dependabot, and draft multi-platform releases.

### Compatibility

- Existing JSON exports from QuietDo, Suishi, and the original TaskFlow prototype remain importable.
- The new native package identifier starts a clean application data container; export old preview data before upgrading and import it into QuietDo.

## [0.3.0] - 2026-07-16

### Added

- Android preview application for ARM64 and ARMv7 devices running Android 7.0 or later.
- Runtime-specific behavior for Web, macOS, and Android.
- Safe-area-aware mobile layout.
- Reproducible local scripts for macOS and Android preview packages.

### Changed

- Renamed the product from TaskFlow to Suishi (遂事).
- Unified product metadata, manifests, export filenames, and documentation.

### Security

- Native builds no longer queue browser telemetry for unavailable Web APIs.
- Preview packages are explicitly identified as test-signed or ad-hoc-signed builds.

[Unreleased]: https://github.com/weieast1314/quietdo/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/weieast1314/quietdo/releases/tag/v0.4.0
[0.3.0]: https://github.com/weieast1314/quietdo/releases/tag/v0.3.0
