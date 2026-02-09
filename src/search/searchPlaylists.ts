import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

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
 * import { searchPlaylists } from 'tsd-soundcloud';
 *
 * const result = await searchPlaylists(token, 'chill vibes');
 * result.collection.forEach(p => console.log(p.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists
 */
export const searchPlaylists = (token: string, query: string, pageNumber?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({ path: `/playlists?q=${encodeURIComponent(query)}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`, method: "GET", token });
