import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/** GET /me/followers */
export const getMeFollowers = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/me/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
