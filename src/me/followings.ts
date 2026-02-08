import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/** GET /me/followings */
export const getMeFollowings = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/me/followings?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/** GET /me/followings/tracks */
export const getMeFollowingsTracks = (token: string, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/me/followings/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });

/** PUT /me/followings/:user_urn — follow a user */
export const followUser = (token: string, userUrn: string | number): Promise<void> =>
  scFetch<void>({ path: `/me/followings/${userUrn}`, method: "PUT", token });

/** DELETE /me/followings/:user_urn — unfollow a user */
export const unfollowUser = (token: string, userUrn: string | number): Promise<void> =>
  scFetch<void>({ path: `/me/followings/${userUrn}`, method: "DELETE", token });
