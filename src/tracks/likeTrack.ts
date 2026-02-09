import { scFetch } from "../client/http.js";

/**
 * Like (favorite) a track as the authenticated user.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @returns `true` if the like was successful, `false` on failure
 *
 * @example
 * ```ts
 * import { likeTrack } from 'tsd-soundcloud';
 *
 * const success = await likeTrack(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/post_likes_tracks__track_id_
 */
export const likeTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try {
    await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "POST", token });
    return true;
  } catch {
    return false;
  }
};
