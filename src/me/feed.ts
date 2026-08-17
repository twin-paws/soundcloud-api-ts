import { scFetch } from "../client/http.js";
import type { SoundCloudActivitiesResponse } from "../types/api.js";

function feedQuery(limit?: number, access?: string): string {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (access) params.set("access", access);
  const q = params.toString();
  return q ? `?${q}` : "";
}

/**
 * Current activity feed (`GET /me/feed`). Replaces deprecated `/me/activities`.
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const getMeFeed = (token: string, limit?: number, access?: string): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/feed${feedQuery(limit, access)}`, method: "GET", token });

/**
 * Track-related feed (`GET /me/feed/tracks`). Replaces deprecated `/me/activities/tracks`.
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const getMeFeedTracks = (token: string, limit?: number, access?: string): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/feed/tracks${feedQuery(limit, access)}`, method: "GET", token });
