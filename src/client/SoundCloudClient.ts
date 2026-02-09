import { scFetch, scFetchUrl, type AutoRefreshContext, type RetryConfig } from "./http.js";
import { paginate, paginateItems, fetchAll } from "./paginate.js";
import type {
  SoundCloudToken,
  SoundCloudUser,
  SoundCloudMe,
  SoundCloudTrack,
  SoundCloudPlaylist,
  SoundCloudComment,
  SoundCloudStreams,
  SoundCloudWebProfile,
  SoundCloudActivitiesResponse,
  SoundCloudPaginatedResponse,
} from "../types/api.js";
import type { UpdateTrackParams } from "../tracks/updateTrack.js";
import type { CreatePlaylistParams } from "../playlists/createPlaylist.js";
import type { UpdatePlaylistParams } from "../playlists/updatePlaylist.js";

/**
 * Configuration options for creating a {@link SoundCloudClient} instance.
 */
export interface SoundCloudClientConfig {
  /** Your SoundCloud application's OAuth client ID */
  clientId: string;
  /** Your SoundCloud application's OAuth client secret */
  clientSecret: string;
  /** OAuth redirect URI registered with your SoundCloud application (required for user auth flows) */
  redirectUri?: string;
  /**
   * Called automatically when a request returns 401 Unauthorized.
   * Return new tokens to transparently retry the failed request.
   */
  onTokenRefresh?: (client: SoundCloudClient) => Promise<SoundCloudToken>;
  /** Maximum number of retries on 429 (rate limit) and 5xx (server error) responses (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff between retries (default: 1000) */
  retryBaseDelay?: number;
  /** Optional debug logger callback for retry attempts and other internal events */
  onDebug?: (message: string) => void;
}

/**
 * Optional token override that can be passed as the last parameter to client methods.
 * When provided, the explicit token is used instead of the client's stored token.
 */
export interface TokenOption {
  /** OAuth access token to use for this specific request */
  token?: string;
}

/** Resolve a token: use explicit override, fall back to stored, or throw. */
type TokenGetter = () => string | undefined;

function resolveToken(tokenGetter: TokenGetter, explicit?: string): string {
  const t = explicit ?? tokenGetter();
  if (!t) throw new Error("No access token available. Call client.setToken() or pass a token explicitly.");
  return t;
}

/**
 * High-level SoundCloud API client with namespaced methods for all API areas.
 *
 * Provides automatic token management, retry with exponential backoff,
 * optional automatic token refresh on 401, and built-in pagination helpers.
 *
 * @example
 * ```ts
 * import { SoundCloudClient } from 'tsd-soundcloud';
 *
 * const sc = new SoundCloudClient({
 *   clientId: 'YOUR_CLIENT_ID',
 *   clientSecret: 'YOUR_CLIENT_SECRET',
 *   redirectUri: 'https://example.com/callback',
 * });
 *
 * // Authenticate
 * const token = await sc.auth.getClientToken();
 * sc.setToken(token.access_token);
 *
 * // Use the API
 * const track = await sc.tracks.getTrack(123456);
 * console.log(track.title);
 *
 * // Search with pagination
 * for await (const track of sc.paginateItems(() => sc.search.tracks('lofi'))) {
 *   console.log(track.title);
 * }
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api
 */
export class SoundCloudClient {
  private config: SoundCloudClientConfig;
  private _accessToken?: string;
  private _refreshToken?: string;

  /** Authentication methods (OAuth token grants, sign out) */
  public auth: SoundCloudClient.Auth;
  /** Authenticated user endpoints (/me) */
  public me: SoundCloudClient.Me;
  /** User profile endpoints (/users) */
  public users: SoundCloudClient.Users;
  /** Track endpoints (/tracks) */
  public tracks: SoundCloudClient.Tracks;
  /** Playlist endpoints (/playlists) */
  public playlists: SoundCloudClient.Playlists;
  /** Search endpoints */
  public search: SoundCloudClient.Search;
  /** URL resolution endpoint (/resolve) */
  public resolve: SoundCloudClient.Resolve;
  /** Like/unlike actions (/likes) */
  public likes: SoundCloudClient.Likes;
  /** Repost/unrepost actions (/reposts) */
  public reposts: SoundCloudClient.Reposts;

  /**
   * Creates a new SoundCloudClient instance.
   *
   * @param config - Client configuration including OAuth credentials and optional settings
   */
  constructor(config: SoundCloudClientConfig) {
    this.config = config;
    const getToken: TokenGetter = () => this._accessToken;
    const retryConfig: RetryConfig = {
      maxRetries: config.maxRetries ?? 3,
      retryBaseDelay: config.retryBaseDelay ?? 1000,
      onDebug: config.onDebug,
    };
    const refreshCtx: AutoRefreshContext = config.onTokenRefresh
      ? {
          getToken,
          onTokenRefresh: async () => {
            const result = await config.onTokenRefresh!(this);
            return result;
          },
          setToken: (a, r) => this.setToken(a, r),
          retry: retryConfig,
        }
      : {
          getToken,
          setToken: (a, r) => this.setToken(a, r),
          retry: retryConfig,
        };

    this.auth = new SoundCloudClient.Auth(this.config);
    this.me = new SoundCloudClient.Me(getToken, refreshCtx!);
    this.users = new SoundCloudClient.Users(getToken, refreshCtx!);
    this.tracks = new SoundCloudClient.Tracks(getToken, refreshCtx!);
    this.playlists = new SoundCloudClient.Playlists(getToken, refreshCtx!);
    this.search = new SoundCloudClient.Search(getToken, refreshCtx!);
    this.resolve = new SoundCloudClient.Resolve(getToken, refreshCtx!);
    this.likes = new SoundCloudClient.Likes(getToken, refreshCtx!);
    this.reposts = new SoundCloudClient.Reposts(getToken, refreshCtx!);
  }

  /**
   * Store an access token (and optionally refresh token) on this client instance.
   *
   * @param accessToken - The OAuth access token to store
   * @param refreshToken - Optional refresh token for automatic token renewal
   */
  setToken(accessToken: string, refreshToken?: string): void {
    this._accessToken = accessToken;
    if (refreshToken !== undefined) this._refreshToken = refreshToken;
  }

  /** Clear all stored tokens from this client instance. */
  clearToken(): void {
    this._accessToken = undefined;
    this._refreshToken = undefined;
  }

  /** Get the currently stored access token, or `undefined` if none is set. */
  get accessToken(): string | undefined {
    return this._accessToken;
  }

  /** Get the currently stored refresh token, or `undefined` if none is set. */
  get refreshToken(): string | undefined {
    return this._refreshToken;
  }

  /**
   * Async generator that follows `next_href` automatically, yielding each page's `collection`.
   *
   * @param firstPage - Function that fetches the first page
   * @returns An async generator yielding arrays of items (one per page)
   *
   * @example
   * ```ts
   * for await (const page of sc.paginate(() => sc.search.tracks('lofi'))) {
   *   console.log(page); // SoundCloudTrack[]
   * }
   * ```
   */
  paginate<T>(firstPage: () => Promise<SoundCloudPaginatedResponse<T>>): AsyncGenerator<T[], void, undefined> {
    const token = this._accessToken;
    return paginate(firstPage, (url) => scFetchUrl<SoundCloudPaginatedResponse<T>>(url, token));
  }

  /**
   * Async generator that yields individual items across all pages.
   *
   * @param firstPage - Function that fetches the first page
   * @returns An async generator yielding individual items
   *
   * @example
   * ```ts
   * for await (const track of sc.paginateItems(() => sc.search.tracks('lofi'))) {
   *   console.log(track.title); // single SoundCloudTrack
   * }
   * ```
   */
  paginateItems<T>(firstPage: () => Promise<SoundCloudPaginatedResponse<T>>): AsyncGenerator<T, void, undefined> {
    const token = this._accessToken;
    return paginateItems(firstPage, (url) => scFetchUrl<SoundCloudPaginatedResponse<T>>(url, token));
  }

  /**
   * Collects all pages into a single flat array.
   *
   * @param firstPage - Function that fetches the first page
   * @param options - Optional configuration
   * @param options.maxItems - Maximum number of items to collect
   * @returns A promise resolving to a flat array of all items
   *
   * @example
   * ```ts
   * const allTracks = await sc.fetchAll(() => sc.search.tracks('lofi'), { maxItems: 100 });
   * console.log(allTracks.length);
   * ```
   */
  fetchAll<T>(firstPage: () => Promise<SoundCloudPaginatedResponse<T>>, options?: { maxItems?: number }): Promise<T[]> {
    const token = this._accessToken;
    return fetchAll(firstPage, (url) => scFetchUrl<SoundCloudPaginatedResponse<T>>(url, token), options);
  }
}

export namespace SoundCloudClient {
  /**
   * Authentication namespace — OAuth token grants and session management.
   *
   * @example
   * ```ts
   * const token = await sc.auth.getClientToken();
   * sc.setToken(token.access_token);
   * ```
   */
  export class Auth {
    constructor(private config: SoundCloudClientConfig) {}

    /**
     * Build the authorization URL to redirect users to SoundCloud's OAuth login page.
     *
     * @param options - Optional parameters for the authorization request
     * @param options.state - Opaque state value for CSRF protection
     * @param options.codeChallenge - PKCE S256 code challenge for enhanced security
     * @returns The full authorization URL to redirect the user to
     * @throws {Error} If `redirectUri` was not provided in the client config
     *
     * @example
     * ```ts
     * const url = sc.auth.getAuthorizationUrl({ state: 'random-state' });
     * // Redirect user to `url`
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2
     */
    getAuthorizationUrl(options?: { state?: string; codeChallenge?: string }): string {
      if (!this.config.redirectUri) throw new Error("redirectUri is required for getAuthorizationUrl");
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        response_type: "code",
      });
      if (options?.state) params.set("state", options.state);
      if (options?.codeChallenge) {
        params.set("code_challenge", options.codeChallenge);
        params.set("code_challenge_method", "S256");
      }
      return `https://api.soundcloud.com/connect?${params}`;
    }

    /**
     * Exchange client credentials for an access token (machine-to-machine auth).
     *
     * @returns The OAuth token response
     * @throws {SoundCloudError} When authentication fails
     *
     * @example
     * ```ts
     * const token = await sc.auth.getClientToken();
     * sc.setToken(token.access_token);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2/post_oauth2_token
     */
    async getClientToken(): Promise<SoundCloudToken> {
      return scFetch<SoundCloudToken>({
        path: "/oauth2/token",
        method: "POST",
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });
    }

    /**
     * Exchange an authorization code for user tokens (authorization_code grant).
     *
     * @param code - The authorization code received from the OAuth callback
     * @param codeVerifier - PKCE code verifier if a code challenge was used
     * @returns The OAuth token response including access and refresh tokens
     * @throws {SoundCloudError} When the code is invalid or expired
     *
     * @example
     * ```ts
     * const token = await sc.auth.getUserToken(code, codeVerifier);
     * sc.setToken(token.access_token, token.refresh_token);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2/post_oauth2_token
     */
    async getUserToken(code: string, codeVerifier?: string): Promise<SoundCloudToken> {
      const params: Record<string, string> = {
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri!,
        code,
      };
      if (codeVerifier) params.code_verifier = codeVerifier;
      return scFetch<SoundCloudToken>({
        path: "/oauth2/token",
        method: "POST",
        body: new URLSearchParams(params),
      });
    }

    /**
     * Refresh an expired access token using a refresh token.
     *
     * @param refreshToken - The refresh token from a previous token response
     * @returns A new OAuth token response with fresh access and refresh tokens
     * @throws {SoundCloudError} When the refresh token is invalid or expired
     *
     * @example
     * ```ts
     * const newToken = await sc.auth.refreshUserToken(sc.refreshToken!);
     * sc.setToken(newToken.access_token, newToken.refresh_token);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2/post_oauth2_token
     */
    async refreshUserToken(refreshToken: string): Promise<SoundCloudToken> {
      return scFetch<SoundCloudToken>({
        path: "/oauth2/token",
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri!,
          refresh_token: refreshToken,
        }),
      });
    }

    /**
     * Invalidate the session associated with an access token.
     *
     * **Note:** This hits `https://secure.soundcloud.com`, NOT the regular
     * `api.soundcloud.com` host used by all other endpoints.
     *
     * @param accessToken - The access token to invalidate
     * @throws {Error} When the sign-out request fails
     *
     * @example
     * ```ts
     * await sc.auth.signOut(sc.accessToken!);
     * sc.clearToken();
     * ```
     */
    async signOut(accessToken: string): Promise<void> {
      const res = await fetch("https://secure.soundcloud.com/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (!res.ok) throw new Error(`Sign-out failed: ${res.status}`);
    }
  }

  /**
   * Authenticated user namespace — endpoints for the currently logged-in user (/me).
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me
   */
  export class Me {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Get the authenticated user's profile.
     *
     * @param options - Optional token override
     * @returns The authenticated user's full profile
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const me = await sc.me.getMe();
     * console.log(me.username, me.followers_count);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me
     */
    async getMe(options?: TokenOption): Promise<SoundCloudMe> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudMe>({ path: "/me", method: "GET", token: t });
    }

    /**
     * Get the authenticated user's activity feed.
     *
     * @param limit - Maximum number of activities per page
     * @param options - Optional token override
     * @returns Paginated activities response with `future_href` for polling
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const activities = await sc.me.getActivities(25);
     * activities.collection.forEach(a => console.log(a.type, a.created_at));
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities
     */
    async getActivities(limit?: number, options?: TokenOption): Promise<SoundCloudActivitiesResponse> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/activities?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get the authenticated user's own activities (uploads, reposts).
     *
     * @param limit - Maximum number of activities per page
     * @param options - Optional token override
     * @returns Paginated activities response
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities_all_own
     */
    async getActivitiesOwn(limit?: number, options?: TokenOption): Promise<SoundCloudActivitiesResponse> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/activities/all/own?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get track-related activities in the authenticated user's feed.
     *
     * @param limit - Maximum number of activities per page
     * @param options - Optional token override
     * @returns Paginated activities response filtered to track activities
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities_tracks
     */
    async getActivitiesTracks(limit?: number, options?: TokenOption): Promise<SoundCloudActivitiesResponse> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/activities/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get tracks liked by the authenticated user.
     *
     * @param limit - Maximum number of tracks per page
     * @param options - Optional token override
     * @returns Paginated list of liked tracks
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const likes = await sc.me.getLikesTracks(50);
     * likes.collection.forEach(t => console.log(t.title));
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_likes_tracks
     */
    async getLikesTracks(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/likes/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get playlists liked by the authenticated user.
     *
     * @param limit - Maximum number of playlists per page
     * @param options - Optional token override
     * @returns Paginated list of liked playlists
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_likes_playlists
     */
    async getLikesPlaylists(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get users the authenticated user is following.
     *
     * @param limit - Maximum number of users per page
     * @param options - Optional token override
     * @returns Paginated list of followed users
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_followings
     */
    async getFollowings(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get recent tracks from users the authenticated user is following.
     *
     * @param limit - Maximum number of tracks per page
     * @param options - Optional token override
     * @returns Paginated list of tracks from followed users
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_followings_tracks
     */
    async getFollowingsTracks(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/followings/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Follow a user.
     *
     * @param userUrn - The user's ID or URN to follow
     * @param options - Optional token override
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * await sc.me.follow(123456);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/put_me_followings__user_id_
     */
    async follow(userUrn: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/me/followings/${userUrn}`, method: "PUT", token: t });
    }

    /**
     * Unfollow a user.
     *
     * @param userUrn - The user's ID or URN to unfollow
     * @param options - Optional token override
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * await sc.me.unfollow(123456);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/delete_me_followings__user_id_
     */
    async unfollow(userUrn: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/me/followings/${userUrn}`, method: "DELETE", token: t });
    }

    /**
     * Get the authenticated user's followers.
     *
     * @param limit - Maximum number of users per page
     * @param options - Optional token override
     * @returns Paginated list of follower users
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_followers
     */
    async getFollowers(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get the authenticated user's playlists.
     *
     * @param limit - Maximum number of playlists per page
     * @param options - Optional token override
     * @returns Paginated list of playlists
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_playlists
     */
    async getPlaylists(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get the authenticated user's tracks.
     *
     * @param limit - Maximum number of tracks per page
     * @param options - Optional token override
     * @returns Paginated list of tracks
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_tracks
     */
    async getTracks(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }
  }

  /**
   * User profile namespace — fetch public user data.
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users
   */
  export class Users {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Get a user's profile by ID.
     *
     * @param userId - The user's numeric ID or URN
     * @param options - Optional token override
     * @returns The user's public profile
     * @throws {SoundCloudError} When the user is not found or the API returns an error
     *
     * @example
     * ```ts
     * const user = await sc.users.getUser(123456);
     * console.log(user.username, user.followers_count);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id_
     */
    async getUser(userId: string | number, options?: TokenOption): Promise<SoundCloudUser> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudUser>({ path: `/users/${userId}`, method: "GET", token: t });
    }

    /**
     * Get a user's followers.
     *
     * @param userId - The user's numeric ID or URN
     * @param limit - Maximum number of followers per page
     * @param options - Optional token override
     * @returns Paginated list of follower users
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__followers
     */
    async getFollowers(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get users that a user is following.
     *
     * @param userId - The user's numeric ID or URN
     * @param limit - Maximum number of users per page
     * @param options - Optional token override
     * @returns Paginated list of followed users
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__followings
     */
    async getFollowings(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get a user's public tracks.
     *
     * @param userId - The user's numeric ID or URN
     * @param limit - Maximum number of tracks per page
     * @param options - Optional token override
     * @returns Paginated list of tracks
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__tracks
     */
    async getTracks(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get a user's public playlists.
     *
     * @param userId - The user's numeric ID or URN
     * @param limit - Maximum number of playlists per page
     * @param options - Optional token override
     * @returns Paginated list of playlists (without full track data)
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__playlists
     */
    async getPlaylists(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true&show_tracks=false`, method: "GET", token: t });
    }

    /**
     * Get tracks liked by a user.
     *
     * @param userId - The user's numeric ID or URN
     * @param limit - Maximum number of tracks per page
     * @param cursor - Pagination cursor from a previous response's `next_href`
     * @param options - Optional token override
     * @returns Paginated list of liked tracks
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__likes_tracks
     */
    async getLikesTracks(userId: string | number, limit?: number, cursor?: string, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/likes/tracks?${limit ? `limit=${limit}&` : ""}${cursor ? `cursor=${cursor}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get playlists liked by a user.
     *
     * @param userId - The user's numeric ID or URN
     * @param limit - Maximum number of playlists per page
     * @param options - Optional token override
     * @returns Paginated list of liked playlists
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__likes_playlists
     */
    async getLikesPlaylists(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get a user's external web profile links (Twitter, Instagram, etc.).
     *
     * @param userId - The user's numeric ID or URN
     * @param options - Optional token override
     * @returns Array of web profile objects
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const profiles = await sc.users.getWebProfiles(123456);
     * profiles.forEach(p => console.log(p.service, p.url));
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__web_profiles
     */
    async getWebProfiles(userId: string | number, options?: TokenOption): Promise<SoundCloudWebProfile[]> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudWebProfile[]>({ path: `/users/${userId}/web-profiles`, method: "GET", token: t });
    }
  }

  /**
   * Track namespace — fetch, update, delete tracks and their metadata.
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks
   */
  export class Tracks {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Get a track by ID.
     *
     * @param trackId - The track's numeric ID or URN
     * @param options - Optional token override
     * @returns The track object with full metadata
     * @throws {SoundCloudError} When the track is not found or the API returns an error
     *
     * @example
     * ```ts
     * const track = await sc.tracks.getTrack(123456);
     * console.log(track.title, track.duration);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id_
     */
    async getTrack(trackId: string | number, options?: TokenOption): Promise<SoundCloudTrack> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "GET", token: t });
    }

    /**
     * Get stream URLs for a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param options - Optional token override
     * @returns Object containing available stream URLs (HLS, MP3, preview)
     * @throws {SoundCloudError} When the track is not found or not streamable
     *
     * @example
     * ```ts
     * const streams = await sc.tracks.getStreams(123456);
     * console.log(streams.hls_mp3_128_url);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__streams
     */
    async getStreams(trackId: string | number, options?: TokenOption): Promise<SoundCloudStreams> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudStreams>({ path: `/tracks/${trackId}/streams`, method: "GET", token: t });
    }

    /**
     * Get comments on a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param limit - Maximum number of comments per page
     * @param options - Optional token override
     * @returns Paginated list of comments
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__comments
     */
    async getComments(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudComment>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks/${trackId}/comments?threaded=1&filter_replies=0${limit ? `&limit=${limit}` : ""}&linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Post a comment on a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param body - The comment text
     * @param timestamp - Position in the track in milliseconds where the comment is placed
     * @param options - Optional token override
     * @returns The created comment object
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const comment = await sc.tracks.createComment(123456, 'Great track!', 30000);
     * console.log(comment.id);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/post_tracks__track_id__comments
     */
    async createComment(trackId: string | number, body: string, timestamp?: number, options?: TokenOption): Promise<SoundCloudComment> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudComment>({
        path: `/tracks/${trackId}/comments`,
        method: "POST",
        token: t,
        body: { comment: { body, ...(timestamp !== undefined ? { timestamp } : {}) } },
      });
    }

    /**
     * Get users who have liked (favorited) a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param limit - Maximum number of users per page
     * @param options - Optional token override
     * @returns Paginated list of users who liked the track
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__favoriters
     */
    async getLikes(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks/${trackId}/favoriters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get users who have reposted a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param limit - Maximum number of users per page
     * @param options - Optional token override
     * @returns Paginated list of users who reposted the track
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__reposters
     */
    async getReposts(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks/${trackId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Get tracks related to a given track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param limit - Maximum number of related tracks to return
     * @param options - Optional token override
     * @returns Array of related tracks
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const related = await sc.tracks.getRelated(123456, 5);
     * related.forEach(t => console.log(t.title));
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__related
     */
    async getRelated(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudTrack[]> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudTrack[]>({ path: `/tracks/${trackId}/related${limit ? `?limit=${limit}` : ""}`, method: "GET", token: t });
    }

    /**
     * Update a track's metadata.
     *
     * @param trackId - The track's numeric ID or URN
     * @param params - Fields to update (title, description, genre, etc.)
     * @param options - Optional token override
     * @returns The updated track object
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const updated = await sc.tracks.update(123456, { title: 'New Title', genre: 'Electronic' });
     * console.log(updated.title);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/put_tracks__track_id_
     */
    async update(trackId: string | number, params: UpdateTrackParams, options?: TokenOption): Promise<SoundCloudTrack> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "PUT", token: t, body: { track: params } });
    }

    /**
     * Delete a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param options - Optional token override
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * await sc.tracks.delete(123456);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/delete_tracks__track_id_
     */
    async delete(trackId: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/tracks/${trackId}`, method: "DELETE", token: t });
    }
  }

  /**
   * Playlist namespace — fetch, create, update, and delete playlists.
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists
   */
  export class Playlists {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Get a playlist by ID.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param options - Optional token override
     * @returns The playlist object with track data
     * @throws {SoundCloudError} When the playlist is not found or the API returns an error
     *
     * @example
     * ```ts
     * const playlist = await sc.playlists.getPlaylist(123456);
     * console.log(playlist.title, playlist.track_count);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists__playlist_id_
     */
    async getPlaylist(playlistId: string | number, options?: TokenOption): Promise<SoundCloudPlaylist> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "GET", token: t });
    }

    /**
     * Get tracks in a playlist.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param limit - Maximum number of tracks per page
     * @param offset - Number of tracks to skip (for offset-based pagination)
     * @param options - Optional token override
     * @returns Paginated list of tracks
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists__playlist_id__tracks
     */
    async getTracks(playlistId: string | number, limit?: number, offset?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/playlists/${playlistId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true${offset ? `&offset=${offset}` : ""}`, method: "GET", token: t });
    }

    /**
     * Get users who have reposted a playlist.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param limit - Maximum number of users per page
     * @param options - Optional token override
     * @returns Paginated list of users who reposted the playlist
     * @throws {SoundCloudError} When the API returns an error
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists__playlist_id__reposters
     */
    async getReposts(playlistId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/playlists/${playlistId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /**
     * Create a new playlist.
     *
     * @param params - Playlist creation parameters (title is required)
     * @param options - Optional token override
     * @returns The created playlist object
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const playlist = await sc.playlists.create({
     *   title: 'My Favorites',
     *   sharing: 'public',
     *   tracks: [{ urn: 'soundcloud:tracks:123' }],
     * });
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/post_playlists
     */
    async create(params: CreatePlaylistParams, options?: TokenOption): Promise<SoundCloudPlaylist> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudPlaylist>({ path: "/playlists", method: "POST", token: t, body: { playlist: params } });
    }

    /**
     * Update a playlist's metadata or track list.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param params - Fields to update
     * @param options - Optional token override
     * @returns The updated playlist object
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const updated = await sc.playlists.update(123456, { title: 'Updated Title' });
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/put_playlists__playlist_id_
     */
    async update(playlistId: string | number, params: UpdatePlaylistParams, options?: TokenOption): Promise<SoundCloudPlaylist> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "PUT", token: t, body: { playlist: params } });
    }

    /**
     * Delete a playlist.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param options - Optional token override
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * await sc.playlists.delete(123456);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/delete_playlists__playlist_id_
     */
    async delete(playlistId: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/playlists/${playlistId}`, method: "DELETE", token: t });
    }
  }

  /**
   * Search namespace — search for tracks, users, and playlists.
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/search
   */
  export class Search {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Search for tracks by query string.
     *
     * @param query - Search query text
     * @param pageNumber - Zero-based page number (10 results per page)
     * @param options - Optional token override
     * @returns Paginated list of matching tracks
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const results = await sc.search.tracks('lofi hip hop');
     * results.collection.forEach(t => console.log(t.title));
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks
     */
    async tracks(query: string, pageNumber?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: t });
    }

    /**
     * Search for users by query string.
     *
     * @param query - Search query text
     * @param pageNumber - Zero-based page number (10 results per page)
     * @param options - Optional token override
     * @returns Paginated list of matching users
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const results = await sc.search.users('deadmau5');
     * results.collection.forEach(u => console.log(u.username));
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users
     */
    async users(query: string, pageNumber?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: t });
    }

    /**
     * Search for playlists by query string.
     *
     * @param query - Search query text
     * @param pageNumber - Zero-based page number (10 results per page)
     * @param options - Optional token override
     * @returns Paginated list of matching playlists
     * @throws {SoundCloudError} When the API returns an error
     *
     * @example
     * ```ts
     * const results = await sc.search.playlists('chill vibes');
     * results.collection.forEach(p => console.log(p.title));
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists
     */
    async playlists(query: string, pageNumber?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/playlists?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: t });
    }
  }

  /**
   * Resolve namespace — resolve SoundCloud URLs to API resources.
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/resolve
   */
  export class Resolve {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Resolve a SoundCloud URL to its API resource URL.
     *
     * @param url - A SoundCloud URL (e.g. "https://soundcloud.com/artist/track-name")
     * @param options - Optional token override
     * @returns The resolved API resource URL (via 302 redirect)
     * @throws {SoundCloudError} When the URL cannot be resolved
     *
     * @example
     * ```ts
     * const apiUrl = await sc.resolve.resolveUrl('https://soundcloud.com/deadmau5/strobe');
     * console.log(apiUrl); // "https://api.soundcloud.com/tracks/..."
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/resolve/get_resolve
     */
    async resolveUrl(url: string, options?: TokenOption): Promise<string> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<string>({ path: `/resolve?url=${encodeURIComponent(url)}`, method: "GET", token: t });
    }
  }

  /**
   * Likes namespace — like and unlike tracks and playlists.
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes
   */
  export class Likes {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Like a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the like was successful, `false` on failure
     *
     * @example
     * ```ts
     * const success = await sc.likes.likeTrack(123456);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/post_likes_tracks__track_id_
     */
    async likeTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /**
     * Unlike a track.
     *
     * @param trackId - The track's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the unlike was successful, `false` on failure
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/delete_likes_tracks__track_id_
     */
    async unlikeTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }

    /**
     * Like a playlist.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the like was successful, `false` on failure
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/post_likes_playlists__playlist_id_
     */
    async likePlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /**
     * Unlike a playlist.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the unlike was successful, `false` on failure
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/delete_likes_playlists__playlist_id_
     */
    async unlikePlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }
  }

  /**
   * Reposts namespace — repost and unrepost tracks and playlists.
   *
   * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts
   */
  export class Reposts {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /**
     * Repost a track to your profile.
     *
     * @param trackId - The track's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the repost was successful, `false` on failure
     *
     * @example
     * ```ts
     * const success = await sc.reposts.repostTrack(123456);
     * ```
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/post_reposts_tracks__track_id_
     */
    async repostTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /**
     * Remove a track repost from your profile.
     *
     * @param trackId - The track's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the unrepost was successful, `false` on failure
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/delete_reposts_tracks__track_id_
     */
    async unrepostTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }

    /**
     * Repost a playlist to your profile.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the repost was successful, `false` on failure
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/post_reposts_playlists__playlist_id_
     */
    async repostPlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /**
     * Remove a playlist repost from your profile.
     *
     * @param playlistId - The playlist's numeric ID or URN
     * @param options - Optional token override
     * @returns `true` if the unrepost was successful, `false` on failure
     *
     * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/delete_reposts_playlists__playlist_id_
     */
    async unrepostPlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }
  }
}
