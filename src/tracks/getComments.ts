import { scFetch } from "../client/http.js";
import type { SoundCloudComment, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch comments on a track.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @param limit - Maximum number of comments per page
 * @returns Paginated list of comments
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getTrackComments } from 'tsd-soundcloud';
 *
 * const result = await getTrackComments(token, 123456, 20);
 * result.collection.forEach(c => console.log(c.body));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__comments
 */
export const getTrackComments = (token: string, trackId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudComment>> =>
  scFetch({ path: `/tracks/${trackId}/comments?threaded=1&filter_replies=0${limit ? `&limit=${limit}` : ""}&linked_partitioning=true`, method: "GET", token });
