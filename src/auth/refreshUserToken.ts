import { scFetch } from "../client/http.js";
import type { SoundCloudToken } from "../types/api.js";

/**
 * Refresh an expired access token using a refresh token (refresh_token grant).
 *
 * This is a standalone function alternative to {@link SoundCloudClient.Auth.refreshUserToken}.
 *
 * @param clientId - Your SoundCloud application's OAuth client ID
 * @param clientSecret - Your SoundCloud application's OAuth client secret
 * @param redirectUri - The redirect URI registered with your SoundCloud application
 * @param refreshToken - The refresh token from a previous token response
 * @returns A new OAuth token response with fresh access and refresh tokens
 * @throws {SoundCloudError} When the refresh token is invalid or expired
 *
 * @example
 * ```ts
 * import { refreshUserToken } from 'soundcloud-api-ts';
 *
 * const newToken = await refreshUserToken(
 *   'YOUR_CLIENT_ID',
 *   'YOUR_CLIENT_SECRET',
 *   'https://example.com/callback',
 *   oldRefreshToken,
 * );
 * console.log(newToken.access_token);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2/post_oauth2_token
 */
export const refreshUserToken = (
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  refreshToken: string,
): Promise<SoundCloudToken> => {
  return scFetch<SoundCloudToken>({
    path: "/oauth/token",
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      refresh_token: refreshToken,
    }),
  });
};
