import { scFetch } from "../client/http.js";
import type { SoundCloudTrack } from "../types/api.js";

export interface UpdateTrackParams {
  title?: string;
  description?: string;
  genre?: string;
  tag_list?: string;
  sharing?: "public" | "private";
  downloadable?: boolean;
  purchase_url?: string;
  purchase_title?: string;
  release?: string;
  release_day?: number;
  release_month?: number;
  release_year?: number;
  label_name?: string;
  license?: string;
  isrc?: string;
  bpm?: number;
  key_signature?: string;
}

/** PUT /tracks/:id — updates a track's metadata */
export const updateTrack = (
  token: string,
  trackId: string | number,
  params: UpdateTrackParams,
): Promise<SoundCloudTrack> =>
  scFetch<SoundCloudTrack>({
    path: `/tracks/${trackId}`,
    method: "PUT",
    token,
    body: { track: params },
  });
