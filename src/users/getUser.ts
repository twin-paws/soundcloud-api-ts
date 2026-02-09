import { scFetch } from "../client/http.js";
import type { SoundCloudUser } from "../types/api.js";

/**
 * Fetch a user's public profile by ID.
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @returns The user's public profile
 * @throws {SoundCloudError} When the user is not found or the API returns an error
 *
 * @example
 * ```ts
 * import { getUser } from 'soundcloud-api-ts';
 *
 * const user = await getUser(token, 123456);
 * console.log(user.username);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id_
 */
export const getUser = (token: string, userId: string | number): Promise<SoundCloudUser> =>
  scFetch<SoundCloudUser>({ path: `/users/${userId}`, method: "GET", token });
