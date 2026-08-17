import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * A user's playlist reposts (`GET /users/{id}/reposts/playlists`).
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const getUserRepostsPlaylists = (
  token: string,
  userId: string | number,
  limit?: number,
): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({
    path: `/users/${userId}/reposts/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
    method: "GET",
    token,
  });
