import { scFetch } from "../client/http.js";
import type { SoundCloudToken } from "../types/api.js";

export const refreshUserToken = (
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  refreshToken: string,
): Promise<SoundCloudToken> => {
  return scFetch<SoundCloudToken>({
    path: "/oauth2/token",
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
