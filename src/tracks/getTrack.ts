import { scFetch } from "../client/http.js";
import type { SoundCloudTrack } from "../types/api.js";

/**
 * Fetch a track by ID.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @returns The track object with full metadata
 * @throws {SoundCloudError} When the track is not found or the API returns an error
 *
 * @example
 * ```ts
 * import { getTrack } from 'soundcloud-api-ts';
 *
 * const track = await getTrack(token, 123456);
 * console.log(track.title, track.duration);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id_
 */
export const getTrack = (token: string, trackId: string | number): Promise<SoundCloudTrack> =>
  scFetch<SoundCloudTrack>({ path: `/tracks/${trackId}`, method: "GET", token });
