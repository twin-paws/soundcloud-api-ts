import { scFetch } from "../client/http.js";
import type { SoundCloudTrack } from "../types/api.js";

/**
 * Parameters for updating a track's metadata via {@link updateTrack}.
 */
export interface UpdateTrackParams {
  /** New track title */
  title?: string;
  /** New track description */
  description?: string;
  /** Music genre (e.g. "Electronic", "Hip-hop & Rap") */
  genre?: string;
  /** Space-separated tags (tags with spaces should be wrapped in quotes) */
  tag_list?: string;
  /** Visibility: "public" or "private" */
  sharing?: "public" | "private";
  /** Whether the track is downloadable */
  downloadable?: boolean;
  /** External purchase URL */
  purchase_url?: string;
  /** Label for the purchase/buy button */
  purchase_title?: string;
  /** Release identifier string */
  release?: string;
  /** Day of the release date (1-31) */
  release_day?: number;
  /** Month of the release date (1-12) */
  release_month?: number;
  /** Year of the release date */
  release_year?: number;
  /** Record label name */
  label_name?: string;
  /** Creative Commons license type (e.g. "all-rights-reserved", "cc-by") */
  license?: string;
  /** International Standard Recording Code */
  isrc?: string;
  /** Beats per minute */
  bpm?: number;
  /** Musical key signature (e.g. "C major") */
  key_signature?: string;
}

/**
 * Update a track's metadata.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @param params - Fields to update
 * @returns The updated track object
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { updateTrack } from 'tsd-soundcloud';
 *
 * const updated = await updateTrack(token, 123456, {
 *   title: 'New Title',
 *   genre: 'Electronic',
 * });
 * console.log(updated.title);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/put_tracks__track_id_
 */
export const updateTrack = (
  token: string,
  trackId: string | number,
  params: UpdateTrackParams,
): Promise<SoundCloudTrack> =>
  scFetch<SoundCloudTrack>({
    path: `/tracks/${trackId}`,
    method: "PUT",
    token,
    body: { track: params },
  });
