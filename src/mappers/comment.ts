import type { SCApiComment, CursorResponse } from "../types/api.js";
import type { SCComment, CursorResult } from "../types/models.js";
import { FormatDate } from "../utils/date.js";

export const SCApiCommentToTSDComment = (comment: SCApiComment): SCComment => {
  const now = new Date();
  return {
    id: `${comment.id}_${FormatDate(now)}`,
    commentId: comment.id,
    createdSC: new Date(comment.created_at),
    userId: comment.user_id,
    trackId: comment.track_id,
    body: comment.body,
    timestamp: comment.timestamp,
    createdTSD: now,
  };
};

export const SCApiCommentArrayToTSDCommentArrayCursor = (
  commentData: CursorResponse<SCApiComment>
): CursorResult<SCComment> => {
  return {
    data: commentData?.collection?.map((comment) =>
      SCApiCommentToTSDComment(comment)
    ),
    cursor: commentData.next_href,
  };
};
