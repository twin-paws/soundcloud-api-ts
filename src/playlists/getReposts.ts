import { scFetch } from "../client/http.js";
import type { SoundCloudUser, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch users who have reposted a playlist.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @param limit - Maximum number of users per page
 * @returns Paginated list of users who reposted the playlist
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getPlaylistReposts } from 'soundcloud-api-ts';
 *
 * const result = await getPlaylistReposts(token, 123456, 50);
 * result.collection.forEach(u => console.log(u.username));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists__playlist_id__reposters
 */
export const getPlaylistReposts = (token: string, playlistId: string | number, limit?: number): Promise<SoundCloudPaginatedResponse<SoundCloudUser>> =>
  scFetch({ path: `/playlists/${playlistId}/reposters?${limit ? `limit=${limit}&` : ""}linked_partitioning=true`, method: "GET", token });
