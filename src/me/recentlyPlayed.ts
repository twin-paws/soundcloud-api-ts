import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Last 25 recently played tracks. No pagination or `limit` (per official spec).
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const getMeRecentlyPlayedTracks = async (
  token: string,
  access?: string,
): Promise<SoundCloudTrack[]> => {
  const q = access ? `?access=${encodeURIComponent(access)}` : "";
  const data = await scFetch<SoundCloudTrack[] | SoundCloudPaginatedResponse<SoundCloudTrack>>({
    path: `/me/recently-played/tracks${q}`,
    method: "GET",
    token,
  });
  return Array.isArray(data) ? data : (data.collection ?? []);
};
