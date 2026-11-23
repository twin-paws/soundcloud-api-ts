import { scFetch } from "../client/http.js";
import type { SoundCloudSystemPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch system playlists (stations) liked by a user.
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @param limit - Maximum number of system playlists per page
 * @returns Paginated list of liked system playlists
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getUserLikesSystemPlaylists } from 'soundcloud-api-ts';
 *
 * const result = await getUserLikesSystemPlaylists(token, 123456, 10);
 * result.collection.forEach(s => console.log(s.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users
 */
export const getUserLikesSystemPlaylists = (token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudSystemPlaylist>> =>
  scFetch({ path: `/users/${userId}/likes/system-playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
