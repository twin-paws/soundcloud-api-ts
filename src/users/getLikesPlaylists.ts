import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch playlists liked by a user.
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @param limit - Maximum number of playlists per page
 * @returns Paginated list of liked playlists
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getUserLikesPlaylists } from 'tsd-soundcloud';
 *
 * const result = await getUserLikesPlaylists(token, 123456, 10);
 * result.collection.forEach(p => console.log(p.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__likes_playlists
 */
export const getUserLikesPlaylists = (token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({ path: `/users/${userId}/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
