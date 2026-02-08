import { scFetch } from "../client/http.js";
import type { SoundCloudStreams } from "../types/api.js";

/** GET /tracks/:id/streams — returns streamable URLs */
export const getTrackStreams = (token: string, trackId: string | number): Promise<SoundCloudStreams> =>
  scFetch<SoundCloudStreams>({ path: `/tracks/${trackId}/streams`, method: "GET", token });
