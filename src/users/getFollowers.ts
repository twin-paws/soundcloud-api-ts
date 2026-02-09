import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch a user's followers.
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @param limit - Maximum number of followers per page
 * @returns Paginated list of follower users
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getFollowers } from 'tsd-soundcloud';
 *
 * const result = await getFollowers(token, 123456, 50);
 * result.collection.forEach(u => console.log(u.username));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__followers
 */
export const getFollowers = (token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/users/${userId}/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
