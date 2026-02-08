import type { SCApiPlaylist, CursorResponse } from "../types/api.js";
import type { Playlist, CursorResult } from "../types/models.js";
import { FormatDate } from "../utils/date.js";
import { GetTags } from "../utils/tags.js";

export const SCApiPlaylistToTSDPlaylist = (
  playlist: SCApiPlaylist
): Playlist => {
  const now = new Date();
  return {
    id: `${playlist.id}_${FormatDate(now)}`,
    playlistId: `${playlist.id}`,
    userId: `${playlist.user_id}`,
    username: playlist.user?.username,
    userPermalink: playlist.user?.permalink,
    userAvatarUrl: playlist.user?.avatar_url,
    title: playlist.title,
    duration: playlist.duration,
    artworkUrl: playlist.artwork_url,
    permalink: playlist.permalink,
    trackCount: playlist.track_count,
    description: playlist.description,
    tags: GetTags(playlist.tag_list),
    likesCount: playlist.likes_count,
    createdSC: new Date(playlist.created_at),
    lastModifiedSC: new Date(playlist.last_modified),
    createdTSD: now,
  };
};

export const SCApiPlaylistArrayToTSDPlaylistArrayCursor = (
  playlistData: CursorResponse<SCApiPlaylist>
): CursorResult<Playlist> => {
  return {
    data: playlistData?.collection?.map((playlist) =>
      SCApiPlaylistToTSDPlaylist(playlist)
    ),
    cursor: playlistData.next_href,
  };
};
