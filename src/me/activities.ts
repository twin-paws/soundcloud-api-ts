import { scFetch } from "../client/http.js";
import type { SoundCloudActivitiesResponse } from "../types/api.js";

/**
 * Fetch the authenticated user's activity feed.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of activities per page
 * @returns Activities response with `future_href` for polling
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getMeActivities } from 'tsd-soundcloud';
 *
 * const activities = await getMeActivities(token, 25);
 * activities.collection.forEach(a => console.log(a.type));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities
 */
export const getMeActivities = (token: string, limit?: number): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/activities?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/**
 * Fetch the authenticated user's own activities (uploads, reposts by the user).
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of activities per page
 * @returns Activities response
 * @throws {SoundCloudError} When the API returns an error
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities_all_own
 */
export const getMeActivitiesOwn = (token: string, limit?: number): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/activities/all/own?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/**
 * Fetch track-related activities in the authenticated user's feed.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of activities per page
 * @returns Activities response filtered to track activities
 * @throws {SoundCloudError} When the API returns an error
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities_tracks
 */
export const getMeActivitiesTracks = (token: string, limit?: number): Promise<SoundCloudActivitiesResponse> =>
  scFetch({ path: `/me/activities/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
