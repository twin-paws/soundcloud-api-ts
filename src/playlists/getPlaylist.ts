import { scFetchAndMap } from "../client/http.js";
import { SCApiPlaylistToTSDPlaylist } from "../mappers/playlist.js";
import type { SCApiPlaylist } from "../types/api.js";
import type { Playlist } from "../types/models.js";

export const GetSCPlaylistWithId = (token: string, playlistId: string): Promise<Playlist> => {
  return scFetchAndMap<Playlist, SCApiPlaylist>(
    { path: `/playlists/${playlistId}`, method: "GET", token },
    SCApiPlaylistToTSDPlaylist
  );
};
