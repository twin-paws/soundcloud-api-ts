import { scFetch } from "../client/http.js";
import type { SoundCloudTrack } from "../types/api.js";

/**
 * Parameters for {@link uploadTrack} (`POST /tracks` multipart).
 * Field names follow the official `track[…]` form schema.
 */
export interface UploadTrackParams {
  /** Track title (required) */
  title: string;
  /** Audio file bytes. `File`/`Blob` in browsers; `Blob`/`Uint8Array` in Node 20+. */
  asset_data: Blob | File | Uint8Array | ArrayBuffer;
  /** Optional filename when `asset_data` is not a `File` */
  filename?: string;
  /** Optional artist name for the upload (`track[artist]`). Returned as `metadata_artist`. */
  artist?: string;
  permalink?: string;
  sharing?: "public" | "private";
  embeddable_by?: "all" | "me" | "none";
  purchase_url?: string;
  description?: string;
  genre?: string;
  tag_list?: string;
  label_name?: string;
  release?: string;
  /** Write-only release date `yyyy-mm-dd` */
  release_date?: string;
  streamable?: boolean;
  downloadable?: boolean;
  license?: string;
  commentable?: boolean;
  isrc?: string;
  /** Artwork image (`track[artwork_data]`). PRO users. */
  artwork_data?: Blob | File | Uint8Array | ArrayBuffer;
}

function toBlob(data: Blob | File | Uint8Array | ArrayBuffer, fallbackType: string): Blob {
  if (data instanceof Blob) return data;
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: fallbackType });
}

/**
 * Upload a new track. Requires a user (authorization-code) token.
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/tracks/post_tracks
 * @see https://help.soundcloud.com/hc/en-us/articles/360039171614-Upload-Requirements
 */
export const uploadTrack = (
  token: string,
  params: UploadTrackParams,
): Promise<SoundCloudTrack> => {
  const form = new FormData();
  form.append("track[title]", params.title);
  const audio = toBlob(params.asset_data, "application/octet-stream");
  const audioName = (typeof File !== "undefined" && params.asset_data instanceof File)
    ? params.asset_data.name
    : (params.filename ?? "upload");
  form.append("track[asset_data]", audio, audioName);

  const optional: Array<[string, string | boolean | undefined]> = [
    ["track[artist]", params.artist],
    ["track[permalink]", params.permalink],
    ["track[sharing]", params.sharing],
    ["track[embeddable_by]", params.embeddable_by],
    ["track[purchase_url]", params.purchase_url],
    ["track[description]", params.description],
    ["track[genre]", params.genre],
    ["track[tag_list]", params.tag_list],
    ["track[label_name]", params.label_name],
    ["track[release]", params.release],
    ["track[release_date]", params.release_date],
    ["track[isrc]", params.isrc],
    ["track[license]", params.license],
  ];
  for (const [key, value] of optional) {
    if (value !== undefined) form.append(key, String(value));
  }
  if (params.streamable !== undefined) form.append("track[streamable]", String(params.streamable));
  if (params.downloadable !== undefined) form.append("track[downloadable]", String(params.downloadable));
  if (params.commentable !== undefined) form.append("track[commentable]", String(params.commentable));
  if (params.artwork_data) {
    const art = toBlob(params.artwork_data, "image/jpeg");
    const artName = (typeof File !== "undefined" && params.artwork_data instanceof File)
      ? params.artwork_data.name
      : "artwork";
    form.append("track[artwork_data]", art, artName);
  }

  return scFetch<SoundCloudTrack>({
    path: "/tracks",
    method: "POST",
    token,
    body: form,
  });
};
