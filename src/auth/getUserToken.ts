import { scFetch } from "../client/http.js";
import type { SoundCloudToken } from "../types/api.js";

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
