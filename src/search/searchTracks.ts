import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";
import { buildSearchQuery, type SearchQueryOptions } from "./query.js";

/**
 * Search for tracks by query string.
 *
 * @param token - OAuth access token
 * @param query - Search query text
 * @param pageNumber - Zero-based page number (`limit` results per page; default limit 10)
 * @param options - Optional `limit` (1–200) and `access` (default `"playable"`)
 * @returns Paginated list of matching tracks
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { searchTracks } from 'soundcloud-api-ts';
 *
 * const result = await searchTracks(token, 'lofi hip hop');
 * result.collection.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks
 */
export const searchTracks = (
  token: string,
  query: string,
  pageNumber?: number,
  options?: SearchQueryOptions,
): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({
    path: `/tracks?${buildSearchQuery(query, pageNumber, { access: options?.access ?? "playable", limit: options?.limit })}`,
    method: "GET",
    token,
  });
