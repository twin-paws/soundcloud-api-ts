# @tsd/soundcloud

TypeScript SoundCloud API client extracted from the TSD monorepo. Uses native `fetch` (Node 18+), zero dependencies.

## Install

```bash
npm install @tsd/soundcloud
```

## Usage

### Client class (recommended)

```ts
import { SoundCloudClient } from "@tsd/soundcloud";

const sc = new SoundCloudClient({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  redirectUri: "https://yourapp.com/callback",
});

// Auth
const token = await sc.auth.getClientToken();
const userToken = await sc.auth.getUserToken(authCode);

// Users
const me = await sc.users.getMe(token.accessToken);
const user = await sc.users.getUser(token.accessToken, "12345");
const followers = await sc.users.getFollowers(token.accessToken, "12345", 50);
const tracks = await sc.users.getTracks(token.accessToken, "12345");

// Tracks
const track = await sc.tracks.getTrack(token.accessToken, "67890");
const comments = await sc.tracks.getComments(token.accessToken, "67890");
const liked = await sc.tracks.like(token.accessToken, "67890");

// Search
const results = await sc.search.tracks(token.accessToken, "electronic");
const users = await sc.search.users(token.accessToken, "artist name");

// Playlists
const playlist = await sc.playlists.getPlaylist(token.accessToken, "111");

// Resolve
const resolved = await sc.resolve.resolveUrl(token.accessToken, "https://soundcloud.com/...");
```

### Standalone functions

```ts
import { GetSCMe, SearchTracks, GetSCClientToken } from "@tsd/soundcloud";

const token = await GetSCClientToken("clientId", "clientSecret");
const me = await GetSCMe(token.accessToken);
const tracks = await SearchTracks(token.accessToken, "electronic");
```

### Types only

```ts
import type { SCApiTrack, SCUser, Track, Token } from "@tsd/soundcloud/types";
```

### Mappers only

```ts
import { SCApiTrackToTSDTrack, SCApiUserToTSDUser } from "@tsd/soundcloud/mappers";
```

## API Coverage

All 24 SoundCloud API endpoints:

| Category | Methods |
|----------|---------|
| **Auth** | `getClientToken`, `getUserToken`, `refreshUserToken` |
| **Users** | `getMe`, `getUser`, `getFollowers`, `getFollowings`, `getTracks`, `getPlaylists`, `getLikesTracks`, `getLikesPlaylists` |
| **Tracks** | `getTrack`, `getComments`, `getLikes`, `getReposts`, `getRelated`, `like` |
| **Playlists** | `getPlaylist`, `getTracks`, `getReposts` |
| **Search** | `tracks`, `users`, `playlists` |
| **Resolve** | `resolveUrl` |

## Utils

```ts
import { getSCWidgetUrl, FormatDate, GetTags } from "@tsd/soundcloud";
```

## License

MIT
