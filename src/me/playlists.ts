import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/** GET /me/playlists */
export const getMePlaylists = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({ path: `/me/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
