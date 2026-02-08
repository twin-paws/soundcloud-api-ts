import { scFetchAndMap } from "../client/http.js";
import { SCApiTrackArrayToTSDTrackArrayCursor } from "../mappers/track.js";
import type { SCApiTrack, CursorResponse } from "../types/api.js";
import type { Track, CursorResult } from "../types/models.js";

export const SearchTracks = (
  token: string,
  text: string,
  pageNumber?: number
): Promise<CursorResult<Track>> => {
  return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
    {
      path: `/tracks?q=${text}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`,
      method: "GET",
      token,
    },
    SCApiTrackArrayToTSDTrackArrayCursor
  );
};
