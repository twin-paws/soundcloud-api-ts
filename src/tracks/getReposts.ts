import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch users who have reposted a track.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @param limit - Maximum number of users per page
 * @returns Paginated list of users who reposted the track
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getTrackReposts } from 'tsd-soundcloud';
 *
 * const result = await getTrackReposts(token, 123456, 50);
 * result.collection.forEach(u => console.log(u.username));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__reposters
 */
export const getTrackReposts = (token: string, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/tracks/${trackId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
