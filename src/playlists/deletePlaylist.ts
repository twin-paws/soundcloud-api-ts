import { scFetch } from "../client/http.js";

/** DELETE /playlists/:id — deletes a playlist */
export const deletePlaylist = (token: string, playlistId: string | number): Promise<void> =>
  scFetch<void>({ path: `/playlists/${playlistId}`, method: "DELETE", token });
