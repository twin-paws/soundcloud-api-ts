# soundcloud-api-client

A TypeScript client for the SoundCloud API. Zero dependencies, uses native `fetch` (Node 18+).

## Install

```bash
npm install soundcloud-api-client
```

## Quick Start

```ts
import { SoundCloudClient } from "soundcloud-api-client";

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
const track = await sc.tracks.getTrack(undefined, 123456);
const streams = await sc.tracks.getStreams(undefined, 123456);
```

## OAuth 2.0 Flow

```ts
import { SoundCloudClient, generateCodeVerifier, generateCodeChallenge } from "soundcloud-api-client";

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
const otherMe = await sc.me.getMe("other-users-token");

// 6. Refresh manually if needed
const refreshed = await sc.auth.refreshUserToken(token.refresh_token);
sc.setToken(refreshed.access_token, refreshed.refresh_token);

// 7. Sign out
await sc.auth.signOut(token.access_token);
sc.clearToken();
```

## Client Class

The `SoundCloudClient` class organizes all endpoints into namespaces. Token is optional on every method when `setToken()` has been called.

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

// Me (authenticated user) — token optional if stored
sc.me.getMe(token?)
sc.me.getActivities(token?, limit?)
sc.me.getActivitiesOwn(token?, limit?)
sc.me.getActivitiesTracks(token?, limit?)
sc.me.getLikesTracks(token?, limit?)
sc.me.getLikesPlaylists(token?, limit?)
sc.me.getFollowings(token?, limit?)
sc.me.getFollowingsTracks(token?, limit?)
sc.me.follow(token?, userUrn)
sc.me.unfollow(token?, userUrn)
sc.me.getFollowers(token?, limit?)
sc.me.getPlaylists(token?, limit?)
sc.me.getTracks(token?, limit?)

// Users
sc.users.getUser(token?, userId)
sc.users.getFollowers(token?, userId, limit?)
sc.users.getFollowings(token?, userId, limit?)
sc.users.getTracks(token?, userId, limit?)
sc.users.getPlaylists(token?, userId, limit?)
sc.users.getLikesTracks(token?, userId, limit?, cursor?)
sc.users.getLikesPlaylists(token?, userId, limit?)
sc.users.getWebProfiles(token?, userId)

// Tracks
sc.tracks.getTrack(token?, trackId)
sc.tracks.getStreams(token?, trackId)
sc.tracks.getComments(token?, trackId, limit?)
sc.tracks.createComment(token?, trackId, body, timestamp?)
sc.tracks.getLikes(token?, trackId, limit?)
sc.tracks.getReposts(token?, trackId, limit?)
sc.tracks.getRelated(token?, trackId, limit?)
sc.tracks.update(token?, trackId, params)
sc.tracks.delete(token?, trackId)

// Playlists
sc.playlists.getPlaylist(token?, playlistId)
sc.playlists.getTracks(token?, playlistId, limit?, offset?)
sc.playlists.getReposts(token?, playlistId, limit?)
sc.playlists.create(token?, params)
sc.playlists.update(token?, playlistId, params)
sc.playlists.delete(token?, playlistId)

// Likes
sc.likes.likeTrack(token?, trackId)
sc.likes.unlikeTrack(token?, trackId)
sc.likes.likePlaylist(token?, playlistId)
sc.likes.unlikePlaylist(token?, playlistId)

// Reposts
sc.reposts.repostTrack(token?, trackId)
sc.reposts.unrepostTrack(token?, trackId)
sc.reposts.repostPlaylist(token?, playlistId)
sc.reposts.unrepostPlaylist(token?, playlistId)

// Search — query as first arg when token stored
sc.search.tracks(query, pageNumber?)
sc.search.users(query, pageNumber?)
sc.search.playlists(query, pageNumber?)

// Resolve
sc.resolve.resolveUrl(url)
```

## Standalone Functions

Every endpoint is also available as a standalone function:

```ts
import {
  getClientToken, getUserToken, getAuthorizationUrl,
  generateCodeVerifier, generateCodeChallenge,
  getMe, searchTracks,
} from "soundcloud-api-client";

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
} from "soundcloud-api-client/types";
```

## PKCE (Proof Key for Code Exchange)

For public clients (SPAs, mobile apps), use PKCE:

```ts
import { generateCodeVerifier, generateCodeChallenge } from "soundcloud-api-client";

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

## Utilities

```ts
import { getSoundCloudWidgetUrl } from "soundcloud-api-client";

// Generate a SoundCloud embed widget URL
const widgetUrl = getSoundCloudWidgetUrl(trackId);
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- SoundCloud API credentials

## License

MIT
