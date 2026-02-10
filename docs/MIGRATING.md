# Migrating from soundcloud.ts

Switching from `soundcloud.ts` to `soundcloud-api-ts`? Here's everything you need to know. The migration is straightforward — most changes are find-and-replace.

## Why migrate?

| | soundcloud.ts | soundcloud-api-ts |
|---|---|---|
| Bundle size | ❌ Unbundlable (ffmpeg-static, ~70MB native binary) | **4.5 KB** min+gzip |
| Dependencies | 1 (ffmpeg-static) | **0** |
| Auth | Scrape client ID from browser devtools | Official OAuth 2.1 + PKCE |
| API used | Undocumented `api-v2` (may violate ToS) | Official `api.soundcloud.com` |
| Token refresh | Manual | Automatic on 401 |
| Retry | None | Exponential backoff (429/5xx) |
| CLI | None | `sc-cli` |
| Typed errors | No | `SoundCloudError` with status, code, body |
| Test coverage | Unknown | 100% |
| Node.js | Any | ≥20 (native fetch) |

### The big ones

1. **No more native binary.** `soundcloud.ts` depends on `ffmpeg-static` which downloads a ~70MB platform-specific binary. This breaks in Docker, serverless, CI, and anywhere you can't run native binaries. `soundcloud-api-ts` is pure TypeScript.

2. **Official API.** `soundcloud.ts` scrapes a client ID from SoundCloud's web app and hits their undocumented internal API. This breaks when SoundCloud changes their frontend (it has) and may violate their [Terms of Use](https://developers.soundcloud.com/docs/api/terms-of-use). We use the official registered-app OAuth flow.

3. **Actually bundlable.** You can tree-shake, bundle, and deploy `soundcloud-api-ts` anywhere — Vercel, Cloudflare Workers, Deno, browser, whatever.

## Setup differences

### soundcloud.ts
```ts
import SoundCloud from "soundcloud.ts";

// Scrapes client ID from SoundCloud's website
const soundcloud = new SoundCloud();
// or with a client ID you manually extracted from browser devtools
const soundcloud = new SoundCloud("your-scraped-client-id");
```

### soundcloud-api-ts
```ts
import { SoundCloudClient } from "soundcloud-api-ts";

// Register your app at https://soundcloud.com/you/apps
const sc = new SoundCloudClient({
  clientId: "your-registered-client-id",
  clientSecret: "your-client-secret",
  redirectUri: "https://yourapp.com/callback",
});

// Get a token (client credentials for server-side, OAuth for user actions)
const token = await sc.auth.getClientToken();
sc.setToken(token.access_token);
```

> **"But I don't have registered app credentials!"**
> Register at [soundcloud.com/you/apps](https://soundcloud.com/you/apps). It's free and takes 2 minutes. This is the official, supported way to use the SoundCloud API.

## API mapping

### Tracks

```ts
// soundcloud.ts
const track = await soundcloud.tracks.get("https://soundcloud.com/artist/track");
const track = await soundcloud.tracks.getV2(trackId);
const search = await soundcloud.tracks.searchV2("query");

// soundcloud-api-ts
const track = await sc.resolve.resolve("https://soundcloud.com/artist/track");
const track = await sc.tracks.getTrack(trackId);
const search = await sc.search.tracks("query");
```

### Users

```ts
// soundcloud.ts
const user = await soundcloud.users.getV2(userId);
const search = await soundcloud.users.searchV2("query");
const tracks = await soundcloud.users.tracksV2(userId);

// soundcloud-api-ts
const user = await sc.users.getUser(userId);
const search = await sc.search.users("query");
const tracks = await sc.users.getTracks(userId);
```

### Playlists

```ts
// soundcloud.ts
const playlist = await soundcloud.playlists.getV2(playlistId);
const search = await soundcloud.playlists.searchV2("query");

// soundcloud-api-ts
const playlist = await sc.playlists.getPlaylist(playlistId);
const search = await sc.search.playlists("query");
```

### Streaming

```ts
// soundcloud.ts — downloads via ffmpeg (native binary required)
const stream = await soundcloud.util.streamTrack("https://soundcloud.com/artist/track");
await soundcloud.util.downloadTrack("https://soundcloud.com/artist/track", "output.mp3");

// soundcloud-api-ts — returns stream URLs (you handle playback)
const streams = await sc.tracks.getStreams(trackId);
// streams.http_mp3_128_url, streams.hls_mp3_128_url, etc.
```

> **Note:** `soundcloud-api-ts` returns stream URLs rather than downloading files. This is intentional — it keeps the package zero-dep and lets you choose your own playback/download method. Pipe the URL to `ffmpeg`, `fetch`, or any audio library.

### Resolve (URL → resource)

```ts
// soundcloud.ts
const result = await soundcloud.resolve.getV2("https://soundcloud.com/...");

// soundcloud-api-ts
const result = await sc.resolve.resolve("https://soundcloud.com/...");
```

### Me (authenticated user)

```ts
// soundcloud.ts — no built-in user auth flow

// soundcloud-api-ts — full OAuth 2.1 + PKCE
const me = await sc.me.getMe();
const likes = await sc.me.getLikes();
const playlists = await sc.me.getPlaylists();
const followings = await sc.me.getFollowings();
```

## Pagination

```ts
// soundcloud.ts — manual offset/limit
const page1 = await soundcloud.tracks.searchV2("query", 10, 0);
const page2 = await soundcloud.tracks.searchV2("query", 10, 10);

// soundcloud-api-ts — async iterators
import { fetchAll, paginate } from "soundcloud-api-ts";

// Get all results
const allTracks = await fetchAll((params) => sc.search.tracks("query", params));

// Or iterate page by page
for await (const page of paginate((params) => sc.search.tracks("query", params))) {
  console.log(page.collection);
}
```

## Error handling

```ts
// soundcloud.ts — generic errors
try {
  await soundcloud.tracks.getV2(999999999);
} catch (e) {
  // Untyped error, good luck
}

// soundcloud-api-ts — structured errors
import { SoundCloudError } from "soundcloud-api-ts";

try {
  await sc.tracks.getTrack(999999999);
} catch (e) {
  if (e instanceof SoundCloudError) {
    console.log(e.status);  // 404
    console.log(e.code);    // "not_found"
    console.log(e.body);    // Raw response body
  }
}
```

## Type differences

Types are named differently but map cleanly:

| soundcloud.ts | soundcloud-api-ts |
|---|---|
| `SoundcloudTrackV2` | `SoundCloudTrack` |
| `SoundcloudUserV2` | `SoundCloudUser` |
| `SoundcloudPlaylistV2` | `SoundCloudPlaylist` |
| `SoundcloudTrackSearchV2` | `SoundCloudSearchResult<SoundCloudTrack>` |
| (no typed errors) | `SoundCloudError` |
| (no token types) | `SoundCloudToken` |

## TL;DR

1. `npm uninstall soundcloud.ts && npm install soundcloud-api-ts`
2. Register your app at [soundcloud.com/you/apps](https://soundcloud.com/you/apps)
3. Replace `new SoundCloud()` with `new SoundCloudClient({ clientId, clientSecret, redirectUri })`
4. Replace `.getV2()` / `.searchV2()` with the clean method names above
5. Enjoy zero deps, 4.5 KB bundles, and an API that won't break when SoundCloud redesigns their website

---

Questions? [Open an issue](https://github.com/twin-paws/soundcloud-api-ts/issues) or check the [full API docs](https://twin-paws.github.io/soundcloud-api-ts/).
