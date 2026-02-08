import { scFetch } from "../client/http.js";

/** POST /reposts/tracks/:id */
export const repostTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "POST", token }); return true; } catch { return false; }
};

/** DELETE /reposts/tracks/:id */
export const unrepostTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/tracks/${trackId}`, method: "DELETE", token }); return true; } catch { return false; }
};

/** POST /reposts/playlists/:id */
export const repostPlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "POST", token }); return true; } catch { return false; }
};

/** DELETE /reposts/playlists/:id */
export const unrepostPlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/reposts/playlists/${playlistId}`, method: "DELETE", token }); return true; } catch { return false; }
};
