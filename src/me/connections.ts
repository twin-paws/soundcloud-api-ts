import { scFetch } from "../client/http.js";
import type { SoundCloudConnection } from "../types/api.js";

/**
 * List the authenticated user's connected external social accounts.
 *
 * @param token - OAuth access token (user token required)
 * @returns Array of connection objects for linked social services
 * @throws {SoundCloudError} When the API returns an error
 *
 * @remarks This endpoint may require elevated API access or app approval.
 *
 * @example
 * ```ts
 * import { getMeConnections } from 'soundcloud-api-ts';
 *
 * const connections = await getMeConnections(token);
 * connections.forEach(c => console.log(c.service, c.display_name));
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/me/get_me_connections
 */
export const getMeConnections = (token: string): Promise<SoundCloudConnection[]> =>
  scFetch<SoundCloudConnection[]>({ path: "/me/connections", method: "GET", token });
