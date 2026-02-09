import { scFetch, scFetchUrl, type AutoRefreshContext } from "./http.js";
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

export interface SoundCloudClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  /** Called automatically when a request returns 401. Return new tokens to retry. */
  onTokenRefresh?: (client: SoundCloudClient) => Promise<SoundCloudToken>;
}

/** Optional token override, passed as the last parameter to client methods. */
export interface TokenOption {
  token?: string;
}

/** Resolve a token: use explicit override, fall back to stored, or throw. */
type TokenGetter = () => string | undefined;

function resolveToken(tokenGetter: TokenGetter, explicit?: string): string {
  const t = explicit ?? tokenGetter();
  if (!t) throw new Error("No access token available. Call client.setToken() or pass a token explicitly.");
  return t;
}

export class SoundCloudClient {
  private config: SoundCloudClientConfig;
  private _accessToken?: string;
  private _refreshToken?: string;

  public auth: SoundCloudClient.Auth;
  public me: SoundCloudClient.Me;
  public users: SoundCloudClient.Users;
  public tracks: SoundCloudClient.Tracks;
  public playlists: SoundCloudClient.Playlists;
  public search: SoundCloudClient.Search;
  public resolve: SoundCloudClient.Resolve;
  public likes: SoundCloudClient.Likes;
  public reposts: SoundCloudClient.Reposts;

  constructor(config: SoundCloudClientConfig) {
    this.config = config;
    const getToken: TokenGetter = () => this._accessToken;
    const refreshCtx: AutoRefreshContext | undefined = config.onTokenRefresh
      ? {
          getToken,
          onTokenRefresh: async () => {
            const result = await config.onTokenRefresh!(this);
            return result;
          },
          setToken: (a, r) => this.setToken(a, r),
        }
      : undefined;

    this.auth = new SoundCloudClient.Auth(this.config);
    this.me = new SoundCloudClient.Me(getToken, refreshCtx);
    this.users = new SoundCloudClient.Users(getToken, refreshCtx);
    this.tracks = new SoundCloudClient.Tracks(getToken, refreshCtx);
    this.playlists = new SoundCloudClient.Playlists(getToken, refreshCtx);
    this.search = new SoundCloudClient.Search(getToken, refreshCtx);
    this.resolve = new SoundCloudClient.Resolve(getToken, refreshCtx);
    this.likes = new SoundCloudClient.Likes(getToken, refreshCtx);
    this.reposts = new SoundCloudClient.Reposts(getToken, refreshCtx);
  }

  /** Store an access token (and optionally refresh token) on this client instance. */
  setToken(accessToken: string, refreshToken?: string): void {
    this._accessToken = accessToken;
    if (refreshToken !== undefined) this._refreshToken = refreshToken;
  }

  /** Clear stored tokens. */
  clearToken(): void {
    this._accessToken = undefined;
    this._refreshToken = undefined;
  }

  /** Get the currently stored access token, if any. */
  get accessToken(): string | undefined {
    return this._accessToken;
  }

  /** Get the currently stored refresh token, if any. */
  get refreshToken(): string | undefined {
    return this._refreshToken;
  }

  /**
   * Async generator that follows `next_href` automatically, yielding each page's `collection`.
   *
   * ```ts
   * for await (const page of sc.paginate(() => sc.search.tracks("lofi"))) {
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
   * ```ts
   * for await (const track of sc.paginateItems(() => sc.search.tracks("lofi"))) {
   *   console.log(track); // single SoundCloudTrack
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
   * ```ts
   * const allTracks = await sc.fetchAll(() => sc.search.tracks("lofi"), { maxItems: 100 });
   * ```
   */
  fetchAll<T>(firstPage: () => Promise<SoundCloudPaginatedResponse<T>>, options?: { maxItems?: number }): Promise<T[]> {
    const token = this._accessToken;
    return fetchAll(firstPage, (url) => scFetchUrl<SoundCloudPaginatedResponse<T>>(url, token), options);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SoundCloudClient {
  export class Auth {
    constructor(private config: SoundCloudClientConfig) {}

    /** Build the authorization URL to redirect users to SoundCloud's login. */
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

    /** POST /oauth2/token — client_credentials grant */
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

    /** POST /oauth2/token — authorization_code grant */
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

    /** POST /oauth2/token — refresh_token grant */
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
     * POST /sign-out — invalidates session.
     *
     * **Note:** This hits `https://secure.soundcloud.com`, NOT the regular
     * `api.soundcloud.com` host used by all other endpoints.
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

  export class Me {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /me */
    async getMe(options?: TokenOption): Promise<SoundCloudMe> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudMe>({ path: "/me", method: "GET", token: t });
    }

    /** GET /me/activities */
    async getActivities(limit?: number, options?: TokenOption): Promise<SoundCloudActivitiesResponse> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/activities?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/activities/all/own */
    async getActivitiesOwn(limit?: number, options?: TokenOption): Promise<SoundCloudActivitiesResponse> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/activities/all/own?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/activities/tracks */
    async getActivitiesTracks(limit?: number, options?: TokenOption): Promise<SoundCloudActivitiesResponse> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/activities/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/likes/tracks */
    async getLikesTracks(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/likes/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/likes/playlists */
    async getLikesPlaylists(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/followings */
    async getFollowings(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/followings/tracks */
    async getFollowingsTracks(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/followings/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** PUT /me/followings/:user_urn — follow a user */
    async follow(userUrn: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/me/followings/${userUrn}`, method: "PUT", token: t });
    }

    /** DELETE /me/followings/:user_urn — unfollow a user */
    async unfollow(userUrn: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/me/followings/${userUrn}`, method: "DELETE", token: t });
    }

    /** GET /me/followers */
    async getFollowers(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/playlists */
    async getPlaylists(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /me/tracks */
    async getTracks(limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/me/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }
  }

  export class Users {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /users/:id */
    async getUser(userId: string | number, options?: TokenOption): Promise<SoundCloudUser> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudUser>({ path: `/users/${userId}`, method: "GET", token: t });
    }

    /** GET /users/:id/followers */
    async getFollowers(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /users/:id/followings */
    async getFollowings(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /users/:id/tracks */
    async getTracks(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /users/:id/playlists */
    async getPlaylists(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true&show_tracks=false`, method: "GET", token: t });
    }

    /** GET /users/:id/likes/tracks */
    async getLikesTracks(userId: string | number, limit?: number, cursor?: string, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/likes/tracks?${limit ? `limit=${limit}&` : ""}${cursor ? `cursor=${cursor}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /users/:id/likes/playlists */
    async getLikesPlaylists(userId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users/${userId}/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /users/:id/web-profiles */
    async getWebProfiles(userId: string | number, options?: TokenOption): Promise<SoundCloudWebProfile[]> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudWebProfile[]>({ path: `/users/${userId}/web-profiles`, method: "GET", token: t });
    }
  }

  export class Tracks {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /tracks/:id */
    async getTrack(trackId: string | number, options?: TokenOption): Promise<SoundCloudTrack> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "GET", token: t });
    }

    /** GET /tracks/:id/streams */
    async getStreams(trackId: string | number, options?: TokenOption): Promise<SoundCloudStreams> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudStreams>({ path: `/tracks/${trackId}/streams`, method: "GET", token: t });
    }

    /** GET /tracks/:id/comments */
    async getComments(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudComment>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks/${trackId}/comments?threaded=1&filter_replies=0${limit ? `&limit=${limit}` : ""}&linked_partitioning=true`, method: "GET", token: t });
    }

    /** POST /tracks/:id/comments */
    async createComment(trackId: string | number, body: string, timestamp?: number, options?: TokenOption): Promise<SoundCloudComment> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudComment>({
        path: `/tracks/${trackId}/comments`,
        method: "POST",
        token: t,
        body: { comment: { body, ...(timestamp !== undefined ? { timestamp } : {}) } },
      });
    }

    /** GET /tracks/:id/favoriters */
    async getLikes(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks/${trackId}/favoriters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /tracks/:id/reposters */
    async getReposts(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks/${trackId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** GET /tracks/:id/related */
    async getRelated(trackId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudTrack[]> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudTrack[]>({ path: `/tracks/${trackId}/related${limit ? `?limit=${limit}` : ""}`, method: "GET", token: t });
    }

    /** PUT /tracks/:id — update track metadata */
    async update(trackId: string | number, params: UpdateTrackParams, options?: TokenOption): Promise<SoundCloudTrack> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "PUT", token: t, body: { track: params } });
    }

    /** DELETE /tracks/:id */
    async delete(trackId: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/tracks/${trackId}`, method: "DELETE", token: t });
    }
  }

  export class Playlists {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /playlists/:id */
    async getPlaylist(playlistId: string | number, options?: TokenOption): Promise<SoundCloudPlaylist> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "GET", token: t });
    }

    /** GET /playlists/:id/tracks */
    async getTracks(playlistId: string | number, limit?: number, offset?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/playlists/${playlistId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true${offset ? `&offset=${offset}` : ""}`, method: "GET", token: t });
    }

    /** GET /playlists/:id/reposters */
    async getReposts(playlistId: string | number, limit?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/playlists/${playlistId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: t });
    }

    /** POST /playlists — create a playlist */
    async create(params: CreatePlaylistParams, options?: TokenOption): Promise<SoundCloudPlaylist> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudPlaylist>({ path: "/playlists", method: "POST", token: t, body: { playlist: params } });
    }

    /** PUT /playlists/:id — update a playlist */
    async update(playlistId: string | number, params: UpdatePlaylistParams, options?: TokenOption): Promise<SoundCloudPlaylist> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "PUT", token: t, body: { playlist: params } });
    }

    /** DELETE /playlists/:id */
    async delete(playlistId: string | number, options?: TokenOption): Promise<void> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<void>({ path: `/playlists/${playlistId}`, method: "DELETE", token: t });
    }
  }

  export class Search {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /tracks?q= */
    async tracks(query: string, pageNumber?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/tracks?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: t });
    }

    /** GET /users?q= */
    async users(query: string, pageNumber?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/users?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: t });
    }

    /** GET /playlists?q= */
    async playlists(query: string, pageNumber?: number, options?: TokenOption): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch({ path: `/playlists?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: t });
    }
  }

  export class Resolve {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /resolve?url= */
    async resolveUrl(url: string, options?: TokenOption): Promise<string> {
      const t = resolveToken(this.getToken, options?.token);
      return this.fetch<string>({ path: `/resolve?url=${encodeURIComponent(url)}`, method: "GET", token: t });
    }
  }

  export class Likes {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** POST /likes/tracks/:id */
    async likeTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /** DELETE /likes/tracks/:id */
    async unlikeTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }

    /** POST /likes/playlists/:id */
    async likePlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /** DELETE /likes/playlists/:id */
    async unlikePlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }
  }

  export class Reposts {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** POST /reposts/tracks/:id */
    async repostTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /** DELETE /reposts/tracks/:id */
    async unrepostTrack(trackId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }

    /** POST /reposts/playlists/:id */
    async repostPlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "POST", token: t }); return true; } catch { return false; }
    }

    /** DELETE /reposts/playlists/:id */
    async unrepostPlaylist(playlistId: string | number, options?: TokenOption): Promise<boolean> {
      const t = resolveToken(this.getToken, options?.token);
      try { await this.fetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "DELETE", token: t }); return true; } catch { return false; }
    }
  }
}
