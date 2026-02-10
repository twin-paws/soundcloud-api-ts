# AGENTS.md — soundcloud-api-ts

Instructions for AI coding agents working with this package.

## Setup

- **Node.js 20+** required (uses native `fetch` and Web Crypto)
- No environment variables are read by the package — all config is passed to the constructor

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
sc.setToken(token.access_token);
// Now you can call public endpoints: tracks, users, search, playlists, resolve
```

### User Token (user context required)

Some endpoints require a user token (not just client credentials):
- All `sc.me.*` endpoints
- `sc.likes.*` (likeTrack, unlikeTrack, likePlaylist, unlikePlaylist)
- `sc.reposts.*` (repostTrack, unrepostTrack, repostPlaylist, unrepostPlaylist)
- `sc.tracks.createComment()`, `sc.tracks.update()`, `sc.tracks.delete()`
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
    err.isNotFound;    // true if 404
    err.isUnauthorized; // true if 401
    err.isRateLimited; // true if 429
    err.isServerError; // true if 5xx
    err.errorCode;     // Machine-readable code like "invalid_client"
  }
}
```

## Gotchas

1. **Token required for ALL requests** — even public endpoints like `getTrack` need at least a client credentials token. Call `setToken()` first.
2. **User token vs client token** — write operations (like, repost, comment, follow, create/update/delete) require a user token obtained via the authorization code flow. A client credentials token won't work.
3. **Rate limits exist** — SoundCloud returns 429 when rate limited. The client has built-in retry with exponential backoff (configurable via `maxRetries` and `retryBaseDelay`).
4. **Auto token refresh** — pass `onTokenRefresh` in the config to automatically refresh expired tokens on 401.
5. **No env vars** — the package reads no environment variables. Pass `clientId`, `clientSecret`, and `redirectUri` directly to the constructor.
6. **IDs can be numbers or strings** — all ID parameters accept `string | number`.
7. **Search pagination** — search uses zero-based `pageNumber` (10 results per page), not cursor-based pagination.

## Project Structure (for contributors)

```
src/
  index.ts                     — All public exports (source of truth)
  client/SoundCloudClient.ts   — Main client class with all namespaced methods
  client/http.ts               — scFetch, scFetchUrl (HTTP layer with retry)
  client/paginate.ts           — paginate, paginateItems, fetchAll helpers
  auth/                        — Standalone auth functions + PKCE
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
5. Add tests in `src/<category>/__tests__/`
6. Update `llms.txt` and `llms-full.txt` with the new function signature

## Publishing

Uses **Trusted Publishing** via GitHub Releases:
1. Bump version in `package.json`
2. Commit and push to `main`
3. Create a GitHub Release with the version tag (e.g. `v1.9.2`)
4. GitHub Actions CI builds and publishes to npm automatically

## Related Packages

- [soundcloud-api-ts-next](https://github.com/twin-paws/soundcloud-api-ts-next) — React hooks + Next.js API routes (depends on this package)

## Full Documentation

https://twin-paws.github.io/soundcloud-api-ts/
