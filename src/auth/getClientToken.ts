import { scFetch } from "../client/http.js";
import type { SoundCloudToken } from "../types/api.js";

export const getClientToken = (clientId: string, clientSecret: string): Promise<SoundCloudToken> => {
  return scFetch<SoundCloudToken>({
    path: "/oauth2/token",
    method: "POST",
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
};
