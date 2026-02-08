import { scFetch } from "./http.js";
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
}

export class SoundCloudClient {
  private config: SoundCloudClientConfig;

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
    this.auth = new SoundCloudClient.Auth(this.config);
    this.me = new SoundCloudClient.Me();
    this.users = new SoundCloudClient.Users();
    this.tracks = new SoundCloudClient.Tracks();
    this.playlists = new SoundCloudClient.Playlists();
    this.search = new SoundCloudClient.Search();
    this.resolve = new SoundCloudClient.Resolve();
    this.likes = new SoundCloudClient.Likes();
    this.reposts = new SoundCloudClient.Reposts();
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SoundCloudClient {
  export class Auth {
    constructor(private config: SoundCloudClientConfig) {}

    /** POST /oauth2/token — client_credentials grant */
    async getClientToken(): Promise<SoundCloudToken> {
      return scFetch<SoundCloudToken>({
        path: `/oauth2/token?client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&grant_type=client_credentials`,
        method: "POST",
      });
    }

    /** POST /oauth2/token — authorization_code grant */
    async getUserToken(code: string, codeVerifier?: string): Promise<SoundCloudToken> {
      let path = `/oauth2/token?grant_type=authorization_code&client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&redirect_uri=${this.config.redirectUri}&code=${code}`;
      if (codeVerifier) path += `&code_verifier=${codeVerifier}`;
      return scFetch<SoundCloudToken>({ path, method: "POST" });
    }

    /** POST /oauth2/token — refresh_token grant */
    async refreshUserToken(refreshToken: string): Promise<SoundCloudToken> {
      return scFetch<SoundCloudToken>({
        path: `/oauth2/token?grant_type=refresh_token&client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&redirect_uri=${this.config.redirectUri}&refresh_token=${refreshToken}`,
        method: "POST",
      });
    }

    /** POST /sign-out — invalidates session */
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
    /** GET /me */
    async getMe(token: string): Promise<SoundCloudMe> {
      return scFetch<SoundCloudMe>({ path: "/me", method: "GET", token });
    }

    /** GET /me/activities */
    async getActivities(token: string, limit?: number): Promise<SoundCloudActivitiesResponse> {
      return scFetch({ path: `/me/activities?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/activities/all/own */
    async getActivitiesOwn(token: string, limit?: number): Promise<SoundCloudActivitiesResponse> {
      return scFetch({ path: `/me/activities/all/own?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/activities/tracks */
    async getActivitiesTracks(token: string, limit?: number): Promise<SoundCloudActivitiesResponse> {
      return scFetch({ path: `/me/activities/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/likes/tracks */
    async getLikesTracks(token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return scFetch({ path: `/me/likes/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/likes/playlists */
    async getLikesPlaylists(token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return scFetch({ path: `/me/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/followings */
    async getFollowings(token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/me/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/followings/tracks */
    async getFollowingsTracks(token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return scFetch({ path: `/me/followings/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** PUT /me/followings/:user_urn — follow a user */
    async follow(token: string, userUrn: string | number): Promise<void> {
      return scFetch<void>({ path: `/me/followings/${userUrn}`, method: "PUT", token });
    }

    /** DELETE /me/followings/:user_urn — unfollow a user */
    async unfollow(token: string, userUrn: string | number): Promise<void> {
      return scFetch<void>({ path: `/me/followings/${userUrn}`, method: "DELETE", token });
    }

    /** GET /me/followers */
    async getFollowers(token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/me/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/playlists */
    async getPlaylists(token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return scFetch({ path: `/me/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /me/tracks */
    async getTracks(token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return scFetch({ path: `/me/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }
  }

  export class Users {
    /** GET /users/:id */
    async getUser(token: string, userId: string | number): Promise<SoundCloudUser> {
      return scFetch<SoundCloudUser>({ path: `/users/${userId}`, method: "GET", token });
    }

    /** GET /users/:id/followers */
    async getFollowers(token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/users/${userId}/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /users/:id/followings */
    async getFollowings(token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/users/${userId}/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /users/:id/tracks */
    async getTracks(token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return scFetch({ path: `/users/${userId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /users/:id/playlists */
    async getPlaylists(token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return scFetch({ path: `/users/${userId}/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true&show_tracks=false`, method: "GET", token });
    }

    /** GET /users/:id/likes/tracks */
    async getLikesTracks(token: string, userId: string | number, limit?: number, cursor?: string): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return scFetch({ path: `/users/${userId}/likes/tracks?${limit ? `limit=${limit}&` : ""}${cursor ? `cursor=${cursor}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /users/:id/likes/playlists */
    async getLikesPlaylists(token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return scFetch({ path: `/users/${userId}/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /users/:id/web-profiles */
    async getWebProfiles(token: string, userId: string | number): Promise<SoundCloudWebProfile[]> {
      return scFetch<SoundCloudWebProfile[]>({ path: `/users/${userId}/web-profiles`, method: "GET", token });
    }
  }

  export class Tracks {
    /** GET /tracks/:id */
    async getTrack(token: string, trackId: string | number): Promise<SoundCloudTrack> {
      return scFetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "GET", token });
    }

    /** GET /tracks/:id/streams */
    async getStreams(token: string, trackId: string | number): Promise<SoundCloudStreams> {
      return scFetch<SoundCloudStreams>({ path: `/tracks/${trackId}/streams`, method: "GET", token });
    }

    /** GET /tracks/:id/comments */
    async getComments(token: string, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudComment>> {
      return scFetch({ path: `/tracks/${trackId}/comments?threaded=1&filter_replies=0${limit ? `&limit=${limit}` : ""}&linked_partitioning=true`, method: "GET", token });
    }

    /** POST /tracks/:id/comments */
    async createComment(token: string, trackId: string | number, body: string, timestamp?: number): Promise<SoundCloudComment> {
      return scFetch<SoundCloudComment>({
        path: `/tracks/${trackId}/comments`,
        method: "POST",
        token,
        body: { comment: { body, ...(timestamp !== undefined ? { timestamp } : {}) } },
      });
    }

    /** GET /tracks/:id/favoriters */
    async getLikes(token: string, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/tracks/${trackId}/favoriters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /tracks/:id/reposters */
    async getReposts(token: string, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/tracks/${trackId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** GET /tracks/:id/related */
    async getRelated(token: string, trackId: string | number, limit?: number): Promise<SoundCloudTrack[]> {
      return scFetch<SoundCloudTrack[]>({ path: `/tracks/${trackId}/related${limit ? `?limit=${limit}` : ""}`, method: "GET", token });
    }

    /** PUT /tracks/:id — update track metadata */
    async update(token: string, trackId: string | number, params: UpdateTrackParams): Promise<SoundCloudTrack> {
      return scFetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "PUT", token, body: { track: params } });
    }

    /** DELETE /tracks/:id */
    async delete(token: string, trackId: string | number): Promise<void> {
      return scFetch<void>({ path: `/tracks/${trackId}`, method: "DELETE", token });
    }
  }

  export class Playlists {
    /** GET /playlists/:id */
    async getPlaylist(token: string, playlistId: string | number): Promise<SoundCloudPlaylist> {
      return scFetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "GET", token });
    }

    /** GET /playlists/:id/tracks */
    async getTracks(token: string, playlistId: string | number, limit?: number, offset?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return scFetch({ path: `/playlists/${playlistId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true${offset ? `&offset=${offset}` : ""}`, method: "GET", token });
    }

    /** GET /playlists/:id/reposters */
    async getReposts(token: string, playlistId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/playlists/${playlistId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
    }

    /** POST /playlists — create a playlist */
    async create(token: string, params: CreatePlaylistParams): Promise<SoundCloudPlaylist> {
      return scFetch<SoundCloudPlaylist>({ path: "/playlists", method: "POST", token, body: { playlist: params } });
    }

    /** PUT /playlists/:id — update a playlist */
    async update(token: string, playlistId: string | number, params: UpdatePlaylistParams): Promise<SoundCloudPlaylist> {
      return scFetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "PUT", token, body: { playlist: params } });
    }

    /** DELETE /playlists/:id */
    async delete(token: string, playlistId: string | number): Promise<void> {
      return scFetch<void>({ path: `/playlists/${playlistId}`, method: "DELETE", token });
    }
  }

  export class Search {
    /** GET /tracks?q= */
    async tracks(token: string, query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> {
      return scFetch({ path: `/tracks?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token });
    }

    /** GET /users?q= */
    async users(token: string, query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> {
      return scFetch({ path: `/users?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token });
    }

    /** GET /playlists?q= */
    async playlists(token: string, query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> {
      return scFetch({ path: `/playlists?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token });
    }
  }

  export class Resolve {
    /** GET /resolve?url= */
    async resolveUrl(token: string, url: string): Promise<string> {
      return scFetch<string>({ path: `/resolve?url=${encodeURIComponent(url)}`, method: "GET", token });
    }
  }

  export class Likes {
    /** POST /likes/tracks/:id */
    async likeTrack(token: string, trackId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "POST", token }); return true; } catch { return false; }
    }

    /** DELETE /likes/tracks/:id */
    async unlikeTrack(token: string, trackId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token }); return true; } catch { return false; }
    }

    /** POST /likes/playlists/:id */
    async likePlaylist(token: string, playlistId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "POST", token }); return true; } catch { return false; }
    }

    /** DELETE /likes/playlists/:id */
    async unlikePlaylist(token: string, playlistId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "DELETE", token }); return true; } catch { return false; }
    }
  }

  export class Reposts {
    /** POST /reposts/tracks/:id */
    async repostTrack(token: string, trackId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "POST", token }); return true; } catch { return false; }
    }

    /** DELETE /reposts/tracks/:id */
    async unrepostTrack(token: string, trackId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "DELETE", token }); return true; } catch { return false; }
    }

    /** POST /reposts/playlists/:id */
    async repostPlaylist(token: string, playlistId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "POST", token }); return true; } catch { return false; }
    }

    /** DELETE /reposts/playlists/:id */
    async unrepostPlaylist(token: string, playlistId: string | number): Promise<boolean> {
      try { await scFetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "DELETE", token }); return true; } catch { return false; }
    }
  }
}
