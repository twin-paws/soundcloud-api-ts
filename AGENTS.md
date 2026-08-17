# AGENTS.md — soundcloud-api-ts

Instructions for AI coding agents working with this package.

## Setup

- **Node.js 20+** required (uses native `fetch` and Web Crypto)
- No environment variables are read by the package — all config is passed to the constructor
- A SoundCloud **Artist Pro** account is required to register an app and get a Client ID / secret: https://developers.soundcloud.com/docs/api/register-app
- Official agent docs: https://developers.soundcloud.com/docs/building-with-ai · https://developers.soundcloud.com/docs/llm-context
- Live OpenAPI: https://developers.soundcloud.com/docs/api/explorer/api.json · https://raw.githubusercontent.com/soundcloud/api/master/openapi/api.yaml

```bash
npm install soundcloud-api-ts
```

```ts
import { SoundCloudClient } from 'soundcloud-api-ts';

const sc = new SoundCloudClient({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'https://example.com/callback', // only needed for user auth
});
```

## Authentication

**Every API call requires a token.** You must call `sc.setToken()` before making requests.

### Client Credentials (server-to-server, no user context)

```ts
const token = await sc.auth.getClientToken();
sc.setToken(token.access_token, token.refresh_token); // persist refresh — do not mint a new CC token every boot
// Now you can call public endpoints: tracks, users, search, playlists, resolve
```

### User Token (user context required)

Some endpoints require a user token (not just client credentials):
- All `sc.me.*` endpoints
- `sc.likes.*` (likeTrack, unlikeTrack, likePlaylist, unlikePlaylist)
- `sc.reposts.*` (repostTrack, unrepostTrack, repostPlaylist, unrepostPlaylist)
- `sc.tracks.createComment()`, `sc.tracks.update()`, `sc.tracks.delete()`, `sc.tracks.upload()`, `sc.tracks.updateStorefront()`
- `sc.playlists.create()`, `sc.playlists.update()`, `sc.playlists.delete()`
- `sc.me.follow()`, `sc.me.unfollow()`

```ts
import { generateCodeVerifier, generateCodeChallenge } from 'soundcloud-api-ts';

const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);
const authUrl = sc.auth.getAuthorizationUrl({ state: 'csrf-token', codeChallenge: challenge });
// User visits authUrl → redirected back with ?code=...
const token = await sc.auth.getUserToken(code, verifier);
sc.setToken(token.access_token, token.refresh_token);
```

## Common Operations

### Get a track
```ts
const track = await sc.tracks.getTrack(123456);
```

### Search
```ts
const results = await sc.search.tracks('lofi hip hop');
// results.collection is SoundCloudTrack[]
```

### Get stream URLs
```ts
const streams = await sc.tracks.getStreams(trackId);
// streams.hls_mp3_128_url, streams.http_mp3_128_url, etc.
```

### Resolve a SoundCloud URL
```ts
const resource = await sc.resolve.resolveUrl('https://soundcloud.com/artist/track');
```

### Get authenticated user profile
```ts
const me = await sc.me.getMe(); // requires user token
```

## Pagination

Paginated endpoints return `{ collection: T[], next_href?: string }`. Use the built-in helpers:

```ts
// Iterate items one by one across all pages
for await (const track of sc.paginateItems(() => sc.search.tracks('lofi'))) {
  console.log(track.title);
}

// Collect everything (with optional cap)
const allTracks = await sc.fetchAll(() => sc.users.getTracks(userId), { maxItems: 200 });
```

## Error Handling

All API errors throw `SoundCloudError`:

```ts
import { SoundCloudError } from 'soundcloud-api-ts';

try {
  await sc.tracks.getTrack(999999999);
} catch (err) {
  if (err instanceof SoundCloudError) {
    err.status;        // HTTP status code (404, 401, 429, etc.)
    err.message;       // Human-readable error message
    err.errorCode;     // error_code or OAuth error (e.g. "invalid_grant")
    err.isInvalidGrant; // refresh token is dead — user must re-authorize
    err.isPermanentAuthError; // invalid_grant / invalid_token / invalid_request / unauthorized_client / access_denied
    err.isNotFound;    // true if 404
    err.isUnauthorized; // true if 401
    err.isRateLimited; // true if 429
    err.isServerError; // true if 5xx
  }
}
```

## Gotchas

1. **Token required for ALL requests** — even public endpoints like `getTrack` need at least a client credentials token. Call `setToken()` first.
2. **User token vs client token** — write operations (like, repost, comment, follow, create/update/delete, upload) require a user token obtained via the authorization code flow. A client credentials token won't work. Client-credentials **responses include `refresh_token`** — persist it and call `sc.auth.refreshToken()` (same grant as `refreshUserToken`). New `getClientToken()` calls are limited to 50 / 12h / app and 30 / 1h / IP. Refresh tokens are single-use.
3. **Rate limits exist** — SoundCloud returns 429 when rate limited. The client retries 429, 5xx, and thrown `fetch` (network/DNS) with exponential backoff (configurable via `maxRetries` and `retryBaseDelay`). `Retry-After` is honored (capped 60s). A 200 with invalid JSON throws `SoundCloudError`.
4. **Auto token refresh** — pass `onTokenRefresh` in the config to automatically refresh expired tokens on 401. Concurrent 401s share a single in-flight refresh. Persist the new refresh token atomically in that callback or you lose the session. `setToken(access)` (one argument) clears any stored refresh token.
5. **Request telemetry** — pass `onRequest` in the config to receive `SCRequestTelemetry` after every client-namespace request (method, path, duration, status, retries, error), including pagination and retries. NOT emitted for `sc.raw.*` or `auth.signOut`.
6. **sc.raw** — `sc.raw.get('/tracks/{id}', { id: 123456 })` calls any endpoint without a typed wrapper. Returns `RawResponse<T>` with `{ data, status, headers }`. Does NOT throw on non-2xx — check `res.status` yourself. Good for endpoints not yet wrapped.
7. **Fetch injection** — pass `fetch` in the constructor for Bun/Deno/Cloudflare Workers portability. No Node-only APIs used at runtime. There is no `AbortController` option — bake cancellation/timeouts into the `fetch` you inject.
8. **Deduplication** — concurrent identical GETs through the client namespaces share a single in-flight promise (`dedupe: true` by default; wired up in v1.14.0 — earlier versions accepted but ignored the option). `sc.raw.*` is not deduped. Pagination `next_href` fetches are not deduped, but they do use the live token, client retry config, and `onTokenRefresh`.
9. **Cache** — pass a `SoundCloudCache` implementation in the constructor to cache namespace GET responses (also wired up in v1.14.0). Base package defines the interface only; bring your own backend. `cacheTtlMs` defaults to 60000ms. Cache keys hash the access token — they never contain the raw secret.
10. **Retry hook** — pass `onRetry` to receive `RetryInfo` on each retry: `{ attempt, delayMs, reason, status?, url }`.
11. **`sc.tracks.getTracks(ids[])`** — batch fetch multiple tracks by ID array in a single request. Max 200 IDs — throws immediately above that, before any network call. Returns `SoundCloudTrack[]` (may be shorter than input if some tracks are unavailable).
12. **`sc.me.getConnections()`** — list linked social accounts. Requires user token. May require elevated API access.
13. **TokenProvider / TokenStore interfaces** — in `src/auth/token-provider.ts`. Implement to integrate with NextAuth, Clerk, Redis, or any session framework. See `docs/auth-guide.md`.
14. **Auth guide** — `docs/auth-guide.md` covers: client creds vs user tokens, full PKCE flow, auto-refresh, NextAuth/Clerk bridge patterns, 401 troubleshooting. Prefer `err.isInvalidGrant` / `err.isPermanentAuthError` over checking HTTP status alone. `errorCode` is `error_code` or OAuth `error`.
15. **OpenAPI tooling** — `pnpm openapi:sync` fetches the live spec (`docs/api/explorer/api.json` and `openapi/api.yaml`). `pnpm openapi:coverage` compares `IMPLEMENTED_ROUTES` (`METHOD path` in `src/client/registry.ts`) against that spec. Current baseline: 52 of 64 current operations. Deprecated aliases (`/favorites`, nested following GETs) are not wrapped. Update `IMPLEMENTED_ROUTES` when adding endpoints.
16. **No env vars** — the package reads no environment variables. Pass `clientId`, `clientSecret`, and `redirectUri` directly to the constructor.
17. **IDs can be numbers or strings** — all ID parameters accept `string | number`.
18. **Search pagination** — search uses zero-based `pageNumber` (`offset = limit * pageNumber`). Default `limit` is 10 (1–200). Track search defaults to `access=playable`.

## Project Structure (for contributors)

```
src/
  index.ts                     — All public exports (source of truth)
  client/SoundCloudClient.ts   — Main client class with all namespaced methods
  client/http.ts               — scFetch, scFetchUrl (HTTP layer with retry + RetryInfo hook)
  client/paginate.ts           — paginate, paginateItems, fetchAll helpers
  client/raw.ts                — RawClient (sc.raw escape hatch)
  client/dedupe.ts             — InFlightDeduper (GET coalescing)
  client/cache.ts              — SoundCloudCache interface
  client/registry.ts           — IMPLEMENTED_ROUTES (METHOD path; OpenAPI coverage) + IMPLEMENTED_OPERATIONS (legacy aliases)
  auth/                        — Standalone auth functions + PKCE
  auth/token-provider.ts       — TokenProvider + TokenStore interfaces
  users/                       — Standalone user functions (getMe, getUser, etc.)
  tracks/                      — Standalone track functions
  playlists/                   — Standalone playlist functions
  search/                      — Standalone search functions
  me/                          — Standalone /me endpoint functions
  likes/                       — Standalone like/unlike functions
  reposts/                     — Standalone repost functions
  resolve/                     — Standalone resolve function
  utils/                       — Widget URL helper
  errors.ts                    — SoundCloudError class
  types/api.ts                 — All TypeScript type definitions
```

## Key Files

- `src/index.ts` — single source of truth for all exports
- `src/types/api.ts` — all TypeScript interfaces
- `src/client/SoundCloudClient.ts` — the main client class
- `tsup.config.ts` — build config (dual ESM/CJS)
- `vitest.config.ts` — test config
- `typedoc.json` — API docs generation config

## Build & Test

```bash
pnpm build       # tsup → dist/ (ESM + CJS + .d.ts)
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest
pnpm test:watch  # Vitest watch mode
pnpm docs        # TypeDoc → API docs site
```

## How to Add a New Endpoint

1. Create a standalone function in the appropriate `src/<category>/` directory
2. Export it from `src/<category>/index.ts`
3. Re-export from `src/index.ts`
4. Add a namespaced method in `SoundCloudClient` (in `src/client/SoundCloudClient.ts`)
5. Add tests in `src/<category>/__tests__/` (or the matching `src/__tests__/` file)
6. Add `"METHOD /path"` to `IMPLEMENTED_ROUTES` in `src/client/registry.ts`
7. Update `llms.txt` and `llms-full.txt` with the new function signature

## Publishing

Uses **Trusted Publishing** via GitHub Releases:
1. Bump version in `package.json`
2. Commit and push to `main`
3. Create a GitHub Release with the version tag (e.g. `v1.9.2`)
4. GitHub Actions CI builds and publishes to npm automatically

## Related Packages

- [soundcloud-api-ts-next](https://github.com/twin-paws/soundcloud-api-ts-next) — React hooks + Next.js API routes (depends on this package)
- [soundcloud-widget-react](https://github.com/twin-paws/soundcloud-widget-react) — React embed. Pass `trackId` / `playlistId`, not `getSoundCloudWidgetUrl()`

## Full Documentation

https://twin-paws.github.io/soundcloud-api-ts/
