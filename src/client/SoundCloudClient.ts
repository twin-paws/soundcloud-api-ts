import { scFetch, scFetchAndMap } from "./http.js";
import { SCTokenToTSDToken } from "../mappers/token.js";
import {
  SCApiTrackToTSDTrack,
  SCApiTrackArrayToTSDTrackArray,
  SCApiTrackArrayToTSDTrackArrayCursor,
} from "../mappers/track.js";
import {
  SCApiUserToTSDUser,
  SCApiUserArrayToTSDUserArrayCursor,
} from "../mappers/user.js";
import { SCApiCommentArrayToTSDCommentArrayCursor } from "../mappers/comment.js";
import {
  SCApiPlaylistToTSDPlaylist,
  SCApiPlaylistArrayToTSDPlaylistArrayCursor,
} from "../mappers/playlist.js";

import type { SCApiClientToken, SCApiTrack, SCApiUser, SCApiPlaylist, SCApiComment, CursorResponse } from "../types/api.js";
import type { Token, SCUser, SCUserBase, Track, Playlist, PlaylistBase, SCComment, CursorResult } from "../types/models.js";

export interface SoundCloudClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

export class SoundCloudClient {
  private config: SoundCloudClientConfig;

  public auth: SoundCloudClient.Auth;
  public users: SoundCloudClient.Users;
  public tracks: SoundCloudClient.Tracks;
  public playlists: SoundCloudClient.Playlists;
  public search: SoundCloudClient.Search;
  public resolve: SoundCloudClient.Resolve;

  constructor(config: SoundCloudClientConfig) {
    this.config = config;
    this.auth = new SoundCloudClient.Auth(this.config);
    this.users = new SoundCloudClient.Users();
    this.tracks = new SoundCloudClient.Tracks();
    this.playlists = new SoundCloudClient.Playlists();
    this.search = new SoundCloudClient.Search();
    this.resolve = new SoundCloudClient.Resolve();
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SoundCloudClient {
  export class Auth {
    constructor(private config: SoundCloudClientConfig) {}

    /** POST /oauth2/token (client_credentials) */
    async getClientToken(): Promise<Token> {
      return scFetchAndMap<Token, SCApiClientToken>(
        {
          path: `/oauth2/token?client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&grant_type=client_credentials`,
          method: "POST",
        },
        SCTokenToTSDToken
      );
    }

    /** POST /oauth2/token (authorization_code) */
    async getUserToken(code: string): Promise<Token> {
      return scFetchAndMap<Token, SCApiClientToken>(
        {
          path: `/oauth2/token?grant_type=authorization_code&client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&redirect_uri=${this.config.redirectUri}&code=${code}`,
          method: "POST",
        },
        SCTokenToTSDToken
      );
    }

    /** POST /oauth2/token (refresh_token) */
    async refreshUserToken(refreshToken: string): Promise<Token> {
      return scFetchAndMap<Token, SCApiClientToken>(
        {
          path: `/oauth2/token?grant_type=refresh_token&client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&redirect_uri=${this.config.redirectUri}&refresh_token=${refreshToken}`,
          method: "POST",
        },
        SCTokenToTSDToken
      );
    }
  }

  export class Users {
    /** GET /me */
    async getMe(token: string): Promise<SCUser> {
      return scFetchAndMap<SCUser, SCApiUser>(
        { path: `/me`, method: "GET", token },
        SCApiUserToTSDUser
      );
    }

    /** GET /users/:id */
    async getUser(token: string, userId: string): Promise<SCUser> {
      return scFetchAndMap<SCUser, SCApiUser>(
        { path: `/users/${userId}`, method: "GET", token },
        SCApiUserToTSDUser
      );
    }

    /** GET /users/:id/followers */
    async getFollowers(token: string, userId: string, limit?: number): Promise<CursorResult<SCUserBase>> {
      return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
        {
          path: `/users/${userId}/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiUserArrayToTSDUserArrayCursor
      );
    }

    /** GET /users/:id/followings */
    async getFollowings(token: string, userId: string, limit?: number): Promise<CursorResult<SCUserBase>> {
      return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
        {
          path: `/users/${userId}/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiUserArrayToTSDUserArrayCursor
      );
    }

    /** GET /users/:id/tracks */
    async getTracks(token: string, userId: string, limit?: number): Promise<CursorResult<Track>> {
      return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
        {
          path: `/users/${userId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiTrackArrayToTSDTrackArrayCursor
      );
    }

    /** GET /users/:id/playlists */
    async getPlaylists(token: string, userId: string, limit?: number): Promise<CursorResult<PlaylistBase>> {
      return scFetchAndMap<CursorResult<PlaylistBase>, CursorResponse<SCApiPlaylist>>(
        {
          path: `/users/${userId}/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true&show_tracks=false`,
          method: "GET",
          token,
        },
        SCApiPlaylistArrayToTSDPlaylistArrayCursor
      );
    }

    /** GET /users/:id/likes/tracks */
    async getLikesTracks(token: string, userId: string, limit?: number, cursor?: string): Promise<CursorResult<Track>> {
      return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
        {
          path: `/users/${userId}/likes/tracks?${limit ? `limit=${limit}&` : ""}${cursor ? `cursor=${cursor}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiTrackArrayToTSDTrackArrayCursor
      );
    }

    /** GET /users/:id/likes/playlists */
    async getLikesPlaylists(token: string, userId: string, limit?: number): Promise<CursorResult<PlaylistBase>> {
      return scFetchAndMap<CursorResult<PlaylistBase>, CursorResponse<SCApiPlaylist>>(
        {
          path: `/users/${userId}/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiPlaylistArrayToTSDPlaylistArrayCursor
      );
    }
  }

  export class Tracks {
    /** GET /tracks/:id */
    async getTrack(token: string, trackId: string): Promise<Track> {
      return scFetchAndMap<Track, SCApiTrack>(
        { path: `/tracks/${trackId}`, method: "GET", token },
        SCApiTrackToTSDTrack
      );
    }

    /** GET /tracks/:id/comments */
    async getComments(token: string, trackId: string, limit?: number): Promise<CursorResult<SCComment>> {
      return scFetchAndMap<CursorResult<SCComment>, CursorResponse<SCApiComment>>(
        {
          path: `/tracks/${trackId}/comments?threaded=1&filter_replies=0${limit ? `&limit=${limit}` : ""}&linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiCommentArrayToTSDCommentArrayCursor
      );
    }

    /** GET /tracks/:id/favoriters */
    async getLikes(token: string, trackId: string, limit?: number): Promise<CursorResult<SCUser>> {
      return scFetchAndMap<CursorResult<SCUser>, CursorResponse<SCApiUser>>(
        {
          path: `/tracks/${trackId}/favoriters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiUserArrayToTSDUserArrayCursor
      );
    }

    /** GET /tracks/:id/reposters */
    async getReposts(token: string, trackId: string, limit?: number): Promise<CursorResult<SCUserBase>> {
      return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
        {
          path: `/tracks/${trackId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiUserArrayToTSDUserArrayCursor
      );
    }

    /** GET /tracks/:id/related */
    async getRelated(token: string, trackId: string, limit?: number): Promise<Track[]> {
      return scFetchAndMap<Track[], SCApiTrack[]>(
        {
          path: `/tracks/${trackId}/related${limit ? `?limit=${limit}` : ""}`,
          method: "GET",
          token,
        },
        SCApiTrackArrayToTSDTrackArray
      );
    }

    /** POST /likes/tracks/:id */
    async like(token: string, trackId: string): Promise<boolean> {
      try {
        await scFetch<unknown>({
          path: `/likes/tracks/${trackId}`,
          method: "POST",
          token,
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  export class Playlists {
    /** GET /playlists/:id */
    async getPlaylist(token: string, playlistId: string): Promise<Playlist> {
      return scFetchAndMap<Playlist, SCApiPlaylist>(
        { path: `/playlists/${playlistId}`, method: "GET", token },
        SCApiPlaylistToTSDPlaylist
      );
    }

    /** GET /playlists/:id/tracks */
    async getTracks(token: string, playlistId: string, limit?: number, offset?: number): Promise<CursorResult<Track>> {
      return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
        {
          path: `/playlists/${playlistId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true${offset ? `&offset=${offset}` : ""}`,
          method: "GET",
          token,
        },
        SCApiTrackArrayToTSDTrackArrayCursor
      );
    }

    /** GET /playlists/:id/reposters */
    async getReposts(token: string, playlistId: string, limit?: number): Promise<CursorResult<SCUserBase>> {
      return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
        {
          path: `/playlists/${playlistId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
          method: "GET",
          token,
        },
        SCApiUserArrayToTSDUserArrayCursor
      );
    }
  }

  export class Search {
    /** GET /tracks?q= */
    async tracks(token: string, text: string, pageNumber?: number): Promise<CursorResult<Track>> {
      return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
        {
          path: `/tracks?q=${text}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`,
          method: "GET",
          token,
        },
        SCApiTrackArrayToTSDTrackArrayCursor
      );
    }

    /** GET /users?q= */
    async users(token: string, text: string, pageNumber?: number): Promise<CursorResult<SCUserBase>> {
      return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
        {
          path: `/users?q=${text}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`,
          method: "GET",
          token,
        },
        SCApiUserArrayToTSDUserArrayCursor
      );
    }

    /** GET /playlists?q= */
    async playlists(token: string, text: string, pageNumber?: number): Promise<CursorResult<PlaylistBase>> {
      return scFetchAndMap<CursorResult<PlaylistBase>, CursorResponse<SCApiPlaylist>>(
        {
          path: `/playlists?q=${text}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`,
          method: "GET",
          token,
        },
        SCApiPlaylistArrayToTSDPlaylistArrayCursor
      );
    }
  }

  export class Resolve {
    /** GET /resolve?url= */
    async resolveUrl(token: string, url: string): Promise<string> {
      return scFetch<string>({
        path: `/resolve?url=${url}`,
        method: "GET",
        token,
      });
    }
  }
}
