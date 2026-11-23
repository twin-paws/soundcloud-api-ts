import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPlaylist, SoundCloudSystemPlaylist, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch tracks liked by the authenticated user.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of tracks per page
 * @returns Paginated list of liked tracks
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getMeLikesTracks } from 'soundcloud-api-ts';
 *
 * const result = await getMeLikesTracks(token, 50);
 * result.collection.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_likes_tracks
 */
export const getMeLikesTracks = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/me/likes/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/**
 * Fetch playlists liked by the authenticated user.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of playlists per page
 * @returns Paginated list of liked playlists
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getMeLikesPlaylists } from 'soundcloud-api-ts';
 *
 * const result = await getMeLikesPlaylists(token, 50);
 * result.collection.forEach(p => console.log(p.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_likes_playlists
 */
export const getMeLikesPlaylists = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudPlaylist>> =>
  scFetch({ path: `/me/likes/playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/**
 * Fetch system playlists (stations) liked by the authenticated user.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of system playlists per page
 * @returns Paginated list of liked system playlists
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getMeLikesSystemPlaylists } from 'soundcloud-api-ts';
 *
 * const result = await getMeLikesSystemPlaylists(token, 50);
 * result.collection.forEach(s => console.log(s.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me
 */
export const getMeLikesSystemPlaylists = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudSystemPlaylist>> =>
  scFetch({ path: `/me/likes/system-playlists?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
