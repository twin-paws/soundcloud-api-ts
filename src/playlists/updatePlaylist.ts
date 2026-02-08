import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist } from "../types/api.js";

export interface UpdatePlaylistParams {
  title?: string;
  description?: string;
  sharing?: "public" | "private";
  tracks?: { urn: string }[];
  ean?: string;
  genre?: string;
  label_name?: string;
  license?: string;
  permalink?: string;
  purchase_title?: string;
  purchase_url?: string;
  release?: string;
  release_date?: string;
  set_type?: "album" | "playlist";
  tag_list?: string;
}

/** PUT /playlists/:id — updates a playlist */
export const updatePlaylist = (
  token: string,
  playlistId: string | number,
  params: UpdatePlaylistParams,
): Promise<SoundCloudPlaylist> =>
  scFetch<SoundCloudPlaylist>({
    path: `/playlists/${playlistId}`,
    method: "PUT",
    token,
    body: { playlist: params },
  });
