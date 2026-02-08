// Normalized TSD domain types (base types only — DB-specific variants stay in monorepo)

export interface Token {
  accessToken: string;
  refreshToken: string;
  type: string;
  created: string;
  expireTime: string;
}

export interface SCUserBase {
  id: string;
  userId: string;
  permalink: string;
  username: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  playlistCount: number;
  likeCount: number;
  trackCount: number;
  subscriptions: {
    id: string;
    name: string;
  }[];
}

export interface SCUser extends SCUserBase {
  tags?: string[];
  comments?: SCComment[];
  likesTracks?: Track[];
  artistTracks?: Track[];
  followers?: SCUser[];
  followings?: SCUser[];
  likesPlaylists?: PlaylistBase[];
  repostsPlaylists?: PlaylistBase[];
  playlists?: PlaylistBase[];
  createdSC: Date;
  lastModifiedSC: Date;
  createdTSD: Date;
}

export interface TrackBase {
  id: string;
  trackId: string;
  userId: string;
  userName: string;
  userPermalink: string;
  userAvatarUrl: string;
  title: string;
  description: string;
  duration: number;
  artWorkUrl: string;
  waveFormUrl: string;
  purchaseUrl: string;
  permalinkUrl: string;
  playbackCount: number;
  commentCount: number;
  repostsCount: number;
  likesCount: number;
  tags: string[];
}

export interface Track extends TrackBase {
  user?: SCUser;
  likes?: SCUser[];
  comments?: SCComment[];
  reposters?: SCUser[];
  relatedTracks?: Track[];
  createdSC: Date;
  createdTSD: Date;
}

export interface PlaylistBase {
  id: string;
  playlistId: string;
  userId: string;
  username?: string;
  userPermalink?: string;
  userAvatarUrl?: string;
  title: string;
  duration: number;
  artworkUrl: string;
  permalink: string;
  trackCount: number;
  description: string;
  tags: string[];
  likesCount: number;
  user?: SCUserBase;
}

export interface Playlist extends PlaylistBase {
  reposters?: SCUser[];
  tracks?: Track[];
  createdSC: Date;
  lastModifiedSC: Date;
  createdTSD: Date;
}

export interface SCComment {
  id: string;
  commentId: string;
  createdSC: Date;
  userId: string;
  trackId: string;
  body: string;
  timestamp: string;
  createdTSD: Date;
}

export interface CursorResult<T> {
  cursor: string;
  data: T[];
}

export interface SCSearchRequest {
  text: string;
  pageNumber?: number;
  cursor?: string;
  pageSize?: number;
}
