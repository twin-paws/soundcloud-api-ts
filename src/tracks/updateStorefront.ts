import { scFetch } from "../client/http.js";

export type StorefrontType =
  | "digital"
  | "vinyl"
  | "cd"
  | "cassette"
  | "apparel"
  | "sample_pack"
  | "subscription"
  | "live_event"
  | "live_stream"
  | "other";

/** Official storefront (Artist Storefront / buy module) response. */
export interface SoundCloudStorefront {
  track_urn: string;
  title: string;
  type: StorefrontType | string;
  link: string;
  link_title?: string | null;
  description?: string | null;
  image_url?: string | null;
  price?: string | null;
}

/**
 * PUT /tracks/{id}/storefront replaces the whole storefront.
 * Omitted optional fields are cleared — send every value that should stay.
 */
export interface StorefrontUpdateParams {
  title: string;
  type: StorefrontType;
  link: string;
  link_title?: string;
  description?: string;
  price?: string;
}

/**
 * Create or update a track's storefront. Requires the owner plus a creator
 * subscription that includes external purchase options.
 *
 * @see https://github.com/soundcloud/api/blob/master/openapi/api.yaml
 */
export const updateTrackStorefront = (
  token: string,
  trackId: string | number,
  params: StorefrontUpdateParams,
): Promise<SoundCloudStorefront> =>
  scFetch<SoundCloudStorefront>({
    path: `/tracks/${trackId}/storefront`,
    method: "PUT",
    token,
    body: params as unknown as Record<string, unknown>,
  });
