/**
 * Build the SoundCloud authorization URL for the OAuth 2.0 code flow.
 *
 * Redirect the user to this URL so they can grant access to your application.
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
