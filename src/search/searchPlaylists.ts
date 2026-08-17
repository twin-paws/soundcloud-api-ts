import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";
import { buildSearchQuery, type SearchQueryOptions } from "./query.js";

/**
 * Search for playlists by query string.
 *
 * @param token - OAuth access token
 * @param query - Search query text
 * @param pageNumber - Zero-based page number (10 results per page)
 * @returns Paginated list of matching playlists
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { searchPlaylists } from 'soundcloud-api-ts';
 *
 * const result = await searchPlaylists(token, 'chill vibes');
 * result.collection.forEach(p => console.log(p.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists
 */
export const searchPlaylists = (
  token: string,
  query: string,
  pageNumber?: number,
  options?: SearchQueryOptions,
): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({
    path: `/playlists?${buildSearchQuery(query, pageNumber, { access: options?.access, limit: options?.limit })}`,
    method: "GET",
    token,
  });
