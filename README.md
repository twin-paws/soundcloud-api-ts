# soundcloud-api-ts

[![npm version](https://img.shields.io/npm/v/soundcloud-api-ts)](https://www.npmjs.com/package/soundcloud-api-ts)
[![npm downloads](https://img.shields.io/npm/dm/soundcloud-api-ts)](https://www.npmjs.com/package/soundcloud-api-ts)
[![CI](https://github.com/twin-paws/soundcloud-api-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/twin-paws/soundcloud-api-ts/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/soundcloud-api-ts)](https://github.com/twin-paws/soundcloud-api-ts/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/soundcloud-api-ts)](https://bundlephobia.com/package/soundcloud-api-ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![coverage](https://img.shields.io/badge/coverage-94%25-brightgreen.svg)]()
[![docs](https://img.shields.io/badge/docs-TypeDoc-blue.svg)](https://twin-paws.github.io/soundcloud-api-ts/)

A fully-typed TypeScript client for the SoundCloud API. Zero dependencies, native `fetch`, built-in OAuth 2.0 + PKCE, automatic retry, and an interactive CLI.

## Why soundcloud-api-ts?

- **Zero dependencies** — uses native `fetch`, nothing to install
- **Full TypeScript types** for all API responses
- **Token management built-in** — `setToken()`, auto-refresh on 401
- **PKCE support** for public clients and SPAs
- **Interactive CLI** — explore the API from your terminal with `sc-cli`
- **Clean API** — `sc.tracks.getTrack(id)` not `getTrack(token, id)`
- **Automatic retry** — exponential backoff on 429 and 5xx
- **Dual ESM/CJS output** — works everywhere
- **LLM-friendly** — includes `llms.txt` and `AGENTS.md` for AI coding agents

## Comparison

| Feature | soundcloud-api-ts | soundcloud.ts | soundcloud-fetch |
| --- | --- | --- | --- |
| TypeScript | ✅ Native | ✅ | ✅ |
| Dependencies | **0** | 1 | 3 (lodash, cookie, undici) |
| Auth method | **Official OAuth 2.0** | ⚠️ Scrape client ID from browser | ⚠️ Scrape client ID from browser |
| PKCE support | ✅ | ❌ | ❌ |
| Auto token refresh | ✅ on 401 | ❌ | ❌ |
| Auto retry (429/5xx) | ✅ exponential backoff | ❌ | ❌ |
| CLI tool | ✅ `sc-cli` | ❌ | ❌ |
| Pagination helpers | ✅ async iterators | ❌ | ✅ |
| Typed errors | ✅ `SoundCloudError` | ❌ | ❌ |
| Test coverage | **94%** | — | — |
| API docs site | ✅ [TypeDoc](https://twin-paws.github.io/soundcloud-api-ts/) | ✅ | ❌ |
| LLM/AI-friendly | ✅ llms.txt + AGENTS.md | ❌ | ❌ |
| Maintained | ✅ 2026 | ✅ 2025 | ✅ 2026 |

> **Why does auth method matter?** `soundcloud.ts` and `soundcloud-fetch` use SoundCloud's undocumented internal `api-v2` and require you to scrape your client ID from browser dev tools. This can break anytime SoundCloud changes their frontend, and may violate the [API Terms of Use](https://developers.soundcloud.com/docs/api/terms-of-use) which state *"you must register your app"* and *"any attempt to circumvent this and obtain a new client ID and Security Code is strictly prohibited."*
>
> `soundcloud-api-ts` uses the **official documented API** (`api.soundcloud.com`) with registered app credentials, OAuth 2.1 as specified by SoundCloud, PKCE for public clients, and automatic token refresh.

## Install

```bash
npm install soundcloud-api-ts
```

## CLI

Explore the SoundCloud API right from your terminal — no code required:

```bash
# Install globally
npm install -g soundcloud-api-ts

# Set up credentials (interactive)
sc-cli auth

# Search tracks — colorful formatted table
sc-cli search "lofi beats"

# Get track details
sc-cli track 293

# View user profile
sc-cli user 12345

# Get stream URLs
sc-cli stream 293

# Show playlist with track listing
sc-cli playlist 456

# Resolve a SoundCloud URL
sc-cli resolve https://soundcloud.com/artist/track

# OAuth login for authenticated endpoints
sc-cli login
sc-cli me
sc-cli likes
```

Every command supports `--json` for machine-readable output (great for piping to `jq` or using in scripts). Run `sc-cli --help` for the full command list.

```
⚡ sc-cli — Explore the SoundCloud API from your terminal

Commands: auth, login, search, track, user, playlist, stream, resolve, me, likes
Options:  --json (raw JSON output), --help (per-command help)
```

## Quick Start

```ts
import { SoundCloudClient } from "soundcloud-api-ts";

const sc = new SoundCloudClient({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  redirectUri: "https://yourapp.com/callback",
});

// Get a client token and store it
const token = await sc.auth.getClientToken();
sc.setToken(token.access_token);

// Now all calls use the stored token automatically
const results = await sc.search.tracks("electronic");
const me = await sc.me.getMe();
const track = await sc.tracks.getTrack(123456);
const streams = await sc.tracks.getStreams(123456);
```

## OAuth 2.0 Flow

```ts
import { SoundCloudClient, generateCodeVerifier, generateCodeChallenge } from "soundcloud-api-ts";

const sc = new SoundCloudClient({
  clientId: "...",
  clientSecret: "...",
  redirectUri: "https://yourapp.com/callback",
  // Optional: auto-refresh tokens on 401
  onTokenRefresh: async (client) => {
    const newToken = await client.auth.refreshUserToken(client.refreshToken!);
    // Persist newToken to your DB here
    return newToken;
  },
});

// 1. Generate PKCE pair (for public clients / SPAs)
const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

// 2. Build authorization URL and redirect the user
const authUrl = sc.auth.getAuthorizationUrl({ state: "random", codeChallenge: challenge });
// → redirect user to authUrl

// 3. Exchange the code for tokens (in your callback handler)
const token = await sc.auth.getUserToken(code, verifier);
sc.setToken(token.access_token, token.refresh_token);

// 4. Use the API — token is used automatically
const me = await sc.me.getMe();
const tracks = await sc.search.tracks("lofi beats");

// 5. Override token per-call if needed
const otherMe = await sc.me.getMe({ token: "other-users-token" });

// 6. Refresh manually if needed
const refreshed = await sc.auth.refreshUserToken(token.refresh_token);
sc.setToken(refreshed.access_token, refreshed.refresh_token);

// 7. Sign out
await sc.auth.signOut(token.access_token);
sc.clearToken();
```

## Client Class

The `SoundCloudClient` class organizes all endpoints into namespaces. Token is resolved automatically when `setToken()` has been called. Override per-call via `{ token: "..." }` options object.

```ts
const sc = new SoundCloudClient({ clientId, clientSecret, redirectUri });

// Token management
sc.setToken(accessToken, refreshToken?)
sc.clearToken()
sc.accessToken   // getter
sc.refreshToken  // getter

// Auth
sc.auth.getAuthorizationUrl({ state?, codeChallenge? })
sc.auth.getClientToken()
sc.auth.getUserToken(code, codeVerifier?)
sc.auth.refreshUserToken(refreshToken)
sc.auth.signOut(accessToken)

// Me (authenticated user) — primary params first, options last
sc.me.getMe(options?)
sc.me.getActivities(limit?, options?)
sc.me.getActivitiesOwn(limit?, options?)
sc.me.getActivitiesTracks(limit?, options?)
sc.me.getLikesTracks(limit?, options?)
sc.me.getLikesPlaylists(limit?, options?)
sc.me.getFollowings(limit?, options?)
sc.me.getFollowingsTracks(limit?, options?)
sc.me.follow(userUrn, options?)
sc.me.unfollow(userUrn, options?)
sc.me.getFollowers(limit?, options?)
sc.me.getPlaylists(limit?, options?)
sc.me.getTracks(limit?, options?)

// Users
sc.users.getUser(userId, options?)
sc.users.getFollowers(userId, limit?, options?)
sc.users.getFollowings(userId, limit?, options?)
sc.users.getTracks(userId, limit?, options?)
sc.users.getPlaylists(userId, limit?, options?)
sc.users.getLikesTracks(userId, limit?, cursor?, options?)
sc.users.getLikesPlaylists(userId, limit?, options?)
sc.users.getWebProfiles(userId, options?)

// Tracks
sc.tracks.getTrack(trackId, options?)
sc.tracks.getStreams(trackId, options?)
sc.tracks.getComments(trackId, limit?, options?)
sc.tracks.createComment(trackId, body, timestamp?, options?)
sc.tracks.getLikes(trackId, limit?, options?)
sc.tracks.getReposts(trackId, limit?, options?)
sc.tracks.getRelated(trackId, limit?, options?)
sc.tracks.update(trackId, params, options?)
sc.tracks.delete(trackId, options?)

// Playlists
sc.playlists.getPlaylist(playlistId, options?)
sc.playlists.getTracks(playlistId, limit?, offset?, options?)
sc.playlists.getReposts(playlistId, limit?, options?)
sc.playlists.create(params, options?)
sc.playlists.update(playlistId, params, options?)
sc.playlists.delete(playlistId, options?)

// Likes
sc.likes.likeTrack(trackId, options?)
sc.likes.unlikeTrack(trackId, options?)
sc.likes.likePlaylist(playlistId, options?)
sc.likes.unlikePlaylist(playlistId, options?)

// Reposts
sc.reposts.repostTrack(trackId, options?)
sc.reposts.unrepostTrack(trackId, options?)
sc.reposts.repostPlaylist(playlistId, options?)
sc.reposts.unrepostPlaylist(playlistId, options?)

// Search
sc.search.tracks(query, pageNumber?, options?)
sc.search.users(query, pageNumber?, options?)
sc.search.playlists(query, pageNumber?, options?)

// Resolve
sc.resolve.resolveUrl(url, options?)
```

Where `options` is `{ token?: string }` — only needed to override the stored token.

## Standalone Functions

Every endpoint is also available as a standalone function (token is always required):

```ts
import {
  getClientToken, getUserToken, getAuthorizationUrl,
  generateCodeVerifier, generateCodeChallenge,
  getMe, searchTracks,
} from "soundcloud-api-ts";

const token = await getClientToken("clientId", "clientSecret");
const me = await getMe(token.access_token);
const tracks = await searchTracks(token.access_token, "lo-fi");

// Build auth URL
const authUrl = getAuthorizationUrl("clientId", "https://yourapp.com/callback", { state: "xyz" });
```

## Types

All response types match the SoundCloud API spec:

```ts
import type {
  SoundCloudUser,
  SoundCloudMe,
  SoundCloudTrack,
  SoundCloudPlaylist,
  SoundCloudComment,
  SoundCloudToken,
  SoundCloudStreams,
  SoundCloudWebProfile,
  SoundCloudActivity,
  SoundCloudActivitiesResponse,
  SoundCloudPaginatedResponse,
  TokenOption,
} from "soundcloud-api-ts/types";
```

## PKCE (Proof Key for Code Exchange)

For public clients (SPAs, mobile apps), use PKCE:

```ts
import { generateCodeVerifier, generateCodeChallenge } from "soundcloud-api-ts";

const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

// Pass challenge when building auth URL
const url = sc.auth.getAuthorizationUrl({ codeChallenge: challenge });

// Pass verifier when exchanging the code
const token = await sc.auth.getUserToken(code, verifier);
```

## Pagination

Paginated endpoints return `SoundCloudPaginatedResponse<T>`:

```ts
interface SoundCloudPaginatedResponse<T> {
  collection: T[];
  next_href: string; // URL for next page
}
```

### Automatic Pagination

The client provides three helpers that automatically follow `next_href` across pages:

```ts
// Stream pages — yields T[] for each page
for await (const page of sc.paginate(() => sc.users.getTracks(userId))) {
  console.log(`Got ${page.length} tracks`);
}

// Stream individual items — yields one T at a time
for await (const track of sc.paginateItems(() => sc.search.tracks("lofi"))) {
  console.log(track.title);
}

// Collect all into a flat array (with optional limit)
const allTracks = await sc.fetchAll(() => sc.users.getTracks(userId));
const first100 = await sc.fetchAll(() => sc.search.tracks("lofi"), { maxItems: 100 });
```

The standalone functions are also exported for advanced use:

```ts
import { paginate, paginateItems, fetchAll, scFetchUrl } from "soundcloud-api-ts";
```

## Utilities

```ts
import { getSoundCloudWidgetUrl } from "soundcloud-api-ts";

// Generate a SoundCloud embed widget URL
const widgetUrl = getSoundCloudWidgetUrl(trackId);
```

## Error Handling

All API errors throw a `SoundCloudError` with structured properties:

```ts
import { SoundCloudError } from "soundcloud-api-ts";

try {
  await sc.tracks.getTrack(999);
} catch (err) {
  if (err instanceof SoundCloudError) {
    console.log(err.status);     // 404
    console.log(err.statusText); // "Not Found"
    console.log(err.message);    // "404 - Not Found" (from SC's response)
    console.log(err.errorCode);  // "invalid_client" (on auth errors)
    console.log(err.errors);     // ["404 - Not Found"] (individual error messages)
    console.log(err.docsLink);   // "https://developers.soundcloud.com/docs/api/explorer/open-api"
    console.log(err.body);       // full parsed response body

    // Convenience getters
    if (err.isNotFound) { /* handle 404 */ }
    if (err.isRateLimited) { /* handle 429 */ }
    if (err.isUnauthorized) { /* handle 401 */ }
    if (err.isForbidden) { /* handle 403 */ }
    if (err.isServerError) { /* handle 5xx */ }
  }
}
```

Error messages are parsed directly from SoundCloud's API response format, giving you the most useful message available.

## Rate Limiting & Retries

The client automatically retries on **429 Too Many Requests** and **5xx Server Errors** with exponential backoff:

```ts
const sc = new SoundCloudClient({
  clientId: "...",
  clientSecret: "...",
  maxRetries: 3,         // default: 3
  retryBaseDelay: 1000,  // default: 1000ms
  onDebug: (msg) => console.log(msg), // optional retry logging
});
```

- **429 responses** respect the `Retry-After` header when present
- **5xx responses** (500, 502, 503, 504) are retried with exponential backoff
- **4xx errors** (except 429) are NOT retried — they throw immediately
- **401 errors** trigger `onTokenRefresh` (if configured) instead of retry
- Backoff formula: `baseDelay × 2^attempt` with jitter

## API Terms Compliance

This package is built on SoundCloud's **official documented API** (`api.soundcloud.com`) and follows the [API Terms of Use](https://developers.soundcloud.com/docs/api/terms-of-use):

- ✅ Uses registered app credentials (client ID + client secret) via OAuth 2.1
- ✅ No undocumented or internal API endpoints (`api-v2`)
- ✅ No client ID scraping or credential circumvention
- ✅ No content downloading, ripping, or stream capture
- ✅ No content aggregation into alternative streaming services

> **Important:** SoundCloud's API Terms prohibit using User Content (audio, tracks, metadata) to train or develop AI/ML models. The "LLM-friendly" features of this package (`llms.txt`, `AGENTS.md`) are for helping AI coding agents **use the package itself** — not for feeding SoundCloud content to AI systems. Please review the [full terms](https://developers.soundcloud.com/docs/api/terms-of-use) before building your application.

## AI / LLM Integration

This package is designed to be easily used by AI coding agents:

- **[`llms.txt`](llms.txt)** — Complete method reference in plain text, optimized for LLM consumption
- **[`AGENTS.md`](AGENTS.md)** — Setup guide, common patterns, and gotchas for AI agents
- **Full JSDoc** with `@example` on every export — works great with GitHub Copilot, Cursor, etc.

## Documentation

Full API documentation is available at **[twin-paws.github.io/soundcloud-api-ts](https://twin-paws.github.io/soundcloud-api-ts/)** — auto-generated from source with TypeDoc.

## Requirements

- Node.js 20+ (uses native `fetch`)
- SoundCloud API credentials

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) © Twin Paws
