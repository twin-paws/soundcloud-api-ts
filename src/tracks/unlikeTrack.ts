import { scFetch } from "../client/http.js";

/**
 * Unlike (unfavorite) a track as the authenticated user.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @returns `true` if the unlike was successful, `false` on failure
 *
 * @example
 * ```ts
 * import { unlikeTrack } from 'soundcloud-api-ts';
 *
 * const success = await unlikeTrack(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/delete_likes_tracks__track_id_
 */
export const unlikeTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try {
    await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token });
    return true;
  } catch {
    return false;
  }
};
