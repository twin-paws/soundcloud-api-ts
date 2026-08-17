import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";
import { buildSearchQuery, type SearchQueryOptions } from "./query.js";

/**
 * Search for users by query string.
 *
 * @param token - OAuth access token
 * @param query - Search query text
 * @param pageNumber - Zero-based page number (10 results per page)
 * @returns Paginated list of matching users
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { searchUsers } from 'soundcloud-api-ts';
 *
 * const result = await searchUsers(token, 'deadmau5');
 * result.collection.forEach(u => console.log(u.username));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users
 */
export const searchUsers = (
  token: string,
  query: string,
  pageNumber?: number,
  options?: Omit<SearchQueryOptions, "access">,
): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({
    path: `/users?${buildSearchQuery(query, pageNumber, { limit: options?.limit })}`,
    method: "GET",
    token,
  });
