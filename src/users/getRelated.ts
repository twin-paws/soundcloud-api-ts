import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Related artist recommendations for a user.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__related
 */
export const getRelatedUsers = (
  token: string,
  userId: string | number,
  limit?: number,
): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> => {
  const params = new URLSearchParams({ linked_partitioning: "true" });
  if (limit !== undefined) params.set("limit", String(limit));
  return scFetch({ path: `/users/${userId}/related?${params}`, method: "GET", token });
};
