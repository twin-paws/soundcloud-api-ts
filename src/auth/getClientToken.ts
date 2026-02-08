import { scFetchAndMap } from "../client/http.js";
import { SCTokenToTSDToken } from "../mappers/token.js";
import type { SCApiClientToken } from "../types/api.js";
import type { Token } from "../types/models.js";

export const GetSCClientToken = (
  clientId: string,
  clientSecret: string
): Promise<Token> => {
  return scFetchAndMap<Token, SCApiClientToken>(
    {
      path: `/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      method: "POST",
    },
    SCTokenToTSDToken
  );
};
