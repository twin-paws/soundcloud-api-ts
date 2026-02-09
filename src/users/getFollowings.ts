import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch users that a given user is following.
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @param limit - Maximum number of users per page
 * @returns Paginated list of followed users
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getFollowings } from 'tsd-soundcloud';
 *
 * const result = await getFollowings(token, 123456, 50);
 * result.collection.forEach(u => console.log(u.username));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__followings
 */
export const getFollowings = (token: string, userId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/users/${userId}/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
