// Client
export { SoundCloudClient } from "./client/SoundCloudClient.js";
export type { SoundCloudClientConfig } from "./client/SoundCloudClient.js";

// Types
export * from "./types/index.js";

// Mappers
export * from "./mappers/index.js";

// Standalone functions — Auth
export { GetSCClientToken } from "./auth/index.js";
export { GetSCUserToken } from "./auth/index.js";
export { RefreshSCUserToken } from "./auth/index.js";

// Standalone functions — Users
export { GetSCMe } from "./users/index.js";
export { GetSCUserWithId } from "./users/index.js";
export { GetSCUserFollowers } from "./users/index.js";
export { GetSCUserFollowings } from "./users/index.js";
export { GetSCUserTracks } from "./users/index.js";
export { GetSCUserPlaylists } from "./users/index.js";
export { GetSCUserLikesTracks } from "./users/index.js";
export { GetSCUserLikesPlaylists } from "./users/index.js";

// Standalone functions — Tracks
export { GetSCTrackWithId } from "./tracks/index.js";
export { GetSCTrackComments } from "./tracks/index.js";
export { GetSCTrackLikes } from "./tracks/index.js";
export { GetSCTrackReposts } from "./tracks/index.js";
export { GetSCTrackRelated } from "./tracks/index.js";
export { LikeSCTrack } from "./tracks/index.js";

// Standalone functions — Playlists
export { GetSCPlaylistWithId } from "./playlists/index.js";
export { GetSCPlaylistTracks } from "./playlists/index.js";
export { GetSCPlaylistReposts } from "./playlists/index.js";

// Standalone functions — Search
export { SearchTracks } from "./search/index.js";
export { SearchUsers } from "./search/index.js";
export { SearchPlaylists } from "./search/index.js";

// Standalone functions — Resolve
export { ResolveSCUrl } from "./resolve/index.js";

// Utils
export { FormatDate, GetTags, getSCWidgetUrl } from "./utils/index.js";
