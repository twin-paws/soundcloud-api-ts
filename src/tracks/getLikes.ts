import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch users who have liked (favorited) a track.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @param limit - Maximum number of users per page
 * @returns Paginated list of users who liked the track
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getTrackLikes } from 'tsd-soundcloud';
 *
 * const result = await getTrackLikes(token, 123456, 50);
 * result.collection.forEach(u => console.log(u.username));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__favoriters
 */
export const getTrackLikes = (token: string, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/tracks/${trackId}/favoriters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
