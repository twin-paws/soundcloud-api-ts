import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/** GET /me/likes/tracks */
export const getMeLikesTracks = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/me/likes/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/** GET /me/likes/playlists */
export const getMeLikesPlaylists = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({ path: `/me/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
