/**
 * OAuth 2.0 token response returned by SoundCloud's `/oauth2/token` endpoint.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2/post_oauth2_token
 */
export interface SoundCloudToken {
  /** The OAuth 2.0 access token used to authenticate API requests */
  access_token: string;
  /** Number of seconds until the access token expires */
  expires_in: number;
  /** Token used to obtain a new access token when the current one expires */
  refresh_token: string;
  /** OAuth scope granted (e.g. "*" for full access) */
  scope: string;
  /** Token type, typically "bearer" */
  token_type: string;
}

/**
 * Represents a SoundCloud user profile.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id_
 */
export interface SoundCloudUser {
  /** URL to the user's avatar image */
  avatar_url: string;
  /** The user's city (may be empty string if not set) */
  city: string;
  /** The user's country (may be empty string if not set) */
  country: string;
  /** ISO 8601 timestamp of when the user account was created */
  created_at: string;
  /** The user's profile description / bio */
  description: string;
  /** The user's Discogs username, or null if not set */
  discogs_name: string | null;
  /** The user's first name */
  first_name: string;
  /** Total number of followers */
  followers_count: number;
  /** Total number of users this user is following */
  followings_count: number;
  /** The user's full name (first + last) */
  full_name: string;
  /** The user's unique numeric ID on SoundCloud */
  id: number;
  /** URN identifier (e.g. "soundcloud:users:123") */
  urn: string;
  /** Resource type, always "user" */
  kind: string;
  /** ISO 8601 timestamp of the last profile modification */
  last_modified: string;
  /** The user's last name */
  last_name: string;
  /** Total number of public likes (favorites) */
  likes_count: number;
  /** Whether the user is currently online */
  online: boolean;
  /** URL-friendly slug for the user's profile (e.g. "artist-name") */
  permalink: string;
  /** Full URL to the user's SoundCloud profile page */
  permalink_url: string;
  /** The user's subscription plan (e.g. "Free", "Pro") */
  plan: string;
  /** Total number of public playlists */
  playlist_count: number;
  /** Total number of public favorites */
  public_favorites_count: number;
  /** Total number of reposts */
  reposts_count: number;
  /** The user's active subscriptions */
  subscriptions: SoundCloudSubscription[];
  /** Total number of public tracks */
  track_count: number;
  /** API resource URI for this user */
  uri: string;
  /** The user's display name */
  username: string;
  /** The user's website URL, or null if not set */
  website: string | null;
  /** Display title for the user's website, or null if not set */
  website_title: string | null;
  /**
   * Comment count for this user.
   * @deprecated Always returns 0 in current API responses.
   */
  comments_count: number;
  /** The user's Myspace username, or null if not set */
  myspace_name: string | null;
}

/**
 * Extended user profile returned by the `/me` endpoint, including private account details.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me
 */
export interface SoundCloudMe extends SoundCloudUser {
  /** The user's locale setting (e.g. "en"), or null if not set */
  locale: string | null;
  /** Whether the user's primary email address has been confirmed */
  primary_email_confirmed: boolean;
  /** Number of private (unlisted) playlists */
  private_playlists_count: number;
  /** Number of private (unlisted) tracks */
  private_tracks_count: number;
  /** Upload quota information for the authenticated user */
  quota: SoundCloudQuota;
  /** Remaining upload time in seconds, or null if unlimited */
  upload_seconds_left: number | null;
}

/**
 * Upload quota details for the authenticated user.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me
 */
export interface SoundCloudQuota {
  /** Whether the user has an unlimited upload quota (e.g. Pro plan) */
  unlimited_upload_quota: boolean;
  /** Total upload time consumed in seconds */
  upload_seconds_used: number;
  /** Remaining upload time in seconds, or null if unlimited */
  upload_seconds_left: number | null;
}

/**
 * A subscription associated with a SoundCloud user account.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users
 */
export interface SoundCloudSubscription {
  /** The subscription product details */
  product: SoundCloudSubscriptionProduct;
  /** Whether the subscription auto-renews (may be absent) */
  recurring?: boolean;
}

/**
 * Product details for a SoundCloud subscription.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users
 */
export interface SoundCloudSubscriptionProduct {
  /** Unique product identifier (e.g. "creator-pro-unlimited") */
  id: string;
  /** Human-readable product name (e.g. "Pro Unlimited") */
  name: string;
}

/**
 * Represents a SoundCloud track (audio upload).
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id_
 */
export interface SoundCloudTrack {
  /** Access level for the track (e.g. "playable", "preview", "blocked") */
  access: string;
  /** URL to the track's artwork image (may be empty string if none) */
  artwork_url: string;
  /** ISO country codes where the track is available, or null if unrestricted */
  available_country_codes: string[] | null;
  /** Beats per minute of the track (0 if not set) */
  bpm: number;
  /** Total number of comments on this track */
  comment_count: number;
  /** Whether commenting is enabled on this track */
  commentable: boolean;
  /** ISO 8601 timestamp of when the track was uploaded */
  created_at: string;
  /** The track's description text */
  description: string;
  /** Total number of downloads */
  download_count: number;
  /** URL to download the original file (requires authentication) */
  download_url: string;
  /** Whether the track is downloadable */
  downloadable: boolean;
  /** Duration of the track in milliseconds */
  duration: number;
  /** Who can embed this track (e.g. "all", "me", "none") */
  embeddable_by: string;
  /** Total number of favorites/likes */
  favoritings_count: number;
  /** Music genre of the track (e.g. "Electronic") */
  genre: string;
  /** The track's unique numeric ID on SoundCloud */
  id: number;
  /** International Standard Recording Code, or null if not set */
  isrc: string | null;
  /** Musical key signature (e.g. "C major"), or null if not set */
  key_signature: string | null;
  /** Resource type, always "track" */
  kind: string;
  /** Record label name */
  label_name: string;
  /** Creative Commons license type (e.g. "all-rights-reserved", "cc-by") */
  license: string;
  /** Artist name when different from the uploader, or null */
  metadata_artist: string | null;
  /** Monetization model applied to this track, or null */
  monetization_model: string | null;
  /** Full URL to the track's SoundCloud page */
  permalink_url: string;
  /** Total number of plays */
  playback_count: number;
  /** Content policy applied to this track, or null */
  policy: string | null;
  /** Label for the purchase/buy button */
  purchase_title: string;
  /** External purchase URL */
  purchase_url: string;
  /** Release identifier string, or null */
  release: string | null;
  /** Day of the release date (1-31) */
  release_day: number;
  /** Month of the release date (1-12) */
  release_month: number;
  /** Year of the release date */
  release_year: number;
  /** Total number of reposts */
  reposts_count: number;
  /** Secret URI for private tracks, or null for public tracks */
  secret_uri: string | null;
  /** Sharing setting: "public" or "private" */
  sharing: string;
  /** URL to the audio stream (requires authentication) */
  stream_url: string;
  /** Whether the track is streamable */
  streamable: boolean;
  /** Space-separated list of tags (tags with spaces are wrapped in quotes) */
  tag_list: string;
  /** The track's title */
  title: string;
  /** API resource URI for this track */
  uri: string;
  /** URN identifier (e.g. "soundcloud:tracks:123") */
  urn: string;
  /** The user who uploaded this track */
  user: SoundCloudUser;
  /** Whether the authenticated user has liked this track */
  user_favorite: boolean;
  /** Number of times the authenticated user has played this track, or null */
  user_playback_count: number | null;
  /** URL to the track's waveform image data */
  waveform_url: string;
}

/**
 * Represents a SoundCloud playlist (also known as a "set").
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists__playlist_id_
 */
export interface SoundCloudPlaylist {
  /** URL to the playlist's artwork image */
  artwork_url: string;
  /** ISO 8601 timestamp of when the playlist was created */
  created_at: string;
  /** The playlist's description text */
  description: string;
  /** Whether tracks in the playlist are downloadable */
  downloadable: boolean;
  /** Total duration of all tracks in the playlist in milliseconds */
  duration: number;
  /** European Article Number (barcode) for the release */
  ean: string;
  /** Who can embed this playlist (e.g. "all", "me", "none") */
  embeddable_by: string;
  /** Music genre of the playlist */
  genre: string;
  /** The playlist's unique numeric ID on SoundCloud */
  id: number;
  /** Resource type, always "playlist" */
  kind: string;
  /** Label user object, or null if no label is associated */
  label: SoundCloudUser | null;
  /** Numeric ID of the associated label, or null */
  label_id: number | null;
  /** Name of the associated record label */
  label_name: string;
  /** ISO 8601 timestamp of the last modification */
  last_modified: string;
  /** Creative Commons license type */
  license: string;
  /** Total number of likes on this playlist */
  likes_count: number;
  /** URL-friendly slug for the playlist */
  permalink: string;
  /** Full URL to the playlist's SoundCloud page */
  permalink_url: string;
  /** Type of playlist (e.g. "album", "ep", "compilation") */
  playlist_type: string;
  /** Label for the purchase/buy button */
  purchase_title: string;
  /** External purchase URL */
  purchase_url: string;
  /** Release identifier string */
  release: string;
  /** Day of the release date (1-31) */
  release_day: number;
  /** Month of the release date (1-12) */
  release_month: number;
  /** Year of the release date */
  release_year: number;
  /** Sharing setting: "public" or "private" */
  sharing: string;
  /** Whether the playlist contains streamable tracks */
  streamable: boolean;
  /** Space-separated list of tags */
  tag_list: string;
  /** Comma-separated tags string, or null */
  tags: string | null;
  /** The playlist's title */
  title: string;
  /** Total number of tracks in the playlist */
  track_count: number;
  /** Array of tracks in the playlist (may be empty if not fetched) */
  tracks: SoundCloudTrack[];
  /** API URI to fetch the playlist's tracks, or null */
  tracks_uri: string | null;
  /** Playlist set type (e.g. "album", "playlist") */
  type: string;
  /** API resource URI for this playlist */
  uri: string;
  /** URN identifier (e.g. "soundcloud:playlists:123") */
  urn: string;
  /** The user who created this playlist */
  user: SoundCloudUser;
  /** Numeric ID of the playlist creator */
  user_id: number;
  /** URN of the playlist creator */
  user_urn: string;
}

/**
 * Represents a comment on a SoundCloud track.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__comments
 */
export interface SoundCloudComment {
  /** The comment text body */
  body: string;
  /** ISO 8601 timestamp of when the comment was posted */
  created_at: string;
  /** The comment's unique numeric ID */
  id: number;
  /** Resource type, always "comment" */
  kind: string;
  /** Position in the track's waveform in milliseconds where the comment was placed */
  timestamp: number;
  /** URN of the track this comment belongs to */
  track_urn: string;
  /** API resource URI for this comment */
  uri: string;
  /** URN identifier for this comment */
  urn: string;
  /** The user who posted this comment */
  user: SoundCloudCommentUser;
  /** URN of the user who posted this comment */
  user_urn: string;
}

/**
 * Minimal user object embedded in comment responses.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__comments
 */
export interface SoundCloudCommentUser {
  /** URL to the user's avatar image */
  avatar_url: string;
  /** Total number of followers */
  followers_count: number;
  /** Total number of users this user is following */
  followings_count: number;
  /** Resource type, always "user" */
  kind: string;
  /** ISO 8601 timestamp of the last profile modification */
  last_modified: string;
  /** URL-friendly slug for the user's profile */
  permalink: string;
  /** Full URL to the user's SoundCloud profile page */
  permalink_url: string;
  /** Total number of reposts */
  reposts_count: number;
  /** API resource URI for this user */
  uri: string;
  /** URN identifier for this user */
  urn: string;
  /** The user's display name */
  username: string;
}

/**
 * Stream URLs for a SoundCloud track, containing various format options.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__streams
 */
export interface SoundCloudStreams {
  /** HLS stream URL for AAC at 160kbps (may be undefined if unavailable) */
  hls_aac_160_url?: string;
  /** HLS stream URL for MP3 at 128kbps (may be undefined if unavailable) */
  hls_mp3_128_url?: string;
  /**
   * Direct HTTP MP3 stream URL at 128kbps.
   * @deprecated Use HLS URLs instead; this field may not be available for all tracks.
   */
  http_mp3_128_url?: string;
  /** Preview MP3 stream URL at 128kbps for non-full-access tracks (may be undefined) */
  preview_mp3_128_url?: string;
}

/**
 * An external web profile / link displayed on a user's SoundCloud page.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/users/get_users__user_id__web_profiles
 */
export interface SoundCloudWebProfile {
  /** ISO 8601 timestamp of when the web profile link was created */
  created_at: string;
  /** Resource type, always "web-profile" */
  kind: string;
  /** Service name (e.g. "twitter", "instagram", "personal") */
  service: string;
  /** Display title for this link */
  title: string;
  /** The external URL */
  url: string;
  /** URN identifier for this web profile entry */
  urn: string;
  /** Username on the external service */
  username: string;
}

/**
 * A single activity item from the user's activity feed.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities
 */
export interface SoundCloudActivity {
  /** Type of activity (e.g. "track", "track-repost", "playlist") */
  type: string;
  /** ISO 8601 timestamp of when the activity occurred */
  created_at: string;
  /** The track or playlist that is the subject of this activity */
  origin: SoundCloudTrack | SoundCloudPlaylist;
}

/**
 * Response from the activities endpoints, with polling support via `future_href`.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_activities
 */
export interface SoundCloudActivitiesResponse {
  /** Array of activity items in this page */
  collection: SoundCloudActivity[];
  /** URL to fetch the next page of older activities */
  next_href: string;
  /** URL to poll for new activities since this response */
  future_href: string;
}

/**
 * Generic cursor-paginated response from the SoundCloud API.
 * Most list endpoints return this shape with `collection` and `next_href`.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api
 */
export interface SoundCloudPaginatedResponse<T> {
  /** Array of items in this page */
  collection: T[];
  /** URL to fetch the next page, or null/empty when there are no more pages */
  next_href: string;
}
