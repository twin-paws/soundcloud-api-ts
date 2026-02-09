# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Pagination helpers: `paginate()`, `paginateItems()`, and `fetchAll()` for automatic `next_href` traversal
- `scFetchUrl()` for fetching absolute URLs (used internally for pagination)
- `SoundCloudClient.paginate()`, `.paginateItems()`, and `.fetchAll()` instance methods
- Pagination tests

## [1.1.0] - 2026-02-08

### Added

- Comprehensive test suite with Vitest
- CI/CD pipeline with GitHub Actions (Node 20, 22)
- ESLint configuration with TypeScript support
- Pre-commit hooks via `.githooks/`
- Code coverage with `@vitest/coverage-v8`
- CONTRIBUTING.md, CHANGELOG.md, and LICENSE files

### Changed

- Minimum Node.js version bumped to 20+

## [1.0.1] - 2026-02-07

### Changed

- Updated README with npm package name (`soundcloud-api-ts`) and badges

## [1.0.0] - 2026-02-07

### Added

- `SoundCloudClient` class with namespace-based API design
- 24+ API endpoints across Auth, Me, Users, Tracks, Playlists, Likes, Reposts, Search, and Resolve
- OAuth 2.0 support: `client_credentials`, `authorization_code`, and `refresh_token` grant types
- PKCE (Proof Key for Code Exchange) support for public clients
- Automatic token refresh on 401 responses via `onTokenRefresh` callback
- Per-call token override via `{ token: "..." }` options
- Standalone function exports for all endpoints
- Full TypeScript types for all API responses
- Dual ESM/CJS output via tsup
- Zero runtime dependencies — uses native `fetch`
- SoundCloud widget URL utility

[1.1.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/twin-paws/soundcloud-api-ts/releases/tag/v1.0.0
