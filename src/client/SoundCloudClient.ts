import { scFetch, type AutoRefreshContext } from "./http.js";
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
    async getMe(token?: string): Promise<SoundCloudMe> {
      return this.fetch<SoundCloudMe>({ path: "/me", method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/activities */
    async getActivities(token?: string, limit?: number): Promise<SoundCloudActivitiesResponse> {
      return this.fetch({ path: `/me/activities?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/activities/all/own */
    async getActivitiesOwn(token?: string, limit?: number): Promise<SoundCloudActivitiesResponse> {
      return this.fetch({ path: `/me/activities/all/own?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/activities/tracks */
    async getActivitiesTracks(token?: string, limit?: number): Promise<SoundCloudActivitiesResponse> {
      return this.fetch({ path: `/me/activities/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/likes/tracks */
    async getLikesTracks(token?: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return this.fetch({ path: `/me/likes/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/likes/playlists */
    async getLikesPlaylists(token?: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return this.fetch({ path: `/me/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/followings */
    async getFollowings(token?: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return this.fetch({ path: `/me/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/followings/tracks */
    async getFollowingsTracks(token?: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return this.fetch({ path: `/me/followings/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** PUT /me/followings/:user_urn — follow a user */
    async follow(token: string | undefined, userUrn: string | number): Promise<void>;
    async follow(userUrn: string | number): Promise<void>;
    async follow(tokenOrUrn: string | number | undefined, maybeUrn?: string | number): Promise<void> {
      const [token, userUrn] = maybeUrn !== undefined
        ? [typeof tokenOrUrn === 'string' ? tokenOrUrn : undefined, maybeUrn]
        : [undefined, tokenOrUrn!];
      return this.fetch<void>({ path: `/me/followings/${userUrn}`, method: "PUT", token: resolveToken(this.getToken, token as string | undefined) });
    }

    /** DELETE /me/followings/:user_urn — unfollow a user */
    async unfollow(token: string | undefined, userUrn: string | number): Promise<void>;
    async unfollow(userUrn: string | number): Promise<void>;
    async unfollow(tokenOrUrn: string | number | undefined, maybeUrn?: string | number): Promise<void> {
      const [token, userUrn] = maybeUrn !== undefined
        ? [typeof tokenOrUrn === 'string' ? tokenOrUrn : undefined, maybeUrn]
        : [undefined, tokenOrUrn!];
      return this.fetch<void>({ path: `/me/followings/${userUrn}`, method: "DELETE", token: resolveToken(this.getToken, token as string | undefined) });
    }

    /** GET /me/followers */
    async getFollowers(token?: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return this.fetch({ path: `/me/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/playlists */
    async getPlaylists(token?: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return this.fetch({ path: `/me/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /me/tracks */
    async getTracks(token?: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return this.fetch({ path: `/me/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token) });
    }
  }

  export class Users {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /users/:id */
    async getUser(userId: string | number, token?: string): Promise<SoundCloudUser>;
    async getUser(token: string, userId: string | number): Promise<SoundCloudUser>;
    async getUser(a: string | number, b?: string | number): Promise<SoundCloudUser> {
      const [token, userId] = typeof b === 'number' || (typeof b === 'string' && b !== undefined)
        ? [a as string, b] : [undefined, a];
      return this.fetch<SoundCloudUser>({ path: `/users/${userId}`, method: "GET", token: resolveToken(this.getToken, token as string | undefined) });
    }

    /** GET /users/:id/followers */
    async getFollowers(token: string | undefined, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return this.fetch({ path: `/users/${userId}/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /users/:id/followings */
    async getFollowings(token: string | undefined, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return this.fetch({ path: `/users/${userId}/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /users/:id/tracks */
    async getTracks(token: string | undefined, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return this.fetch({ path: `/users/${userId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /users/:id/playlists */
    async getPlaylists(token: string | undefined, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return this.fetch({ path: `/users/${userId}/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true&show_tracks=false`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /users/:id/likes/tracks */
    async getLikesTracks(token: string | undefined, userId: string | number, limit?: number, cursor?: string): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return this.fetch({ path: `/users/${userId}/likes/tracks?${limit ? `limit=${limit}&` : ""}${cursor ? `cursor=${cursor}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /users/:id/likes/playlists */
    async getLikesPlaylists(token: string | undefined, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return this.fetch({ path: `/users/${userId}/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /users/:id/web-profiles */
    async getWebProfiles(token: string | undefined, userId: string | number): Promise<SoundCloudWebProfile[]> {
      return this.fetch<SoundCloudWebProfile[]>({ path: `/users/${userId}/web-profiles`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }
  }

  export class Tracks {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /tracks/:id */
    async getTrack(token: string | undefined, trackId: string | number): Promise<SoundCloudTrack> {
      return this.fetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /tracks/:id/streams */
    async getStreams(token: string | undefined, trackId: string | number): Promise<SoundCloudStreams> {
      return this.fetch<SoundCloudStreams>({ path: `/tracks/${trackId}/streams`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /tracks/:id/comments */
    async getComments(token: string | undefined, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudComment>> {
      return this.fetch({ path: `/tracks/${trackId}/comments?threaded=1&filter_replies=0${limit ? `&limit=${limit}` : ""}&linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** POST /tracks/:id/comments */
    async createComment(token: string | undefined, trackId: string | number, body: string, timestamp?: number): Promise<SoundCloudComment> {
      return this.fetch<SoundCloudComment>({
        path: `/tracks/${trackId}/comments`,
        method: "POST",
        token: resolveToken(this.getToken, token ?? undefined),
        body: { comment: { body, ...(timestamp !== undefined ? { timestamp } : {}) } },
      });
    }

    /** GET /tracks/:id/favoriters */
    async getLikes(token: string | undefined, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return this.fetch({ path: `/tracks/${trackId}/favoriters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /tracks/:id/reposters */
    async getReposts(token: string | undefined, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return this.fetch({ path: `/tracks/${trackId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /tracks/:id/related */
    async getRelated(token: string | undefined, trackId: string | number, limit?: number): Promise<SoundCloudTrack[]> {
      return this.fetch<SoundCloudTrack[]>({ path: `/tracks/${trackId}/related${limit ? `?limit=${limit}` : ""}`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** PUT /tracks/:id — update track metadata */
    async update(token: string | undefined, trackId: string | number, params: UpdateTrackParams): Promise<SoundCloudTrack> {
      return this.fetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "PUT", token: resolveToken(this.getToken, token ?? undefined), body: { track: params } });
    }

    /** DELETE /tracks/:id */
    async delete(token: string | undefined, trackId: string | number): Promise<void> {
      return this.fetch<void>({ path: `/tracks/${trackId}`, method: "DELETE", token: resolveToken(this.getToken, token ?? undefined) });
    }
  }

  export class Playlists {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /playlists/:id */
    async getPlaylist(token: string | undefined, playlistId: string | number): Promise<SoundCloudPlaylist> {
      return this.fetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /playlists/:id/tracks */
    async getTracks(token: string | undefined, playlistId: string | number, limit?: number, offset?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return this.fetch({ path: `/playlists/${playlistId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true${offset ? `&offset=${offset}` : ""}`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** GET /playlists/:id/reposters */
    async getReposts(token: string | undefined, playlistId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return this.fetch({ path: `/playlists/${playlistId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }

    /** POST /playlists — create a playlist */
    async create(token: string | undefined, params: CreatePlaylistParams): Promise<SoundCloudPlaylist> {
      return this.fetch<SoundCloudPlaylist>({ path: "/playlists", method: "POST", token: resolveToken(this.getToken, token ?? undefined), body: { playlist: params } });
    }

    /** PUT /playlists/:id — update a playlist */
    async update(token: string | undefined, playlistId: string | number, params: UpdatePlaylistParams): Promise<SoundCloudPlaylist> {
      return this.fetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "PUT", token: resolveToken(this.getToken, token ?? undefined), body: { playlist: params } });
    }

    /** DELETE /playlists/:id */
    async delete(token: string | undefined, playlistId: string | number): Promise<void> {
      return this.fetch<void>({ path: `/playlists/${playlistId}`, method: "DELETE", token: resolveToken(this.getToken, token ?? undefined) });
    }
  }

  export class Search {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /tracks?q= */
    async tracks(token: string | undefined, query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>>;
    async tracks(query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>>;
    async tracks(a: string | undefined, b?: string | number, c?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      let token: string | undefined;
      let query: string;
      let pageNumber: number | undefined;
      if (b !== undefined && typeof b === 'string') {
        token = a ?? undefined; query = b; pageNumber = c;
      } else {
        token = undefined; query = a!; pageNumber = b as number | undefined;
      }
      return this.fetch({ path: `/tracks?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /users?q= */
    async users(token: string | undefined, query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>>;
    async users(query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>>;
    async users(a: string | undefined, b?: string | number, c?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      let token: string | undefined;
      let query: string;
      let pageNumber: number | undefined;
      if (b !== undefined && typeof b === 'string') {
        token = a ?? undefined; query = b; pageNumber = c;
      } else {
        token = undefined; query = a!; pageNumber = b as number | undefined;
      }
      return this.fetch({ path: `/users?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: resolveToken(this.getToken, token) });
    }

    /** GET /playlists?q= */
    async playlists(token: string | undefined, query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>>;
    async playlists(query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>>;
    async playlists(a: string | undefined, b?: string | number, c?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      let token: string | undefined;
      let query: string;
      let pageNumber: number | undefined;
      if (b !== undefined && typeof b === 'string') {
        token = a ?? undefined; query = b; pageNumber = c;
      } else {
        token = undefined; query = a!; pageNumber = b as number | undefined;
      }
      return this.fetch({ path: `/playlists?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token: resolveToken(this.getToken, token) });
    }
  }

  export class Resolve {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** GET /resolve?url= */
    async resolveUrl(token: string | undefined, url: string): Promise<string>;
    async resolveUrl(url: string): Promise<string>;
    async resolveUrl(a: string | undefined, b?: string): Promise<string> {
      const [token, url] = b !== undefined ? [a, b] : [undefined, a!];
      return this.fetch<string>({ path: `/resolve?url=${encodeURIComponent(url)}`, method: "GET", token: resolveToken(this.getToken, token ?? undefined) });
    }
  }

  export class Likes {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** POST /likes/tracks/:id */
    async likeTrack(token: string | undefined, trackId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "POST", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }

    /** DELETE /likes/tracks/:id */
    async unlikeTrack(token: string | undefined, trackId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }

    /** POST /likes/playlists/:id */
    async likePlaylist(token: string | undefined, playlistId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "POST", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }

    /** DELETE /likes/playlists/:id */
    async unlikePlaylist(token: string | undefined, playlistId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "DELETE", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }
  }

  export class Reposts {
    constructor(private getToken: TokenGetter, private refreshCtx?: AutoRefreshContext) {}
    private fetch<T>(opts: Parameters<typeof scFetch>[0]) { return scFetch<T>(opts, this.refreshCtx); }

    /** POST /reposts/tracks/:id */
    async repostTrack(token: string | undefined, trackId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "POST", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }

    /** DELETE /reposts/tracks/:id */
    async unrepostTrack(token: string | undefined, trackId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "DELETE", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }

    /** POST /reposts/playlists/:id */
    async repostPlaylist(token: string | undefined, playlistId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "POST", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }

    /** DELETE /reposts/playlists/:id */
    async unrepostPlaylist(token: string | undefined, playlistId: string | number): Promise<boolean> {
      try { await this.fetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "DELETE", token: resolveToken(this.getToken, token ?? undefined) }); return true; } catch { return false; }
    }
  }
}
