import { scFetch } from "../client/http.js";
import type { SoundCloudToken } from "../types/api.js";

/**
 * Exchange client credentials for an access token (client_credentials grant).
 *
 * This is a standalone function alternative to {@link SoundCloudClient.Auth.getClientToken}.
 *
 * @param clientId - Your SoundCloud application's OAuth client ID
 * @param clientSecret - Your SoundCloud application's OAuth client secret
 * @returns The OAuth token response
 * @throws {SoundCloudError} When authentication fails (e.g. invalid credentials)
 *
 * @example
 * ```ts
 * import { getClientToken } from 'soundcloud-api-ts';
 *
 * const token = await getClientToken('YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET');
 * console.log(token.access_token);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2/post_oauth2_token
 */
export const getClientToken = (clientId: string, clientSecret: string): Promise<SoundCloudToken> => {
  return scFetch<SoundCloudToken>({
    path: "/oauth/token",
    method: "POST",
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
};
