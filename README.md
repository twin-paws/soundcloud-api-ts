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

// Get a client token
const token = await sc.auth.getClientToken();

// Search for tracks
const results = await sc.search.tracks(token.access_token, "electronic");
console.log(results.collection);

// Get the authenticated user
const me = await sc.me.getMe(token.access_token);

// Get a track, its streams, and comments
const track = await sc.tracks.getTrack(token.access_token, 123456);
const streams = await sc.tracks.getStreams(token.access_token, 123456);
const comments = await sc.tracks.getComments(token.access_token, 123456);
```

## Client Class

The `SoundCloudClient` class organizes all endpoints into namespaces:

```ts
const sc = new SoundCloudClient({ clientId, clientSecret, redirectUri });

// Auth
sc.auth.getClientToken()
sc.auth.getUserToken(code, codeVerifier?)
sc.auth.refreshUserToken(refreshToken)
sc.auth.signOut(accessToken)

// Me (authenticated user)
sc.me.getMe(token)
sc.me.getActivities(token, limit?)
sc.me.getActivitiesOwn(token, limit?)
sc.me.getActivitiesTracks(token, limit?)
sc.me.getLikesTracks(token, limit?)
sc.me.getLikesPlaylists(token, limit?)
sc.me.getFollowings(token, limit?)
sc.me.getFollowingsTracks(token, limit?)
sc.me.follow(token, userUrn)
sc.me.unfollow(token, userUrn)
sc.me.getFollowers(token, limit?)
sc.me.getPlaylists(token, limit?)
sc.me.getTracks(token, limit?)

// Users
sc.users.getUser(token, userId)
sc.users.getFollowers(token, userId, limit?)
sc.users.getFollowings(token, userId, limit?)
sc.users.getTracks(token, userId, limit?)
sc.users.getPlaylists(token, userId, limit?)
sc.users.getLikesTracks(token, userId, limit?, cursor?)
sc.users.getLikesPlaylists(token, userId, limit?)
sc.users.getWebProfiles(token, userId)

// Tracks
sc.tracks.getTrack(token, trackId)
sc.tracks.getStreams(token, trackId)
sc.tracks.getComments(token, trackId, limit?)
sc.tracks.createComment(token, trackId, body, timestamp?)
sc.tracks.getLikes(token, trackId, limit?)
sc.tracks.getReposts(token, trackId, limit?)
sc.tracks.getRelated(token, trackId, limit?)
sc.tracks.update(token, trackId, params)
sc.tracks.delete(token, trackId)

// Playlists
sc.playlists.getPlaylist(token, playlistId)
sc.playlists.getTracks(token, playlistId, limit?, offset?)
sc.playlists.getReposts(token, playlistId, limit?)
sc.playlists.create(token, params)
sc.playlists.update(token, playlistId, params)
sc.playlists.delete(token, playlistId)

// Likes
sc.likes.likeTrack(token, trackId)
sc.likes.unlikeTrack(token, trackId)
sc.likes.likePlaylist(token, playlistId)
sc.likes.unlikePlaylist(token, playlistId)

// Reposts
sc.reposts.repostTrack(token, trackId)
sc.reposts.unrepostTrack(token, trackId)
sc.reposts.repostPlaylist(token, playlistId)
sc.reposts.unrepostPlaylist(token, playlistId)

// Search
sc.search.tracks(token, query, pageNumber?)
sc.search.users(token, query, pageNumber?)
sc.search.playlists(token, query, pageNumber?)

// Resolve
sc.resolve.resolveUrl(token, url)
```

## Standalone Functions

Every endpoint is also available as a standalone function:

```ts
import { getMe, searchTracks, getClientToken, getTrackStreams } from "soundcloud-api-client";

const token = await getClientToken("clientId", "clientSecret");
const me = await getMe(token.access_token);
const tracks = await searchTracks(token.access_token, "lo-fi");
const streams = await getTrackStreams(token.access_token, 123456);
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

## OAuth Flow

```ts
const sc = new SoundCloudClient({
  clientId: "...",
  clientSecret: "...",
  redirectUri: "https://yourapp.com/callback",
});

// 1. Redirect user to https://secure.soundcloud.com/authorize
// 2. Exchange the code for a token (with PKCE code_verifier)
const token = await sc.auth.getUserToken(code, codeVerifier);

// 3. Use the token
const me = await sc.me.getMe(token.access_token);

// 4. Refresh when expired
const refreshed = await sc.auth.refreshUserToken(token.refresh_token);

// 5. Sign out
await sc.auth.signOut(token.access_token);
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
