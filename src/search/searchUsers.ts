import { scFetchAndMap } from "../client/http.js";
import { SCApiUserArrayToTSDUserArrayCursor } from "../mappers/user.js";
import type { SCApiUser, CursorResponse } from "../types/api.js";
import type { SCUserBase, CursorResult } from "../types/models.js";

export const SearchUsers = (
  token: string,
  text: string,
  pageNumber?: number
): Promise<CursorResult<SCUserBase>> => {
  return scFetchAndMap<CursorResult<SCUserBase>, CursorResponse<SCApiUser>>(
    {
      path: `/users?q=${text}&linked_partitioning=true&limit=10${pageNumber && pageNumber > 0 ? `&offset=${10 * pageNumber}` : ""}`,
      method: "GET",
      token,
    },
    SCApiUserArrayToTSDUserArrayCursor
  );
};
