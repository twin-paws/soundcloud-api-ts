import { scFetch } from "../client/http.js";

// Single implementations live in ../tracks/ — re-exported here so the likes
// module exposes the full like/unlike surface without duplicating code.
export { likeTrack } from "../tracks/likeTrack.js";
export { unlikeTrack } from "../tracks/unlikeTrack.js";

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
