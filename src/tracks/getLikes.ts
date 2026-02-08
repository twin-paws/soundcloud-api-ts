import { scFetchAndMap } from "../client/http.js";
import { SCApiUserArrayToTSDUserArrayCursor } from "../mappers/user.js";
import type { SCApiUser, CursorResponse } from "../types/api.js";
import type { SCUser, CursorResult } from "../types/models.js";

export const GetSCTrackLikes = (
  token: string,
  trackId: string,
  limit?: number
): Promise<CursorResult<SCUser>> => {
  return scFetchAndMap<CursorResult<SCUser>, CursorResponse<SCApiUser>>(
    {
      path: `/tracks/${trackId}/favoriters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`,
      method: "GET",
      token,
    },
    SCApiUserArrayToTSDUserArrayCursor
  );
};
