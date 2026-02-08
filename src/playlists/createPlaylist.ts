import { scFetch } from "../client/http.js";
import type { SoundCloudPlaylist } from "../types/api.js";

export interface CreatePlaylistParams {
  title: string;
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

/** POST /playlists — creates a playlist */
export const createPlaylist = (
  token: string,
  params: CreatePlaylistParams,
): Promise<SoundCloudPlaylist> =>
  scFetch<SoundCloudPlaylist>({
    path: "/playlists",
    method: "POST",
    token,
    body: { playlist: params },
  });
