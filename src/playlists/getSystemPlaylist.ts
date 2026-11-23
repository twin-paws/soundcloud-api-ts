import { scFetch } from "../client/http.js";
import type { SoundCloudSystemPlaylist } from "../types/api.js";

/** Options for fetching a system playlist. */
export interface SystemPlaylistOptions {
  /**
   * Filter the playlist's tracks by access level — a comma-separated list of
   * `playable`, `preview`, `blocked`. API default is `playable,preview`.
   */
  access?: string;
}

/** Builds the `/system-playlists/{id}` path, shared by the standalone function and the client. */
export const systemPlaylistPath = (id: string, options?: SystemPlaylistOptions): string =>
  `/system-playlists/${id}${options?.access ? `?access=${encodeURIComponent(options.access)}` : ""}`;

/**
 * Fetch a system playlist (e.g. a track station or artist station).
 *
 * @param token - OAuth access token
 * @param id - Full URN (`soundcloud:system-playlists:track-stations:123`) or the identifier portion (`track-stations:123`)
 * @param options - Optional `access` filter for the playlist's tracks
 * @returns The system playlist with its visible tracks
 * @throws {SoundCloudError} When the system playlist is not found or the API returns an error
 *
 * @example
 * ```ts
 * import { getTrack, getSystemPlaylist } from 'soundcloud-api-ts';
 *
 * const track = await getTrack(token, 123456);
 * if (track.station_urn) {
 *   const station = await getSystemPlaylist(token, track.station_urn);
 *   station.tracks.forEach(t => console.log(t.title));
 * }
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/system-playlists
 */
export const getSystemPlaylist = (token: string, id: string, options?: SystemPlaylistOptions): Promise<SoundCloudSystemPlaylist> =>
  scFetch<SoundCloudSystemPlaylist>({ path: systemPlaylistPath(id, options), method: "GET", token });
