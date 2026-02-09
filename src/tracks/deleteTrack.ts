import { scFetch } from "../client/http.js";

/**
 * Delete a track.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { deleteTrack } from 'tsd-soundcloud';
 *
 * await deleteTrack(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/delete_tracks__track_id_
 */
export const deleteTrack = (token: string, trackId: string | number): Promise<void> =>
  scFetch<void>({ path: `/tracks/${trackId}`, method: "DELETE", token });
