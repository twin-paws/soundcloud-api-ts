import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch tracks uploaded by the authenticated user.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of tracks per page
 * @returns Paginated list of the user's tracks
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getMeTracks } from 'soundcloud-api-ts';
 *
 * const result = await getMeTracks(token, 50);
 * result.collection.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_tracks
 */
export const getMeTracks = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/me/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
