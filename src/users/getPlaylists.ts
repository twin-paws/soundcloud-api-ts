import { scFetchAndMap } from "../client/http.js";
import { SCApiPlaylistArrayToTSDPlaylistArrayCursor } from "../mappers/playlist.js";
import type { SCApiPlaylist, CursorResponse } from "../types/api.js";
import type { PlaylistBase, CursorResult } from "../types/models.js";

export const GetSCUserPlaylists = (
  token: string,
  userId: string,
  limit?: number
): Promise<CursorResult<PlaylistBase>> => {
  return scFetchAndMap<CursorResult<PlaylistBase>, CursorResponse<SCApiPlaylist>>(
    {
      path: `/users/${userId}/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true&show_tracks=false`,
      method: "GET",
      token,
    },
    SCApiPlaylistArrayToTSDPlaylistArrayCursor
  );
};
