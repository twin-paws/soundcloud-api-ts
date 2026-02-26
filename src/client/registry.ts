/**
 * List of operation IDs currently implemented by soundcloud-api-ts.
 * Used for OpenAPI coverage reporting.
 */
export const IMPLEMENTED_OPERATIONS: string[] = [
  // Auth
  "post_oauth2_token",
  "delete_oauth2_token",

  // Me
  "get_me",
  "get_me_activities",
  "get_me_activities_own",
  "get_me_activities_tracks",
  "get_me_likes_tracks",
  "get_me_likes_playlists",
  "get_me_followings",
  "get_me_followings_tracks",
  "post_me_followings_user_id",
  "delete_me_followings_user_id",
  "get_me_followers",
  "get_me_playlists",
  "get_me_tracks",

  // Users
  "get_users_user_id",
  "get_users_user_id_followers",
  "get_users_user_id_followings",
  "get_users_user_id_tracks",
  "get_users_user_id_playlists",
  "get_users_user_id_likes_tracks",
  "get_users_user_id_likes_playlists",
  "get_users_user_id_web_profiles",

  // Tracks
  "get_tracks_track_id",
  "put_tracks_track_id",
  "delete_tracks_track_id",
  "get_tracks_track_id_comments",
  "post_tracks_track_id_comments",
  "get_tracks_track_id_likes",
  "get_tracks_track_id_reposts",
  "get_tracks_track_id_related",
  "get_tracks_track_id_streams",
  "post_likes_tracks_track_id",
  "delete_likes_tracks_track_id",
  "post_reposts_tracks_track_id",
  "delete_reposts_tracks_track_id",

  // Playlists
  "get_playlists_playlist_id",
  "post_playlists",
  "put_playlists_playlist_id",
  "delete_playlists_playlist_id",
  "get_playlists_playlist_id_tracks",
  "get_playlists_playlist_id_reposts",
  "post_likes_playlists_playlist_id",
  "delete_likes_playlists_playlist_id",
  "post_reposts_playlists_playlist_id",
  "delete_reposts_playlists_playlist_id",

  // Search
  "get_tracks",
  "get_users",
  "get_playlists",

  // Resolve
  "get_resolve",
];
