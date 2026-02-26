import type { SoundCloudClient } from "../client/SoundCloudClient.js";

/**
 * Contract for a pluggable token provider that manages OAuth token lifecycle.
 *
 * Implement this interface to integrate soundcloud-api-ts with your
 * framework's session management, e.g. NextAuth, Clerk, Redis, or a simple
 * in-memory store.
 *
 * @example
 * ```ts
 * class InMemoryTokenProvider implements TokenProvider {
 *   private _accessToken?: string;
 *   private _refreshToken?: string;
 *
 *   getAccessToken() { return this._accessToken; }
 *   setTokens(access: string, refresh?: string) {
 *     this._accessToken = access;
 *     this._refreshToken = refresh;
 *   }
 *   async refreshIfNeeded(client: SoundCloudClient) {
 *     if (!this._refreshToken) throw new Error('No refresh token');
 *     const token = await client.auth.refreshUserToken(this._refreshToken);
 *     this.setTokens(token.access_token, token.refresh_token);
 *     return token.access_token;
 *   }
 * }
 * ```
 *
 * @see docs/auth-guide.md
 */
export interface TokenProvider {
  /** Returns the current access token, or undefined if none is stored. */
  getAccessToken(): string | undefined | Promise<string | undefined>;
  /** Persist new tokens (called after a successful token grant or refresh). */
  setTokens(accessToken: string, refreshToken?: string): void | Promise<void>;
  /**
   * Ensure a valid access token is available, refreshing if necessary.
   * Called automatically when a request returns 401 Unauthorized.
   */
  refreshIfNeeded(client: SoundCloudClient): Promise<string> | string;
}

/**
 * Minimal synchronous key–value store for OAuth tokens.
 *
 * Useful for implementing a simple in-memory or cookie-backed token store
 * without the full async lifecycle of {@link TokenProvider}.
 *
 * @example
 * ```ts
 * class CookieTokenStore implements TokenStore {
 *   getAccessToken()  { return getCookie('sc_access_token') ?? undefined; }
 *   getRefreshToken() { return getCookie('sc_refresh_token') ?? undefined; }
 *   setTokens(a, r)   { setCookie('sc_access_token', a); if (r) setCookie('sc_refresh_token', r); }
 *   clearTokens()     { deleteCookie('sc_access_token'); deleteCookie('sc_refresh_token'); }
 * }
 * ```
 *
 * @see docs/auth-guide.md
 */
export interface TokenStore {
  /** Returns the stored access token, or undefined if none. */
  getAccessToken(): string | undefined;
  /** Returns the stored refresh token, or undefined if none. */
  getRefreshToken(): string | undefined;
  /** Persist new tokens. */
  setTokens(accessToken: string, refreshToken?: string): void;
  /** Remove all stored tokens (call on sign-out). */
  clearTokens(): void;
}
