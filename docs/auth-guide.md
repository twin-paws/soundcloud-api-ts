# Auth Guide — soundcloud-api-ts

This guide covers every authentication scenario you will encounter with the SoundCloud API: client credentials for server-to-server access, the user OAuth 2.1 + PKCE flow, token refresh, pluggable token stores, and troubleshooting 401 errors.

---

## 1. Client Credentials (server-to-server)

### What it gives you

Client credentials authenticate your **application**, not a user. Use this when you want to access public SoundCloud content without a logged-in user — for example, a server that serves track embeds, a search widget, or a data pipeline.

```ts
import { SoundCloudClient } from 'soundcloud-api-ts';

const sc = new SoundCloudClient({
  clientId: process.env.SOUNDCLOUD_CLIENT_ID!,
  clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
});

const token = await sc.auth.getClientToken();
sc.setToken(token.access_token);

// Now call any public endpoint
const track = await sc.tracks.getTrack(123456);
const results = await sc.search.tracks('lofi hip hop');
const user = await sc.users.getUser(987654);
```

### What it does NOT give you

A client credentials token **cannot** access:

- `/me` endpoints — there is no "authenticated user" in a client credentials context
- Likes, reposts, follows — write operations require a user token
- Track create/update/delete
- Playlist create/update/delete

Attempting these with a client credentials token returns `401 Unauthorized` with `"insufficient_scope"` or `"unauthorized_client"`.

---

## 2. User Authorization Code + PKCE

Use this flow when your application acts on behalf of a specific user: showing their uploads, liking tracks, creating playlists, etc.

### Full flow

```ts
import {
  SoundCloudClient,
  generateCodeVerifier,
  generateCodeChallenge,
} from 'soundcloud-api-ts';

const sc = new SoundCloudClient({
  clientId: process.env.SOUNDCLOUD_CLIENT_ID!,
  clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
  redirectUri: 'https://yourapp.com/callback',
});

// Step 1: Generate a PKCE pair and store the verifier in the session
const verifier = generateCodeVerifier();                    // random 43-128 char string
const challenge = await generateCodeChallenge(verifier);    // SHA-256 of verifier, base64url

// Step 2: Redirect the user to SoundCloud's authorization page
const authUrl = sc.auth.getAuthorizationUrl({
  state: crypto.randomUUID(),   // CSRF protection — verify in callback
  codeChallenge: challenge,
});
// → redirect(authUrl)

// Step 3: Handle the callback (user was redirected back with ?code=...&state=...)
// Verify state matches what you stored, then:
const token = await sc.auth.getUserToken(req.query.code, verifier);
sc.setToken(token.access_token, token.refresh_token);

// Step 4: Use the API
const me = await sc.me.getMe();
await sc.likes.likeTrack(123456);
```

### Token structure

```ts
token.access_token   // Bearer token for API requests (expires in ~3600s)
token.refresh_token  // Used to get a new access token without re-authorizing
token.expires_in     // Seconds until access_token expires
token.scope          // Granted scope (usually "*")
```

---

## 3. Token Refresh

Access tokens expire. There are two ways to handle this.

### Auto-refresh via onTokenRefresh

Pass `onTokenRefresh` in the constructor. It fires automatically when any request returns `401`. The new tokens are applied to the client and the original request is retried transparently.

```ts
const sc = new SoundCloudClient({
  clientId: process.env.SOUNDCLOUD_CLIENT_ID!,
  clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
  redirectUri: 'https://yourapp.com/callback',
  onTokenRefresh: async (client) => {
    // client.refreshToken is the stored refresh token
    const refreshToken = await db.getRefreshToken(userId);
    const newToken = await client.auth.refreshUserToken(refreshToken);
    // Persist the new tokens
    await db.saveTokens(userId, newToken.access_token, newToken.refresh_token);
    return newToken;
  },
});
```

### Manual refresh

Call `refreshUserToken` yourself when you detect an expiry:

```ts
try {
  await sc.tracks.getTrack(123456);
} catch (err) {
  if (err instanceof SoundCloudError && err.isUnauthorized) {
    const newToken = await sc.auth.refreshUserToken(sc.refreshToken!);
    sc.setToken(newToken.access_token, newToken.refresh_token);
    // retry...
  }
}
```

---

## 4. TokenProvider Pattern

The `TokenProvider` and `TokenStore` interfaces (exported from `soundcloud-api-ts`) let you encapsulate token storage so the same client can be reused across requests in a server environment.

```ts
import type { TokenProvider, TokenStore } from 'soundcloud-api-ts';
```

### Simple in-memory store

```ts
import type { TokenStore } from 'soundcloud-api-ts';

class InMemoryTokenStore implements TokenStore {
  private _access?: string;
  private _refresh?: string;

  getAccessToken()  { return this._access; }
  getRefreshToken() { return this._refresh; }
  setTokens(access: string, refresh?: string) {
    this._access = access;
    this._refresh = refresh;
  }
  clearTokens() {
    this._access = undefined;
    this._refresh = undefined;
  }
}
```

### NextAuth session bridge (no dependency)

In a Next.js app using NextAuth, tokens are stored in the session. Bridge them at request time:

```ts
// lib/soundcloud.ts
import { SoundCloudClient } from 'soundcloud-api-ts';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getSoundCloudClient() {
  const session = await getServerSession(authOptions);
  if (!session?.soundcloud?.accessToken) throw new Error('Not authenticated');

  const sc = new SoundCloudClient({
    clientId: process.env.SOUNDCLOUD_CLIENT_ID!,
    clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
    redirectUri: process.env.SOUNDCLOUD_REDIRECT_URI!,
    onTokenRefresh: async (client) => {
      // Call your own refresh endpoint or call SoundCloud directly
      const newToken = await client.auth.refreshUserToken(session.soundcloud.refreshToken);
      // Update the session (implementation depends on your NextAuth version)
      return newToken;
    },
  });

  sc.setToken(session.soundcloud.accessToken, session.soundcloud.refreshToken);
  return sc;
}
```

### Clerk session bridge

```ts
// lib/soundcloud.ts
import { SoundCloudClient } from 'soundcloud-api-ts';
import { auth } from '@clerk/nextjs/server';

export async function getSoundCloudClient() {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  // Load tokens you stored during OAuth callback
  const { accessToken, refreshToken } = await db.getSoundCloudTokens(userId);

  const sc = new SoundCloudClient({
    clientId: process.env.SOUNDCLOUD_CLIENT_ID!,
    clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
    redirectUri: process.env.SOUNDCLOUD_REDIRECT_URI!,
    onTokenRefresh: async (client) => {
      const newToken = await client.auth.refreshUserToken(refreshToken);
      await db.saveSoundCloudTokens(userId, newToken.access_token, newToken.refresh_token);
      return newToken;
    },
  });

  sc.setToken(accessToken, refreshToken);
  return sc;
}
```

---

## 5. What requires user tokens vs client credentials

| Endpoint category | Client Credentials | User Token |
|---|---|---|
| `sc.tracks.getTrack`, `sc.tracks.getStreams`, `sc.tracks.getRelated` | ✅ | ✅ |
| `sc.search.tracks`, `sc.search.users`, `sc.search.playlists` | ✅ | ✅ |
| `sc.users.getUser`, `sc.users.getFollowers`, etc. | ✅ | ✅ |
| `sc.playlists.getPlaylist`, `sc.playlists.getTracks` | ✅ | ✅ |
| `sc.resolve.resolveUrl` | ✅ | ✅ |
| `sc.me.getMe` | ❌ | ✅ |
| `sc.me.getActivities`, `sc.me.getLikesTracks`, etc. | ❌ | ✅ |
| `sc.me.getConnections` | ❌ | ✅ |
| `sc.likes.likeTrack`, `sc.likes.unlikeTrack` | ❌ | ✅ |
| `sc.reposts.repostTrack`, `sc.reposts.unrepostTrack` | ❌ | ✅ |
| `sc.tracks.createComment`, `sc.tracks.update`, `sc.tracks.delete` | ❌ | ✅ |
| `sc.playlists.create`, `sc.playlists.update`, `sc.playlists.delete` | ❌ | ✅ |
| `sc.me.follow`, `sc.me.unfollow` | ❌ | ✅ |

**Common gotcha:** calling any `/me` endpoint with a client credentials token returns `401 Unauthorized` with error code `"insufficient_scope"`. You need a user token.

---

## 6. Troubleshooting 401 Errors

Use `sc.raw` to inspect the exact error response body:

```ts
const res = await sc.raw.get('/me', {});
console.log(res.status, res.data);
// → 401, { "error": "insufficient_scope", "error_description": "..." }
```

### Error code reference

| `errorCode` | Meaning | Fix |
|---|---|---|
| `invalid_client` | Wrong `clientId`/`clientSecret`, or Basic Auth not being sent | Check credentials. Client credentials flow sends Basic Auth header — verify your app credentials in the SoundCloud developer portal. |
| `invalid_token` | Access token is expired or malformed | Refresh the token via `auth.refreshUserToken(refreshToken)` or obtain a new one. |
| `insufficient_scope` | The endpoint requires a user token but a client credentials token was provided | Use the authorization code flow to get a user token. |
| `unauthorized_client` | Your app is not approved for this grant type | Check your app settings in the SoundCloud developer portal. Some grant types require explicit approval. |
| `invalid_grant` | Refresh token is expired or already used | Start a new authorization flow; the user must re-authorize. |

### Checking `err.errorCode` in code

```ts
import { SoundCloudError } from 'soundcloud-api-ts';

try {
  await sc.me.getMe();
} catch (err) {
  if (err instanceof SoundCloudError) {
    console.log(err.status);      // 401
    console.log(err.errorCode);   // "insufficient_scope"
    console.log(err.isUnauthorized); // true
  }
}
```
