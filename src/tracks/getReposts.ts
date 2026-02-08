import { scFetchAndMap } from "../client/http.js";
import { SCApiUserArrayToTSDUserArrayCursor } from "../mappers/user.js";
import type { SCApiUser, CursorResponse } from "../types/api.js";
import type { SCUserBase, CursorResult } from "../types/models.js";

export const GetSCTrackReposts = (
  token: string,
  trackId: string,
  limit?: number
): Promise<CursorResult<SCUserBase>> => {
  return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
    {
      path: `/tracks/${trackId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
      method: "GET",
      token,
    },
    SCApiUserArrayToTSDUserArrayCursor
  );
};
