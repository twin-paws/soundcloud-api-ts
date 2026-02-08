// Client
export { SoundCloudClient } from "./client/SoundCloudClient.js";
export type { SoundCloudClientConfig } from "./client/SoundCloudClient.js";
export { scFetch } from "./client/http.js";
export type { RequestOptions } from "./client/http.js";

// Types
export type {
  SoundCloudToken,
  SoundCloudUser,
  SoundCloudMe,
  SoundCloudQuota,
  SoundCloudSubscription,
  SoundCloudSubscriptionProduct,
  SoundCloudTrack,
  SoundCloudPlaylist,
  SoundCloudComment,
  SoundCloudCommentUser,
  SoundCloudStreams,
  SoundCloudWebProfile,
  SoundCloudActivity,
  SoundCloudActivitiesResponse,
  SoundCloudPaginatedResponse,
} from "./types/api.js";

// Auth
export { getClientToken, getUserToken, refreshUserToken, signOut, getAuthorizationUrl, generateCodeVerifier, generateCodeChallenge } from "./auth/index.js";

// Users
export { getMe, getUser, getFollowers, getFollowings, getUserTracks, getUserPlaylists, getUserLikesTracks, getUserLikesPlaylists, getUserWebProfiles } from "./users/index.js";

// Tracks
export { getTrack, getTrackComments, createTrackComment, getTrackLikes, getTrackReposts, getRelatedTracks, getTrackStreams, likeTrack, unlikeTrack, updateTrack, deleteTrack } from "./tracks/index.js";
export type { UpdateTrackParams } from "./tracks/index.js";

// Playlists
export { getPlaylist, getPlaylistTracks, getPlaylistReposts, createPlaylist, updatePlaylist, deletePlaylist } from "./playlists/index.js";
export type { CreatePlaylistParams, UpdatePlaylistParams } from "./playlists/index.js";

// Search
export { searchTracks, searchUsers, searchPlaylists } from "./search/index.js";

// Resolve
export { resolveUrl } from "./resolve/index.js";

// Me (authenticated user endpoints)
export { getMeActivities, getMeActivitiesOwn, getMeActivitiesTracks, getMeLikesTracks, getMeLikesPlaylists, getMeFollowings, getMeFollowingsTracks, followUser, unfollowUser, getMeFollowers, getMePlaylists, getMeTracks } from "./me/index.js";

// Likes (likeTrack/unlikeTrack already exported from tracks)
export { likePlaylist, unlikePlaylist } from "./likes/index.js";

// Reposts
export { repostTrack, unrepostTrack, repostPlaylist, unrepostPlaylist } from "./reposts/index.js";

// Utils
export { getSoundCloudWidgetUrl } from "./utils/index.js";
