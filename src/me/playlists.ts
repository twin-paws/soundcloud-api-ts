import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch the authenticated user's playlists.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of playlists per page
 * @returns Paginated list of playlists
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getMePlaylists } from 'tsd-soundcloud';
 *
 * const result = await getMePlaylists(token, 10);
 * result.collection.forEach(p => console.log(p.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_playlists
 */
export const getMePlaylists = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({ path: `/me/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
