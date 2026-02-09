# soundcloud-api-ts

[![npm version](https://img.shields.io/npm/v/soundcloud-api-ts)](https://www.npmjs.com/package/soundcloud-api-ts)
[![npm downloads](https://img.shields.io/npm/dm/soundcloud-api-ts)](https://www.npmjs.com/package/soundcloud-api-ts)
[![CI](https://github.com/twin-paws/soundcloud-api-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/twin-paws/soundcloud-api-ts/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/soundcloud-api-ts)](https://github.com/twin-paws/soundcloud-api-ts/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/soundcloud-api-ts)](https://bundlephobia.com/package/soundcloud-api-ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![coverage](https://img.shields.io/badge/coverage-67%25-yellow.svg)]()

A TypeScript client for the SoundCloud API. Zero dependencies, uses native `fetch`.

## Why soundcloud-api-ts?

- **Zero dependencies** — uses native `fetch`, nothing to install
- **Full TypeScript types** for all API responses
- **Token management built-in** — `setToken()`, auto-refresh on 401
- **PKCE support** for public clients and SPAs
- **Clean API** — `sc.tracks.getTrack(id)` not `getTrack(token, id)`
- **Dual ESM/CJS output** — works everywhere

## Comparison

| Feature | soundcloud-api-ts | soundcloud.ts | node-soundcloud |
| --- | --- | --- | --- |
| TypeScript | ✅ Native | ✅ | ❌ |
| Dependencies | 0 | varies | varies |
| OAuth 2.0 | ✅ Full | Partial | Partial |
| Auto token refresh | ✅ | ❌ | ❌ |
| PKCE | ✅ | ❌ | ❌ |
| Maintained | ✅ 2026 | — | — |

## Install

```bash
npm install soundcloud-api-ts
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

## Requirements

- Node.js 20+ (uses native `fetch`)
- SoundCloud API credentials

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) © Twin Paws
