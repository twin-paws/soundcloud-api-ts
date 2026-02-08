import { scFetch } from "../client/http.js";
import type { SoundCloudActivitiesResponse } from "../types/api.js";

/** GET /me/activities */
export const getMeActivities = (token: string, limit?: number): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/activities?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/** GET /me/activities/all/own */
export const getMeActivitiesOwn = (token: string, limit?: number): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/activities/all/own?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/** GET /me/activities/tracks */
export const getMeActivitiesTracks = (token: string, limit?: number): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/activities/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
