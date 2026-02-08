import { scFetch } from "../client/http.js";

/** POST /likes/tracks/:id */
export const likeTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "POST", token }); return true; } catch { return false; }
};

/** DELETE /likes/tracks/:id */
export const unlikeTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token }); return true; } catch { return false; }
};

/** POST /likes/playlists/:id */
export const likePlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "POST", token }); return true; } catch { return false; }
};

/** DELETE /likes/playlists/:id */
export const unlikePlaylist = async (token: string, playlistId: string | number): Promise<boolean> => {
  try { await scFetch<unknown>({ path: `/likes/playlists/${playlistId}`, method: "DELETE", token }); return true; } catch { return false; }
};
