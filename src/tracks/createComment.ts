import { scFetch } from "../client/http.js";
import type { SoundCloudComment } from "../types/api.js";

/** POST /tracks/:id/comments — creates a comment on a track */
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
