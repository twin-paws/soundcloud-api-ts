import type { SCApiClientToken } from "../types/api.js";
import type { Token } from "../types/models.js";

export const SCTokenToTSDToken = (token: SCApiClientToken): Token => {
  const now = new Date();
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    type: "client",
    expireTime: new Date(now.getTime() + token.expires_in * 1000).toISOString(),
    created: now.toISOString(),
  };
};
