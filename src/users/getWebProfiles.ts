import { scFetch } from "../client/http.js";
import type { SoundCloudWebProfile } from "../types/api.js";

/**
 * Fetch a user's external web profile links (Twitter, Instagram, personal site, etc.).
 *
 * @param token - OAuth access token
 * @param userId - The user's numeric ID or URN
 * @returns Array of web profile objects
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getUserWebProfiles } from 'tsd-soundcloud';
 *
 * const profiles = await getUserWebProfiles(token, 123456);
 * profiles.forEach(p => console.log(p.service, p.url));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__web_profiles
 */
export const getUserWebProfiles = (token: string, userId: string | number): Promise<SoundCloudWebProfile[]> =>
  scFetch<SoundCloudWebProfile[]>({ path: `/users/${userId}/web-profiles`, method: "GET", token });
