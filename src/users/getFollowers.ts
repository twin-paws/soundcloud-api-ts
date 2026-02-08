import { scFetchAndMap } from "../client/http.js";
import { SCApiUserArrayToTSDUserArrayCursor } from "../mappers/user.js";
import type { SCApiUser, CursorResponse } from "../types/api.js";
import type { SCUserBase, CursorResult } from "../types/models.js";

export const GetSCUserFollowers = (
  token: string,
  userId: string,
  limit?: number
): Promise<CursorResult<SCUserBase>> => {
  return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
    {
      path: `/users/${userId}/followers?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
      method: "GET",
      token,
    },
    SCApiUserArrayToTSDUserArrayCursor
  );
};
