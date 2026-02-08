# Authentication Flow — Review & Guide

## Current Architecture

The package supports three OAuth 2.0 grant types plus sign-out:

| Method | Grant Type | Use Case |
|--------|-----------|----------|
| `client.auth.getClientToken()` | `client_credentials` | App-level access (no user context) |
| `client.auth.getUserToken(code)` | `authorization_code` | Exchange auth code after user login |
| `client.auth.refreshUserToken(refreshToken)` | `refresh_token` | Refresh expired user tokens |
| `client.auth.signOut(accessToken)` | n/a | Invalidate session |

---

## Issues Found

### 🔴 1. OAuth params sent as query strings on POST requests

**Problem:** All token endpoints (`/oauth2/token`) send credentials as URL query parameters:
```
POST /oauth2/token?client_id=xxx&client_secret=xxx&grant_type=client_credentials
```

This is **incorrect per the OAuth 2.0 spec** (RFC 6749 §4.4.2). Token requests should send params as `application/x-www-form-urlencoded` in the **request body**. Query params expose secrets in server logs, CDN caches, and browser history.

**Fix:** Send as form-encoded body:
```ts
const body = new URLSearchParams({
  grant_type: "client_credentials",
  client_id: this.config.clientId,
  client_secret: this.config.clientSecret,
});
return scFetch<SoundCloudToken>({
  path: "/oauth2/token",
  method: "POST",
  body, // URLSearchParams, Content-Type auto-set
});
```

### 🔴 2. No authorization URL builder

**Problem:** There's no way to generate the URL that redirects users to SoundCloud's login page. This is step 1 of the OAuth flow and every consumer will need it.

**Fix:** Add `getAuthorizationUrl()`:
```ts
getAuthorizationUrl(options?: { state?: string; codeChallenge?: string }): string {
  const params = new URLSearchParams({
    client_id: this.config.clientId,
    redirect_uri: this.config.redirectUri!,
    response_type: "code",
  });
  if (options?.state) params.set("state", options.state);
  if (options?.codeChallenge) {
    params.set("code_challenge", options.codeChallenge);
    params.set("code_challenge_method", "S256");
  }
  return `https://api.soundcloud.com/connect?${params}`;
}
```

### 🟡 3. Token passed as first arg to every single method

**Problem:** Every API method requires `token` as the first parameter:
```ts
const me = await client.me.getMe(token);
const tracks = await client.search.tracks(token, "electronic");
const user = await client.users.getUser(token, 12345);
```

This is repetitive and error-prone. If a consumer has an authenticated session, they shouldn't have to thread the token through every call.

**Fix:** Store the token on the client instance and use it automatically:
```ts
const client = new SoundCloudClient({
  clientId: "...",
  clientSecret: "...",
  redirectUri: "...",
});

// Authenticate once
const token = await client.auth.getUserToken(code);
client.setToken(token.access_token);

// All subsequent calls use the stored token
const me = await client.me.getMe();
const tracks = await client.search.tracks("electronic");
```

Methods should still accept an optional token override for cases where you need to act on behalf of different users.

### 🟡 4. No automatic token refresh

**Problem:** When `access_token` expires, every call will fail with a 401. The consumer has to detect this and manually refresh.

**Fix:** Add optional `onTokenExpired` callback or auto-refresh:
```ts
const client = new SoundCloudClient({
  clientId: "...",
  clientSecret: "...",
  redirectUri: "...",
  onTokenRefresh: async (oldToken) => {
    const newToken = await client.auth.refreshUserToken(oldToken.refresh_token);
    // Persist newToken to your DB
    return newToken;
  },
});
```

The `scFetch` layer would intercept 401 responses, call the refresh handler, retry the request with the new token, and update the stored token — all transparently.

### 🟡 5. Incomplete PKCE support

**Problem:** `getUserToken` accepts an optional `codeVerifier`, but there are no helpers to generate the PKCE `code_verifier` / `code_challenge` pair. PKCE is required for public clients (SPAs, mobile apps).

**Fix:** Add PKCE utilities:
```ts
import { randomBytes, createHash } from "crypto";

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
```

### 🟢 6. `signOut` bypasses `scFetch`

**Minor:** `signOut` uses raw `fetch` to `https://secure.soundcloud.com/sign-out` instead of going through `scFetch`. This is fine since it's a different host, but should be documented clearly.

---

## Recommended Auth Flow (After Fixes)

### For Server Apps (confidential client)

```
┌──────────┐          ┌──────────┐         ┌─────────────┐
│  Browser  │          │ Your App │         │  SoundCloud  │
└────┬─────┘          └────┬─────┘         └──────┬──────┘
     │  1. Click "Login"   │                       │
     │────────────────────>│                       │
     │                     │                       │
     │  2. Redirect to SC  │                       │
     │<────────────────────│                       │
     │     getAuthorizationUrl()                   │
     │                     │                       │
     │  3. User logs in & authorizes               │
     │─────────────────────────────────────────── >│
     │                     │                       │
     │  4. Redirect back with ?code=xxx            │
     │<────────────────────────────────────────────│
     │────────────────────>│                       │
     │                     │                       │
     │                     │  5. Exchange code      │
     │                     │  getUserToken(code)    │
     │                     │──────────────────────>│
     │                     │                       │
     │                     │  6. SoundCloudToken    │
     │                     │<──────────────────────│
     │                     │                       │
     │                     │  7. client.setToken()  │
     │                     │  Store refresh_token   │
     │                     │                       │
     │  8. Authenticated!  │                       │
     │<────────────────────│                       │
     │                     │                       │
     │     ... later, token expires ...            │
     │                     │                       │
     │                     │  9. Auto-refresh       │
     │                     │  (handled by client)   │
     │                     │──────────────────────>│
     │                     │<──────────────────────│
```

### For Client-Only / App-Level Access

```ts
const client = new SoundCloudClient({
  clientId: process.env.SC_CLIENT_ID,
  clientSecret: process.env.SC_CLIENT_SECRET,
});

// Get app-level token (no user context)
const token = await client.auth.getClientToken();
client.setToken(token.access_token);

// Now make API calls
const results = await client.search.tracks("lofi beats");
```

### Quick Reference: Token Lifecycle

| Event | Action |
|-------|--------|
| App starts | `getClientToken()` → `setToken()` |
| User clicks login | `getAuthorizationUrl()` → redirect |
| Callback received | `getUserToken(code)` → `setToken()` → persist `refresh_token` |
| Token expires | `refreshUserToken(refreshToken)` → `setToken()` → persist new tokens |
| User logs out | `signOut(accessToken)` → clear stored tokens |

---

## Summary of Required Changes

| Priority | Change | Effort |
|----------|--------|--------|
| 🔴 High | Move OAuth params to request body (form-encoded) | Small |
| 🔴 High | Add `getAuthorizationUrl()` | Small |
| 🟡 Medium | Store token on client, make it optional per-method | Medium |
| 🟡 Medium | Add `onTokenRefresh` auto-refresh in `scFetch` | Medium |
| 🟡 Medium | Add PKCE helper utilities | Small |
| 🟢 Low | Document `signOut` using different host | Trivial |
