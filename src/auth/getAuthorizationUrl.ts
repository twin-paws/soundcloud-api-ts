/**
 * Build the SoundCloud authorization URL for the OAuth 2.0 code flow.
 *
 * Redirect the user to this URL so they can grant access to your application.
 *
 * @param clientId - Your SoundCloud application's OAuth client ID
 * @param redirectUri - The redirect URI registered with your SoundCloud application
 * @param options - Optional parameters for the authorization request
 * @param options.state - Opaque state value for CSRF protection (round-tripped by SoundCloud)
 * @param options.codeChallenge - PKCE S256 code challenge for enhanced security
 * @returns The full authorization URL to redirect the user to
 *
 * @example
 * ```ts
 * import { getAuthorizationUrl, generateCodeVerifier, generateCodeChallenge } from 'tsd-soundcloud';
 *
 * const verifier = generateCodeVerifier();
 * const challenge = await generateCodeChallenge(verifier);
 * const url = getAuthorizationUrl('YOUR_CLIENT_ID', 'https://example.com/callback', {
 *   state: 'random-csrf-token',
 *   codeChallenge: challenge,
 * });
 * // Redirect user to `url`
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth2
 */
export function getAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  options?: { state?: string; codeChallenge?: string },
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
  });
  if (options?.state) params.set("state", options.state);
  if (options?.codeChallenge) {
    params.set("code_challenge", options.codeChallenge);
    params.set("code_challenge_method", "S256");
  }
  return `https://api.soundcloud.com/connect?${params}`;
}
