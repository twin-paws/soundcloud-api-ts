import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch tracks liked by a user.
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @param limit - Maximum number of tracks per page
 * @param cursor - Pagination cursor from a previous response's `next_href`
 * @returns Paginated list of liked tracks
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getUserLikesTracks } from 'tsd-soundcloud';
 *
 * const result = await getUserLikesTracks(token, 123456, 50);
 * result.collection.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__likes_tracks
 */
export const getUserLikesTracks = (token: string, userId: string | number, limit?: number, cursor?: string): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/users/${userId}/likes/tracks?${limit ? `limit=${limit}&` : ""}${cursor ? `cursor=${cursor}&` : ""}linked_partitioning=true`, method: "GET", token });
