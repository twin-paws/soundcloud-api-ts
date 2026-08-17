import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * A user's track reposts (`GET /users/{id}/reposts/tracks`).
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const getUserRepostsTracks = (
  token: string,
  userId: string | number,
  limit?: number,
): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({
    path: `/users/${userId}/reposts/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
    method: "GET",
    token,
  });
