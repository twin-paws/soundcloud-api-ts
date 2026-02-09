import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch users the authenticated user is following.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of users per page
 * @returns Paginated list of followed users
 * @throws {SoundCloudError} When the API returns an error
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_followings
 */
export const getMeFollowings = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/me/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/**
 * Fetch recent tracks from users the authenticated user is following.
 *
 * @param token - OAuth access token
 * @param limit - Maximum number of tracks per page
 * @returns Paginated list of tracks from followed users
 * @throws {SoundCloudError} When the API returns an error
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_followings_tracks
 */
export const getMeFollowingsTracks = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/me/followings/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/**
 * Follow a user as the authenticated user.
 *
 * @param token - OAuth access token
 * @param userUrn - The user's ID or URN to follow
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { followUser } from 'tsd-soundcloud';
 *
 * await followUser(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/put_me_followings__user_id_
 */
export const followUser = (token: string, userUrn: string | number): Promise<void> =>
  scFetch<void>({ path: `/me/followings/${userUrn}`, method: "PUT", token });

/**
 * Unfollow a user as the authenticated user.
 *
 * @param token - OAuth access token
 * @param userUrn - The user's ID or URN to unfollow
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { unfollowUser } from 'tsd-soundcloud';
 *
 * await unfollowUser(token, 123456);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/delete_me_followings__user_id_
 */
export const unfollowUser = (token: string, userUrn: string | number): Promise<void> =>
  scFetch<void>({ path: `/me/followings/${userUrn}`, method: "DELETE", token });
