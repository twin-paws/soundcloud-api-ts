import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist } from "../types/api.js";

/**
 * Parameters for updating a playlist via {@link updatePlaylist}.
 */
export interface UpdatePlaylistParams {
  /** New playlist title */
  title?: string;
  /** New playlist description */
  description?: string;
  /** Visibility: "public" or "private" */
  sharing?: "public" | "private";
  /** Replace the playlist's tracks (specified by URN) */
  tracks?: { urn: string }[];
  /** European Article Number (barcode) */
  ean?: string;
  /** Music genre */
  genre?: string;
  /** Record label name */
  label_name?: string;
  /** Creative Commons license type */
  license?: string;
  /** Custom permalink slug */
  permalink?: string;
  /** Label for the purchase/buy button */
  purchase_title?: string;
  /** External purchase URL */
  purchase_url?: string;
  /** Release identifier string */
  release?: string;
  /** Release date in ISO 8601 format */
  release_date?: string;
  /** Set type: "album" or "playlist" */
  set_type?: "album" | "playlist";
  /** Space-separated tags */
  tag_list?: string;
}

/**
 * Update a playlist's metadata or track list.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @param params - Fields to update
 * @returns The updated playlist object
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { updatePlaylist } from 'tsd-soundcloud';
 *
 * const updated = await updatePlaylist(token, 123456, {
 *   title: 'Updated Title',
 *   tracks: [{ urn: 'soundcloud:tracks:111' }, { urn: 'soundcloud:tracks:222' }],
 * });
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/put_playlists__playlist_id_
 */
export const updatePlaylist = (
  token: string,
  playlistId: string | number,
  params: UpdatePlaylistParams,
): Promise<SoundCloudPlaylist> =>
  scFetch<SoundCloudPlaylist>({
    path: `/playlists/${playlistId}`,
    method: "PUT",
    token,
    body: { playlist: params },
  });
