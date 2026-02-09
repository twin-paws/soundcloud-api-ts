import { scFetch } from "../client/http.js";

/**
 * Resolve a SoundCloud URL to its API resource URL.
 *
 * SoundCloud returns a 302 redirect to the API resource; this function returns the redirect target URL.
 *
 * @param token - OAuth access token
 * @param url - A SoundCloud URL (e.g. "https://soundcloud.com/artist/track-name")
 * @returns The resolved API resource URL
 * @throws {SoundCloudError} When the URL cannot be resolved
 *
 * @example
 * ```ts
 * import { resolveUrl } from 'soundcloud-api-ts';
 *
 * const apiUrl = await resolveUrl(token, 'https://soundcloud.com/deadmau5/strobe');
 * console.log(apiUrl); // "https://api.soundcloud.com/tracks/..."
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/resolve/get_resolve
 */
export const resolveUrl = (token: string, url: string): Promise<string> =>
  scFetch<string>({ path: `/resolve?url=${encodeURIComponent(url)}`, method: "GET", token });
