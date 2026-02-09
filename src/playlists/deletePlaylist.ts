import { scFetch } from "../client/http.js";

/**
 * Delete a playlist.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { deletePlaylist } from 'soundcloud-api-ts';
 *
 * await deletePlaylist(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/delete_playlists__playlist_id_
 */
export const deletePlaylist = (token: string, playlistId: string | number): Promise<void> =>
  scFetch<void>({ path: `/playlists/${playlistId}`, method: "DELETE", token });
