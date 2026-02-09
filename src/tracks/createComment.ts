import { scFetch } from "../client/http.js";
import type { SoundCloudComment } from "../types/api.js";

/**
 * Post a comment on a track.
 *
 * @param token - OAuth access token
 * @param trackId - The track's numeric ID or URN
 * @param body - The comment text
 * @param timestamp - Position in the track in milliseconds where the comment is placed
 * @returns The created comment object
 * @throws {SoundCloudError} When the API returns an error
 *
 * @example
 * ```ts
 * import { createTrackComment } from 'tsd-soundcloud';
 *
 * const comment = await createTrackComment(token, 123456, 'Great drop!', 60000);
 * console.log(comment.id);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/post_tracks__track_id__comments
 */
export const createTrackComment = (
  token: string,
  trackId: string | number,
  body: string,
  timestamp?: number,
): Promise<SoundCloudComment> =>
  scFetch<SoundCloudComment>({
    path: `/tracks/${trackId}/comments`,
    method: "POST",
    token,
    body: { comment: { body, ...(timestamp !== undefined ? { timestamp } : {}) } },
  });
