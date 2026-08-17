import { scFetch } from "../client/http.js";

/**
 * Start playback of a track. SoundCloud returns 302; this function returns the `Location` URL.
 *
 * @see https://developers.soundcloud.com/docs/api/guide
 */
export const getTrackStreamUrl = (token: string, trackId: string | number): Promise<string> =>
  scFetch<string>({ path: `/tracks/${trackId}/stream`, method: "GET", token });
