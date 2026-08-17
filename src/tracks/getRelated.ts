import { scFetch } from "../client/http.js";
import type { SoundCloudTrack, SoundCloudPaginatedResponse } from "../types/api.js";

export interface RelatedTracksOptions {
  /** Maximum number of related tracks per page */
  limit?: number;
  /**
   * Filter by access level. Official examples send `playable`.
   * @default "playable"
   */
  access?: string;
}

function relatedPath(trackId: string | number, options?: RelatedTracksOptions): string {
  const params = new URLSearchParams();
  params.set("linked_partitioning", "true");
  params.set("access", options?.access ?? "playable");
  if (options?.limit !== undefined) params.set("limit", String(options.limit));
  return `/tracks/${trackId}/related?${params}`;
}

function unwrapRelated(
  data: SoundCloudTrack[] | SoundCloudPaginatedResponse<SoundCloudTrack>,
): SoundCloudTrack[] {
  if (Array.isArray(data)) return data;
  return data.collection ?? [];
}

/**
 * Fetch one page of tracks related to a given track (official paginated shape).
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__related
 */
export const getRelatedTracksPage = (
  token: string,
  trackId: string | number,
  options?: RelatedTracksOptions,
): Promise<SoundCloudPaginatedResponse<SoundCloudTrack>> =>
  scFetch({ path: relatedPath(trackId, options), method: "GET", token });

/**
 * Fetch tracks related to a given track.
 *
 * Returns the first page's `collection` so existing callers keep an array.
 * Prefer {@link getRelatedTracksPage} when you need `next_href`.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @param limit - Maximum number of related tracks to return
 * @returns Array of related tracks
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { getRelatedTracks } from 'soundcloud-api-ts';
 *
 * const related = await getRelatedTracks(token, 123456, 5);
 * related.forEach(t => console.log(t.title));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/get_tracks__track_id__related
 */
export const getRelatedTracks = async (
  token: string,
  trackId: string | number,
  limit?: number,
): Promise<SoundCloudTrack[]> => {
  const page = await getRelatedTracksPage(token, trackId, { limit });
  return unwrapRelated(page);
};
