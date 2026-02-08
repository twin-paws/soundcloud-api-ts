// Raw SoundCloud API response types

export interface SCApiClientToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface SCApiUser {
  avatar_url: string;
  id: number;
  kind: string;
  permalink_url: string;
  uri: string;
  username: string;
  permalink: string;
  created_at: string;
  last_modified: string;
  first_name: string;
  last_name: string;
  full_name: string;
  city: string;
  description: string;
  country: string;
  track_count: number;
  public_favorites_count: number;
  reposts_count: number;
  followers_count: number;
  followings_count: number;
  plan: string;
  myspace_name: null;
  discogs_name: null;
  website_title: null;
  website: null;
  comments_count: number;
  online: boolean;
  likes_count: number;
  playlist_count: number;
  subscriptions: SCApiUserSubscription[];
}

export interface SCApiUserSubscription {
  product: SCApiUserSubscriptionProduct;
}

export interface SCApiUserSubscriptionProduct {
  id: string;
  name: string;
}

export interface SCApiTrack {
  kind: string;
  id: number;
  created_at: string;
  duration: number;
  commentable: boolean;
  comment_count: number;
  sharing: string;
  tag_list: string;
  streamable: boolean;
  embeddable_by: string;
  purchase_url: string;
  purchase_title: string;
  getre: string;
  title: string;
  description: string;
  label_name: string;
  release: null;
  key_signature: null;
  isrc: null;
  bpm: number;
  release_year: number;
  release_month: number;
  release_day: number;
  license: string;
  uri: string;
  user: SCApiUser;
  permalink_url: string;
  artwork_url: string;
  stream_url: string;
  download_url: string;
  waveform_url: string;
  available_country_codes: null;
  secret_uri: null;
  user_favorite: boolean;
  user_playback_count: null;
  playback_count: number;
  download_count: number;
  favoritings_count: number;
  reposts_count: number;
  downloadable: boolean;
  access: string;
  policy: null;
  monetization_model: null;
}

export interface SCApiPlaylist {
  duration: number;
  genre: string;
  release_day: string;
  permalink: string;
  permalink_url: string;
  release_month: string;
  release_year: string;
  description: string;
  uri: string;
  label_name: string;
  label_id: string;
  label: string;
  tag_list: string;
  track_count: number;
  user_id: number;
  last_modified: string;
  license: string;
  user: SCApiUser;
  playlist_type: string;
  type: string;
  id: number;
  downloadable: string;
  likes_count: number;
  sharing: string;
  created_at: string;
  release: string;
  tags: string;
  kind: string;
  title: string;
  purchase_title: string;
  ean: string;
  streamable: boolean;
  embeddable_by: string;
  artwork_url: string;
  purchase_url: string;
  tracks_uri: string;
}

export interface SCApiComment {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
  body: string;
  timestamp: string;
}

export interface CursorResponse<T> {
  collection: T[];
  next_href: string;
}
