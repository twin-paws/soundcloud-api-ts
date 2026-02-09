import { scFetch } from "../client/http.js";
import type { SoundCloudTrack } from "../types/api.js";

/**
 * Fetch tracks related to a given track.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @param limit - Maximum number of related tracks to return
 * @returns Array of related tracks
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getRelatedTracks } from 'soundcloud-api-ts';
 *
 * const related = await getRelatedTracks(token, 123456, 5);
 * related.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__related
 */
export const getRelatedTracks = (token: string, trackId: string | number, limit?: number): Promise<SoundCloudTrack[]> =>
  scFetch<SoundCloudTrack[]>({ path: `/tracks/${trackId}/related${limit ? `?limit=${limit}` : ""}`, method: "GET", token });
