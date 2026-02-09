import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist } from "../types/api.js";

/**
 * Parameters for creating a new playlist via {@link createPlaylist}.
 */
export interface CreatePlaylistParams {
  /** Playlist title (required) */
  title: string;
  /** Playlist description */
  description?: string;
  /** Visibility: "public" or "private" */
  sharing?: "public" | "private";
  /** Tracks to include, specified by URN (e.g. `[{ urn: "soundcloud:tracks:123" }]`) */
  tracks?: { urn: string }[];
  /** European Article Number (barcode) for the release */
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
 * Create a new playlist.
 *
 * @param token - OAuth access token
 * @param params - Playlist creation parameters (title is required)
 * @returns The created playlist object
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { createPlaylist } from 'tsd-soundcloud';
 *
 * const playlist = await createPlaylist(token, {
 *   title: 'My Favorites',
 *   sharing: 'public',
 *   tracks: [{ urn: 'soundcloud:tracks:123' }],
 * });
 * console.log(playlist.id, playlist.title);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/post_playlists
 */
export const createPlaylist = (
  token: string,
  params: CreatePlaylistParams,
): Promise<SoundCloudPlaylist> =>
  scFetch<SoundCloudPlaylist>({
    path: "/playlists",
    method: "POST",
    token,
    body: { playlist: params },
  });
