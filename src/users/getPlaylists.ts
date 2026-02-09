import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch a user's public playlists (without full track data).
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @param limit - Maximum number of playlists per page
 * @returns Paginated list of playlists
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getUserPlaylists } from 'tsd-soundcloud';
 *
 * const result = await getUserPlaylists(token, 123456, 10);
 * result.collection.forEach(p => console.log(p.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__playlists
 */
export const getUserPlaylists = (token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({ path: `/users/${userId}/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true&show_tracks=false`, method: "GET", token });
