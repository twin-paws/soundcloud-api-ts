import { scFetchAndMap } from "../client/http.js";
import { SCApiPlaylistArrayToTSDPlaylistArrayCursor } from "../mappers/playlist.js";
import type { SCApiPlaylist, CursorResponse } from "../types/api.js";
import type { PlaylistBase, CursorResult } from "../types/models.js";

export const SearchPlaylists = (
  token: string,
  text: string,
  pageNumber?: number
): Promise<CursorResult<PlaylistBase>> => {
  return scFetchAndMap<CursorResult<PlaylistBase>, CursorResponse<SCApiPlaylist>>(
    {
      path: `/playlists?q=${text}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`,
      method: "GET",
      token,
    },
    SCApiPlaylistArrayToTSDPlaylistArrayCursor
  );
};
