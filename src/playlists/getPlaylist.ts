import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist } from "../types/api.js";

/**
 * Fetch a playlist by ID.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @returns The playlist object with track data
 * @throws {SoundCloudError} When the playlist is not found or the API returns an error
 *
 * @example
 * ```ts
 * import { getPlaylist } from 'tsd-soundcloud';
 *
 * const playlist = await getPlaylist(token, 123456);
 * console.log(playlist.title, playlist.track_count);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists__playlist_id_
 */
export const getPlaylist = (token: string, playlistId: string | number): Promise<SoundCloudPlaylist> =>
  scFetch<SoundCloudPlaylist>({ path: `/playlists/${playlistId}`, method: "GET", token });
