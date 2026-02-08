import { scFetchAndMap } from "../client/http.js";
import { SCApiTrackToTSDTrack } from "../mappers/track.js";
import type { SCApiTrack } from "../types/api.js";
import type { Track } from "../types/models.js";

export const GetSCTrackWithId = (token: string, trackId: string): Promise<Track> => {
  return scFetchAndMap<Track, SCApiTrack>(
    { path: `/tracks/${trackId}`, method: "GET", token },
    SCApiTrackToTSDTrack
  );
};
