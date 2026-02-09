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
 * import { likeTrack } from 'soundcloud-api-ts';
 *
 * const success = await likeTrack(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/post_likes_tracks__track_id_
 */
export const likeTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "POST", token }); return true; } catch { return false; }
};

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
  try { await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token }); return true; } catch { return false; }
};

/**
 * Like a playlist as the authenticated user.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @returns `true` if the like was successful, `false` on failure
 *
 * @example
 * ```ts
 * import { likePlaylist } from 'soundcloud-api-ts';
 *
 * const success = await likePlaylist(token, 789012);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/post_likes_playlists__playlist_id_
 */
export const likePlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "POST", token }); return true; } catch { return false; }
};

/**
 * Unlike a playlist as the authenticated user.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @returns `true` if the unlike was successful, `false` on failure
 *
 * @example
 * ```ts
 * import { unlikePlaylist } from 'soundcloud-api-ts';
 *
 * const success = await unlikePlaylist(token, 789012);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/likes/delete_likes_playlists__playlist_id_
 */
export const unlikePlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "DELETE", token }); return true; } catch { return false; }
};
