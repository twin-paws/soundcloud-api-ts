import { scFetch } from "../client/http.js";
import type { SoundCloudToken } from "../types/api.js";

/**
 * Exchange an authorization code for user tokens (authorization_code grant).
 *
 * This is a standalone function alternative to {@link SoundCloudClient.Auth.getUserToken}.
 *
 * @param clientId - Your SoundCloud application's OAuth client ID
 * @param clientSecret - Your SoundCloud application's OAuth client secret
 * @param redirectUri - The redirect URI registered with your SoundCloud application
 * @param code - The authorization code received from the OAuth callback
 * @param codeVerifier - PKCE code verifier if a code challenge was used during authorization
 * @returns The OAuth token response including access and refresh tokens
 * @throws {SoundCloudError} When the code is invalid, expired, or credentials are wrong
 *
 * @example
 * ```ts
 * import { getUserToken } from 'tsd-soundcloud';
 *
 * const token = await getUserToken(
 *   'YOUR_CLIENT_ID',
 *   'YOUR_CLIENT_SECRET',
 *   'https://example.com/callback',
 *   authorizationCode,
 *   codeVerifier, // optional, for PKCE
 * );
 * console.log(token.access_token, token.refresh_token);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2/post_oauth2_token
 */
export const getUserToken = (
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string,
  codeVerifier?: string,
): Promise<SoundCloudToken> => {
  const params: Record<string, string> = {
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  };
  if (codeVerifier) params.code_verifier = codeVerifier;
  return scFetch<SoundCloudToken>({
    path: "/oauth2/token",
    method: "POST",
    body: new URLSearchParams(params),
  });
};
