import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/** GET /me/tracks */
export const getMeTracks = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/me/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
