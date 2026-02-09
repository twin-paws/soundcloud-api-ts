import { scFetch } from "../client/http.js";
import type { SoundCloudMe } from "../types/api.js";

/**
 * Fetch the authenticated user's profile.
 *
 * @param token - OAuth access token
 * @returns The authenticated user's full profile including private account details
 * @throws {SoundCloudError} When the token is invalid or the API returns an error
 *
 * @example
 * ```ts
 * import { getMe } from 'soundcloud-api-ts';
 *
 * const me = await getMe(token);
 * console.log(me.username, me.private_tracks_count);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me
 */
export const getMe = (token: string): Promise<SoundCloudMe> =>
  scFetch<SoundCloudMe>({ path: "/me", method: "GET", token });
