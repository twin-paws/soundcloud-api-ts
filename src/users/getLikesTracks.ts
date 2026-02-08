import { scFetchAndMap } from "../client/http.js";
import { SCApiTrackArrayToTSDTrackArrayCursor } from "../mappers/track.js";
import type { SCApiTrack, CursorResponse } from "../types/api.js";
import type { Track, CursorResult } from "../types/models.js";

export const GetSCUserLikesTracks = (
  token: string,
  userId: string,
  limit?: number,
  cursor?: string
): Promise<CursorResult<Track>> => {
  return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
    {
      path: `/users/${userId}/likes/tracks?${limit ? `limit=${limit}&` : ""}${cursor ? `cursor=${cursor}&` : ""}linked_partitioning=true`,
      method: "GET",
      token,
    },
    SCApiTrackArrayToTSDTrackArrayCursor
  );
};
