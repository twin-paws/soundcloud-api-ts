import { scFetchAndMap } from "../client/http.js";
import { SCApiTrackArrayToTSDTrackArrayCursor } from "../mappers/track.js";
import type { SCApiTrack, CursorResponse } from "../types/api.js";
import type { Track, CursorResult } from "../types/models.js";

export const GetSCUserTracks = (
  token: string,
  userId: string,
  limit?: number
): Promise<CursorResult<Track>> => {
  return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
    {
      path: `/users/${userId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
      method: "GET",
      token,
    },
    SCApiTrackArrayToTSDTrackArrayCursor
  );
};
