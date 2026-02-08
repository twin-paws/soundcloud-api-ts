/** OAuth token response from SoundCloud */
export interface SoundCloudToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

/** SoundCloud user profile */
export interface SoundCloudUser {
  avatar_url: string;
  city: string;
  country: string;
  created_at: string;
  description: string;
  discogs_name: string | null;
  first_name: string;
  followers_count: number;
  followings_count: number;
  full_name: string;
  id: number;
  /** URN identifier (e.g. "soundcloud:users:123") */
  urn: string;
  kind: string;
  last_modified: string;
  last_name: string;
  likes_count: number;
  online: boolean;
  permalink: string;
  permalink_url: string;
  plan: string;
  playlist_count: number;
  public_favorites_count: number;
  reposts_count: number;
  subscriptions: SoundCloudSubscription[];
  track_count: number;
  uri: string;
  username: string;
  website: string | null;
  website_title: string | null;
  /** @deprecated — always returns 0 */
  comments_count: number;
  myspace_name: string | null;
}

/** Extended user info returned by /me */
export interface SoundCloudMe extends SoundCloudUser {
  locale: string | null;
  primary_email_confirmed: boolean;
  private_playlists_count: number;
  private_tracks_count: number;
  quota: SoundCloudQuota;
  upload_seconds_left: number | null;
}

export interface SoundCloudQuota {
  unlimited_upload_quota: boolean;
  upload_seconds_used: number;
  upload_seconds_left: number | null;
}

export interface SoundCloudSubscription {
  product: SoundCloudSubscriptionProduct;
  recurring?: boolean;
}

export interface SoundCloudSubscriptionProduct {
  id: string;
  name: string;
}

/** SoundCloud track */
export interface SoundCloudTrack {
  access: string;
  artwork_url: string;
  available_country_codes: string[] | null;
  bpm: number;
  comment_count: number;
  commentable: boolean;
  created_at: string;
  description: string;
  download_count: number;
  download_url: string;
  downloadable: boolean;
  duration: number;
  embeddable_by: string;
  favoritings_count: number;
  genre: string;
  id: number;
  isrc: string | null;
  key_signature: string | null;
  kind: string;
  label_name: string;
  license: string;
  /** Optional artist name when different from user */
  metadata_artist: string | null;
  monetization_model: string | null;
  permalink_url: string;
  playback_count: number;
  policy: string | null;
  purchase_title: string;
  purchase_url: string;
  release: string | null;
  release_day: number;
  release_month: number;
  release_year: number;
  reposts_count: number;
  secret_uri: string | null;
  sharing: string;
  stream_url: string;
  streamable: boolean;
  tag_list: string;
  title: string;
  uri: string;
  /** URN identifier (e.g. "soundcloud:tracks:123") */
  urn: string;
  user: SoundCloudUser;
  user_favorite: boolean;
  user_playback_count: number | null;
  waveform_url: string;
}

/** SoundCloud playlist / set */
export interface SoundCloudPlaylist {
  artwork_url: string;
  created_at: string;
  description: string;
  downloadable: boolean;
  duration: number;
  ean: string;
  embeddable_by: string;
  genre: string;
  id: number;
  kind: string;
  label: SoundCloudUser | null;
  label_id: number | null;
  label_name: string;
  last_modified: string;
  license: string;
  likes_count: number;
  permalink: string;
  permalink_url: string;
  playlist_type: string;
  purchase_title: string;
  purchase_url: string;
  release: string;
  release_day: number;
  release_month: number;
  release_year: number;
  sharing: string;
  streamable: boolean;
  tag_list: string;
  tags: string | null;
  title: string;
  track_count: number;
  tracks: SoundCloudTrack[];
  tracks_uri: string | null;
  type: string;
  uri: string;
  /** URN identifier (e.g. "soundcloud:playlists:123") */
  urn: string;
  user: SoundCloudUser;
  user_id: number;
  user_urn: string;
}

/** SoundCloud comment */
export interface SoundCloudComment {
  body: string;
  created_at: string;
  id: number;
  kind: string;
  timestamp: number;
  track_urn: string;
  uri: string;
  urn: string;
  user: SoundCloudCommentUser;
  user_urn: string;
}

/** Minimal user object embedded in comments */
export interface SoundCloudCommentUser {
  avatar_url: string;
  followers_count: number;
  followings_count: number;
  kind: string;
  last_modified: string;
  permalink: string;
  permalink_url: string;
  reposts_count: number;
  uri: string;
  urn: string;
  username: string;
}

/** Stream URLs for a track */
export interface SoundCloudStreams {
  hls_aac_160_url?: string;
  hls_mp3_128_url?: string;
  /** @deprecated */
  http_mp3_128_url?: string;
  preview_mp3_128_url?: string;
}

/** Web profile / external link on a user's profile */
export interface SoundCloudWebProfile {
  created_at: string;
  kind: string;
  service: string;
  title: string;
  url: string;
  urn: string;
  username: string;
}

/** Activity item */
export interface SoundCloudActivity {
  type: string;
  created_at: string;
  origin: SoundCloudTrack | SoundCloudPlaylist;
}

/** Activities response with future_href */
export interface SoundCloudActivitiesResponse {
  collection: SoundCloudActivity[];
  next_href: string;
  future_href: string;
}

/** Cursor-paginated response from SoundCloud */
export interface SoundCloudPaginatedResponse<T> {
  collection: T[];
  next_href: string;
}
