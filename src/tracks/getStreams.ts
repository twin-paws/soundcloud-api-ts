import { scFetch } from "../client/http.js";
import type { SoundCloudStreams } from "../types/api.js";

/**
 * Fetch stream URLs for a track (HLS, MP3, preview).
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @returns Object containing available stream URLs
 * @throws {SoundCloudError} When the track is not found or not streamable
 *
 * @example
 * ```ts
 * import { getTrackStreams } from 'soundcloud-api-ts';
 *
 * const streams = await getTrackStreams(token, 123456);
 * console.log(streams.hls_mp3_128_url);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__streams
 */
export const getTrackStreams = (token: string, trackId: string | number): Promise<SoundCloudStreams> =>
  scFetch<SoundCloudStreams>({ path: `/tracks/${trackId}/streams`, method: "GET", token });
