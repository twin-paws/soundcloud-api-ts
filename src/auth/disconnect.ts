import { scFetch } from "../client/http.js";

/**
 * Revoke OAuth access for the calling application.
 *
 * Invalidates the access tokens of the client application that issued
 * `accessToken`. Unlike {@link signOut}, this hits the regular
 * `api.soundcloud.com` host with a Bearer token.
 *
 * @param accessToken - An OAuth access token issued to your application
 * @throws {SoundCloudError} 400 when disconnect is not supported for this token, 401 when the token is invalid
 *
 * @example
 * ```ts
 * import { disconnect } from 'soundcloud-api-ts';
 *
 * await disconnect('your-access-token');
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api#/oauth
 */
export const disconnect = async (accessToken: string): Promise<void> => {
  await scFetch<unknown>({ path: "/disconnect", method: "POST", token: accessToken });
};
