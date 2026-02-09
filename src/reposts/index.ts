import { scFetch } from "../client/http.js";

/**
 * Repost a track to your profile.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @returns `true` if the repost was successful, `false` on failure
 *
 * @example
 * ```ts
 * import { repostTrack } from 'tsd-soundcloud';
 *
 * const success = await repostTrack(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/post_reposts_tracks__track_id_
 */
export const repostTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "POST", token }); return true; } catch { return false; }
};

/**
 * Remove a track repost from your profile.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @returns `true` if the unrepost was successful, `false` on failure
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/delete_reposts_tracks__track_id_
 */
export const unrepostTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "DELETE", token }); return true; } catch { return false; }
};

/**
 * Repost a playlist to your profile.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @returns `true` if the repost was successful, `false` on failure
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/post_reposts_playlists__playlist_id_
 */
export const repostPlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "POST", token }); return true; } catch { return false; }
};

/**
 * Remove a playlist repost from your profile.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @returns `true` if the unrepost was successful, `false` on failure
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/reposts/delete_reposts_playlists__playlist_id_
 */
export const unrepostPlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "DELETE", token }); return true; } catch { return false; }
};
