import { scFetch } from "../client/http.js";

/**
 * Start playback of a track preview. SoundCloud returns 302; this function returns the `Location` URL.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__preview
 */
export const getTrackPreviewUrl = (token: string, trackId: string | number): Promise<string> =>
  scFetch<string>({ path: `/tracks/${trackId}/preview`, method: "GET", token });
