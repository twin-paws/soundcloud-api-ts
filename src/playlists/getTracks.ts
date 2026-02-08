import { scFetchAndMap } from "../client/http.js";
import { SCApiTrackArrayToTSDTrackArrayCursor } from "../mappers/track.js";
import type { SCApiTrack, CursorResponse } from "../types/api.js";
import type { Track, CursorResult } from "../types/models.js";

export const GetSCPlaylistTracks = (
  token: string,
  playlistId: string,
  limit?: number,
  offset?: number
): Promise<CursorResult<Track>> => {
  return scFetchAndMap<CursorResult<Track>, CursorResponse<SCApiTrack>>(
    {
      path: `/playlists/${playlistId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true${offset ? `&offset=${offset}` : ""}`,
      method: "GET",
      token,
    },
    SCApiTrackArrayToTSDTrackArrayCursor
  );
};
