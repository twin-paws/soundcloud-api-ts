import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Track reposts of the authenticated user (`GET /me/reposts/tracks`).
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const getMeRepostsTracks = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({
    path: `/me/reposts/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
    method: "GET",
    token,
  });

/**
 * Playlist reposts of the authenticated user (`GET /me/reposts/playlists`).
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const getMeRepostsPlaylists = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({
    path: `/me/reposts/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
    method: "GET",
    token,
  });
