import { scFetchAndMap } from "../client/http.js";
import { SCApiTrackArrayToTSDTrackArray } from "../mappers/track.js";
import type { SCApiTrack } from "../types/api.js";
import type { Track } from "../types/models.js";

export const GetSCTrackRelated = (
  token: string,
  trackId: string,
  limit?: number
): Promise<Track[]> => {
  return scFetchAndMap<Track[], SCApiTrack[]>(
    {
      path: `/tracks/${trackId}/related${limit ? `?limit=${limit}` : ""}`,
      method: "GET",
      token,
    },
    SCApiTrackArrayToTSDTrackArray
  );
};
