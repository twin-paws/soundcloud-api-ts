import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch the authenticated user's followers.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of users per page
 * @returns Paginated list of follower users
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getMeFollowers } from 'tsd-soundcloud';
 *
 * const result = await getMeFollowers(token, 50);
 * result.collection.forEach(u => console.log(u.username));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_followers
 */
export const getMeFollowers = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/me/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
