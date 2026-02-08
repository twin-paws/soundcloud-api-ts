import { scFetchAndMap } from "../client/http.js";
import { SCTokenToTSDToken } from "../mappers/token.js";
import type { SCApiClientToken } from "../types/api.js";
import type { Token } from "../types/models.js";

export const GetSCUserToken = (
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string
): Promise<Token> => {
  return scFetchAndMap<Token, SCApiClientToken>(
    {
      path: `/oauth2/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}`,
      method: "POST",
    },
    SCTokenToTSDToken
  );
};
