# Contributing to QuietDo

Thanks for helping improve QuietDo. Small, focused changes are easier to review and safer for a local-first application.

## Before you start

1. Search existing issues and pull requests.
2. Open a feature request before implementing a large feature or changing the data model.
3. Never include real task data, credentials, signing keys, or private service URLs in an issue or fixture.

## Development setup

Web application:

```bash
cd apps/web
npm ci
npm run dev
```

Native shell on macOS:

```bash
cd apps/desktop
npm ci
npm run desktop:dev
```

See [README.md](README.md) and [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md) for platform prerequisites.

## Required checks

Run checks relevant to the files you changed:

```bash
cd apps/web
npm run lint
npm test
```

```bash
cd apps/desktop
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

Android and packaging changes should also include the exact device, OS version, architecture, command, and signing mode used for verification.

## Pull requests

- Keep one concern per pull request.
- Explain the user-visible result and any data migration.
- Add or update tests for domain rules and input validation.
- Update both READMEs when public behavior, support status, or setup changes.
- Do not commit generated native projects, build caches, installers, or signing material.
- Use clear commit messages; Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, and `chore:` are encouraged.

By contributing, you agree that your contribution is licensed under the project's [MIT License](LICENSE).
