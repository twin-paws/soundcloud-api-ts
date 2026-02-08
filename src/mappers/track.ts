import type { SCApiTrack, CursorResponse } from "../types/api.js";
import type { Track, CursorResult } from "../types/models.js";
import { FormatDate } from "../utils/date.js";
import { GetTags } from "../utils/tags.js";

export const SCApiTrackToTSDTrack = (track: SCApiTrack): Track => {
  const now = new Date();
  return {
    id: `${track.id}_${FormatDate(now)}`,
    trackId: `${track.id}`,
    userId: track.user ? `${track.user.id}` : "",
    userName: track.user ? track.user.username : "",
    userPermalink: track.user ? track.user.permalink : "",
    userAvatarUrl: track.user ? track.user.avatar_url : "",
    title: track.title,
    description: track.description,
    duration: track.duration,
    artWorkUrl: track.artwork_url,
    waveFormUrl: track.waveform_url,
    purchaseUrl: track.purchase_url,
    permalinkUrl: track.permalink_url,
    playbackCount: track.playback_count,
    commentCount: track.comment_count,
    repostsCount: track.reposts_count,
    likesCount: track.favoritings_count,
    tags: GetTags(track.tag_list),
    createdSC: new Date(track.created_at),
    createdTSD: now,
  };
};

export const SCApiTrackArrayToTSDTrackArray = (
  tracks: SCApiTrack[]
): Track[] => {
  return tracks?.map((track) => SCApiTrackToTSDTrack(track));
};

export const SCApiTrackArrayToTSDTrackArrayCursor = (
  trackData: CursorResponse<SCApiTrack>
): CursorResult<Track> => {
  return {
    data: trackData?.collection?.map((track) => SCApiTrackToTSDTrack(track)),
    cursor: trackData.next_href,
  };
};
