import type { SCApiUser, CursorResponse } from "../types/api.js";
import type { SCUser, CursorResult } from "../types/models.js";
import { FormatDate } from "../utils/date.js";

export const SCApiUserToTSDUser = (user: SCApiUser): SCUser => {
  const now = new Date();
  return {
    id: `${user.id}_${FormatDate(now)}`,
    userId: `${user.id}`,
    permalink: user.permalink,
    username: user.username,
    avatarUrl: user.avatar_url,
    followerCount: user.followers_count,
    followingCount: user.followings_count,
    playlistCount: user.playlist_count,
    likeCount: user.public_favorites_count,
    trackCount: user.track_count,
    subscriptions: user.subscriptions?.map((product) => ({
      id: product.product.id,
      name: product.product.name,
    })),
    lastModifiedSC: new Date(user.last_modified),
    createdSC: new Date(user.created_at),
    createdTSD: now,
  };
};

export const SCApiUserArrayToTSDUserArray = (users: SCApiUser[]): SCUser[] => {
  return users?.map((user) => SCApiUserToTSDUser(user));
};

export const SCApiUserArrayToTSDUserArrayCursor = (
  userData: CursorResponse<SCApiUser>
): CursorResult<SCUser> => {
  return {
    data: userData?.collection?.map((user) => SCApiUserToTSDUser(user)),
    cursor: userData.next_href,
  };
};
