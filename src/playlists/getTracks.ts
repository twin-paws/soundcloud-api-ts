import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Fetch tracks in a playlist.
 *
 * @param token - OAuth access token
 * @param playlistId - The playlist's numeric ID or URN
 * @param limit - Maximum number of tracks per page
 * @param offset - Number of tracks to skip (for offset-based pagination)
 * @returns Paginated list of tracks
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getPlaylistTracks } from 'soundcloud-api-ts';
 *
 * const result = await getPlaylistTracks(token, 123456, 25);
 * result.collection.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/playlists/get_playlists__playlist_id__tracks
 */
export const getPlaylistTracks = (token: string, playlistId: string | number, limit?: number, offset?: number): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: `/playlists/${playlistId}/tracks?${limit ? `limit=${limit}&` : ""}linked_partitioning=true${offset ? `&offset=${offset}` : ""}`, method: "GET", token });
