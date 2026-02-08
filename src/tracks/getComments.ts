import { scFetchAndMap } from "../client/http.js";
import { SCApiCommentArrayToTSDCommentArrayCursor } from "../mappers/comment.js";
import type { SCApiComment, CursorResponse } from "../types/api.js";
import type { SCComment, CursorResult } from "../types/models.js";

export const GetSCTrackComments = (
  token: string,
  trackId: string,
  limit?: number
): Promise<CursorResult<SCComment>> => {
  return scFetchAndMap<CursorResult<SCComment>, CursorResponse<SCApiComment>>(
    {
      path: `/tracks/${trackId}/comments?threaded=1&filter_replies=0${limit ? `&limit=${limit}` : ""}&linked_partitioning=true`,
      method: "GET",
      token,
    },
    SCApiCommentArrayToTSDCommentArrayCursor
  );
};
