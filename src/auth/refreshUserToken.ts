import { scFetchAndMap } from "../client/http.js";
import { SCTokenToTSDToken } from "../mappers/token.js";
import type { SCApiClientToken } from "../types/api.js";
import type { Token } from "../types/models.js";

export const RefreshSCUserToken = (
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  refreshToken: string
): Promise<Token> => {
  return scFetchAndMap<Token, SCApiClientToken>(
    {
      path: `/oauth2/token?grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&refresh_token=${refreshToken}`,
      method: "POST",
    },
    SCTokenToTSDToken
  );
};
