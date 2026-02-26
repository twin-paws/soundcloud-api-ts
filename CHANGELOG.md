# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.13.0] - 2026-02-26

### Added

- **OpenAPI coverage CI** (`tools/coverage-check.ts`): Reports implemented vs total spec operations, writes `tools/coverage-baseline.json`. New CI job uploads coverage artifact on every run. Run locally via `pnpm openapi:coverage`.
- **Auth guide** (`docs/auth-guide.md`): Comprehensive guide covering client credentials vs user tokens, full PKCE flow, auto-refresh patterns, `TokenProvider`/`TokenStore` interfaces, NextAuth/Clerk bridge examples, and a 401 troubleshooting table.
- **`TokenProvider` and `TokenStore` interfaces** (`src/auth/token-provider.ts`): Pluggable contracts for token lifecycle management. Implement to integrate with any session framework.
- **`sc.tracks.getTracks(ids)`**: Fetch multiple tracks by ID array in a single request.
- **`sc.me.getConnections()`**: List the authenticated user's connected external social accounts.
- **Auth-at-a-glance table** in README: Shows which endpoint categories require client credentials vs user tokens.
- README badge linking to OpenAPI coverage tracking.

## [1.12.0] - 2026-02-26

### Added

- **`sc.raw` — universal escape-hatch request API**: `RawClient` exposes `raw.request({ method, path, query, body })`, plus `raw.get()`, `raw.post()`, `raw.put()`, `raw.delete()` shortcuts. Supports path templating (`/tracks/{id}`). Returns `RawResponse<T>` with `{ data, status, headers }`. Prevents "missing endpoint" from blocking adoption — call any API endpoint immediately.
- **In-flight GET deduplication**: Concurrent identical GET requests (same URL + auth scope) share a single in-flight promise. Opt-in via `dedupe` constructor option (default: `true`). Eliminates redundant fetches during SSR storms without caching responses.
- **Pluggable cache interface** (`SoundCloudCache`): Define `get/set/delete` on any backend (in-memory, Redis, KV, etc.) and pass it as `cache` in the constructor. Base package defines types only — no implementation, no deps. Configurable TTL via `cacheTtlMs` (default: 60000ms).
- **Fetch injection**: Constructor now accepts `fetch` and `AbortController` options for full portability across Node, Bun, Deno, Cloudflare Workers, and Edge runtimes.
- **Retry hook** (`onRetry`): Fires on every retry attempt with `{ attempt, delayMs, reason, status, url }` — useful for logging, metrics, or alerting on sustained rate limits.
- **`Retry-After` header respected on 429**: When SoundCloud returns a `Retry-After` header, the client uses it as the retry delay (capped at 60s) instead of the default backoff.
- **OpenAPI sync tooling** (`tools/openapi-sync.ts`): Fetches SoundCloud's public OpenAPI spec, saves `tools/openapi.json` and `tools/openapi-operations.json`. Run via `pnpm openapi:sync`. Foundation for coverage tracking.
- **Implemented operations registry** (`src/client/registry.ts`): `IMPLEMENTED_OPERATIONS` string array for CI coverage comparison against the OpenAPI spec.
- New exports: `RawClient`, `RawResponse`, `SoundCloudCache`, `SoundCloudCacheEntry`, `RetryInfo`, `InFlightDeduper`, `IMPLEMENTED_OPERATIONS`.

## [1.11.3] - 2026-02-16

### Fixed

- **Critical: `getClientToken` auth method** — `SoundCloudClient.auth.getClientToken()` now sends credentials via Basic Auth header instead of form body params. SoundCloud's OAuth 2.1 endpoint rejects body-param credentials with `invalid_client`. The standalone `getClientToken()` function was already correct; only the class method was affected.

## [1.11.2] - 2026-02-15

### Added

- **Telemetry test coverage**: 11 new tests for `onRequest` — successful calls, 4xx errors, 429 retries, all auth methods (getClientToken/getUserToken/refreshUserToken), 401 auto-refresh, scFetchUrl pagination, multiple call isolation, no-callback safety, type export verification.

## [1.11.1] - 2026-02-15

### Fixed

- **Auth telemetry gap**: `Auth` class methods (`getClientToken`, `getUserToken`, `refreshUserToken`) now emit `onRequest` telemetry. Previously these called `scFetch` directly without the telemetry callback.

## [1.11.0] - 2026-02-15

### Added

- **Request telemetry hook**: New `onRequest` callback on `SoundCloudClientConfig` — called after every API request with structured telemetry (`SCRequestTelemetry`)
- Telemetry includes: HTTP method, path, total duration (including retries), final status code, retry count, and error message (if failed)
- Covers all code paths: `scFetch`, `scFetchUrl`, pagination (`paginate`, `paginateItems`, `fetchAll`), auto token refresh
- Fully optional — zero breaking changes, no overhead when not configured
- New exported type: `SCRequestTelemetry`

### Example

```ts
const sc = new SoundCloudClient({
  clientId: '...',
  clientSecret: '...',
  onRequest: (t) => console.log(`[SC] ${t.method} ${t.path} ${t.status} ${t.durationMs}ms retries=${t.retryCount}`),
});
```

## [1.10.0] - 2026-02-12

### Changed

- **OAuth 2.1 endpoint migration**: All auth calls now use SoundCloud's new `secure.soundcloud.com` endpoints
  - Token: `api.soundcloud.com/oauth2/token` → `secure.soundcloud.com/oauth/token`
  - Authorize: `api.soundcloud.com/connect` → `secure.soundcloud.com/authorize`
  - Sign-out was already on `secure.soundcloud.com` (unchanged)
- Auth paths (`/oauth/*`) are automatically routed to `secure.soundcloud.com` in the HTTP layer
- API data calls (tracks, users, playlists, etc.) remain on `api.soundcloud.com`

### Why

SoundCloud is shutting down the legacy OAuth 2.0 endpoints. See the [migration announcement](https://developers.soundcloud.com/blog/oauth-migration). This is a **required upgrade** — the old endpoints will stop working.

## [1.9.0] - 2026-02-10

### Added

- `sc-cli play <id>` command — stream and play SoundCloud tracks directly in your terminal
- Auto-detects audio player: mpv (with IPC pause/resume), ffplay, afplay (macOS)
- Live progress bar with elapsed/total time during playback
- Keyboard controls: `[space]` pause/resume (mpv/ffplay), `[q]` quit
- `--url` flag to print stream URL without playing
- Windows support: `where.exe` detection, named pipe IPC for mpv

### Fixed

- Stream download now sends OAuth bearer token (fixes 401 on stream URLs)

## [1.8.5] - 2026-02-09

### Fixed

- Trusted Publishing: removed `registry-url` from setup-node (was injecting stale `.npmrc`), install npm@latest for OIDC support (requires npm ≥11.5.1)

## [1.8.4] - 2026-02-09

### Changed

- **Trusted Publishing** — publish workflow uses OIDC instead of npm tokens (no more token rotation)
- CI publish job now uses Node 22 (required for trusted publishing)
- Removed `NPM_TOKEN` secret dependency

## [1.8.3] - 2026-02-09

### Added

- **Migration guide** (`docs/MIGRATING.md`) — complete guide for switching from `soundcloud.ts`, with API mapping, type mapping, setup differences, and side-by-side code examples
- Migration guide link in README comparison section

## [1.8.2] - 2026-02-09

### Changed

- Standardized on pnpm (removed `package-lock.json`)
- CI workflows use `pnpm/action-setup@v4`
- ESLint pinned to `^9` (peer-required by `@typescript-eslint` v8)
- CHANGELOG updated through v1.8.1

## [1.8.1] - 2026-02-09

### Added

- Dynamic Shields.io badges: weekly downloads, install size, GitHub stars, Node.js version
- `engines.node >= 20` declared in package.json
- Bundle size comparison in README (4.5 KB gzipped vs 191 KB for soundcloud-fetch)
- Install size badge via packagephobia

## [1.7.0] - 2026-02-09

### Added

- 13 new tests (262 total) covering http.ts edge cases and SoundCloudClient branches
- **100% line and function coverage**

### Changed

- All OAuth references standardized to **OAuth 2.1** (matching SoundCloud official docs)
- SECURITY.md now uses GitHub private vulnerability reporting (no email exposed)
- Private vulnerability reporting enabled on repository
- Comparison table updated with real competitors (soundcloud.ts, soundcloud-fetch)
- Added **API Terms Compliance** section to README
- Comparison callout explains ToS risks of undocumented api-v2 usage
- AI content usage disclaimer added

### Removed

- `docs/AUTH_FLOW.md` (internal review doc, not useful to consumers)

## [1.6.3] - 2026-02-09

### Changed

- Updated comparison table with real competitors and ToS references

## [1.6.2] - 2026-02-09

### Changed

- CLI renamed to `sc-cli` for brevity (`soundcloud-cli` still works as alias)
- Expanded CLI documentation in README with all commands
- Added "AI / LLM Integration" section to README
- Updated feature list to highlight CLI, auto-retry, and LLM support

## [1.6.0] - 2026-02-09

### Added

- **`soundcloud-cli`** — interactive CLI tool to explore the SoundCloud API from your terminal
  - `auth` — interactive credential setup, saves to `~/.soundcloud-cli.json`
  - `login` — OAuth browser flow with PKCE (starts local callback server)
  - `search <query>` — search tracks with formatted table output
  - `track <id>` — show track details (title, artist, duration, plays, likes, genre)
  - `user <id>` — show user profile (username, followers, tracks count, city)
  - `playlist <id>` — show playlist with track listing
  - `stream <id>` — get stream URLs for a track
  - `resolve <url>` — resolve a SoundCloud URL
  - `me` / `likes` — authenticated user commands
  - `--json` flag on all commands for machine-readable output
  - Colorful ANSI output with animated spinner, zero external dependencies

## [1.5.0] - 2026-02-08

### Added

- Examples folder with 4 demos: basic usage, Express OAuth flow, pagination, PKCE
- `llms.txt` — full method reference for AI/LLM consumption
- `AGENTS.md` — instructions for AI coding agents using the package
- `SECURITY.md` — vulnerability reporting policy
- TypeDoc site with auto-deploy to GitHub Pages
- npm keywords (13) and GitHub topics (12) for discoverability

### Changed

- Package description updated to highlight zero deps, native fetch, OAuth 2.1 + PKCE
- Package `homepage` set to TypeDoc site
- README: added docs badge, coverage badge (94%), changelog section, documentation link

## [1.4.3] - 2026-02-08

### Added

- 63 new tests (249 total) covering optional parameter branches, client methods, and retry-exhaustion paths
- Excluded barrel `index.ts` files from coverage reporting

### Changed

- Branch coverage: 67% → 94.49%
- Statement coverage: 94.7% → 96%

## [1.4.2] - 2026-02-08

### Added

- `@example` blocks on 12 previously undocumented functions

### Fixed

- Package name in all JSDoc example imports (`tsd-soundcloud` → `soundcloud-api-ts`)

## [1.4.1] - 2026-02-08

### Fixed

- Removed unused `scFetchUrl` import from `paginate.ts`
- Replaced `as any` casts with `as SoundCloudErrorBody` in `http.ts`
- Removed unnecessary eslint-disable directive in `SoundCloudClient.ts`

## [1.4.0] - 2026-02-08

### Added

- Comprehensive JSDoc on every public export — `@param`, `@returns`, `@throws`, `@example`, `@see`
- 2,200+ lines of documentation added
- Standalone function test suite (94.7% statement coverage)

## [1.3.0] - 2026-02-08

### Added

- `SoundCloudError` class with structured error properties (`status`, `statusText`, `errorCode`, `docsLink`, `errors[]`, `body`)
- Convenience getters: `isUnauthorized`, `isForbidden`, `isNotFound`, `isRateLimited`, `isServerError`
- Automatic retry with exponential backoff on 429 and 5xx responses
- `Retry-After` header support for 429 responses
- `onDebug` callback for debug logging
- Pagination helpers: `paginate()`, `paginateItems()`, `fetchAll()` with async iterators
- `scFetchUrl()` for fetching absolute URLs (used for pagination)
- `SoundCloudClient.paginate()`, `.paginateItems()`, `.fetchAll()` instance methods

### Changed

- API errors now throw `SoundCloudError` instead of plain `Error`
- Error responses parsed from SoundCloud's actual format (`message`, `error_code`, `errors[]`)

## [1.2.0] - 2026-02-08

### Added

- LICENSE file (MIT)
- CHANGELOG.md
- CONTRIBUTING.md
- Code coverage reporting (`@vitest/coverage-v8`)
- GitHub topics for discoverability
- README: badges, comparison table, "Why this package?" section

### Changed

- CI: added lint step

## [1.1.0] - 2026-02-08

### Added

- Test suite with 72 unit tests and integration tests (Vitest)
- CI/CD pipeline with GitHub Actions (Node 20, 22)
- Auto-publish to npm on GitHub release
- ESLint configuration with TypeScript support
- Pre-commit hooks for secret scanning
- `.env.example` template

### Changed

- Minimum Node.js version bumped to 20+ (dropped Node 18)

## [1.0.1] - 2026-02-07

### Changed

- Updated README with npm package name (`soundcloud-api-ts`) and badges
- Updated repo references from `tsd-soundcloud` to `soundcloud-api-ts`

## [1.0.0] - 2026-02-07

### Added

- `SoundCloudClient` class with namespace-based API (`client.tracks.getTrack()`)
- 24+ API endpoints: Auth, Me, Users, Tracks, Playlists, Likes, Reposts, Search, Resolve
- OAuth 2.1: `client_credentials`, `authorization_code`, `refresh_token` grants
- PKCE support for public clients and SPAs
- Automatic token refresh on 401 via `onTokenRefresh` callback
- Per-call token override via `{ token }` options object
- Standalone function exports for all endpoints
- Full TypeScript types for all API responses
- Dual ESM/CJS output via tsup
- Zero runtime dependencies — native `fetch`
- SoundCloud widget URL utility

[1.9.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.8.5...v1.9.0
[1.8.5]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.8.4...v1.8.5
[1.8.4]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.7.0...v1.8.1
[1.7.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.6.3...v1.7.0
[1.6.3]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.6.0...v1.6.2
[1.6.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.4.3...v1.5.0
[1.4.3]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/twin-paws/soundcloud-api-ts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/twin-paws/soundcloud-api-ts/releases/tag/v1.0.0
