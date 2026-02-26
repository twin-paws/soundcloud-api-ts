import { scFetch } from "../client/http.js";
import type { SoundCloudTrack } from "../types/api.js";

/**
 * Fetch multiple tracks by their IDs in a single request.
 *
 * @param token - OAuth access token
 * @param ids - Array of track IDs (numeric or string URNs)
 * @returns Array of track objects (may be shorter than `ids` if some tracks are unavailable)
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getTracks } from 'soundcloud-api-ts';
 *
 * const tracks = await getTracks(token, [123456, 234567, 345678]);
 * tracks.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks
 */
export const getTracks = (
  token: string,
  ids: (string | number)[],
): Promise<SoundCloudTrack[]> =>
  scFetch<SoundCloudTrack[]>({
    path: `/tracks?ids=${ids.join(",")}`,
    method: "GET",
    token,
  });
