/**
 * Invalidate the session associated with an access token.
 *
 * **Note:** This hits `https://secure.soundcloud.com`, NOT the regular
 * `api.soundcloud.com` host used by all other endpoints.
 *
 * @param accessToken - The OAuth access token to invalidate
 * @throws {Error} When the sign-out request fails
 *
 * @example
 * ```ts
 * import { signOut } from 'soundcloud-api-ts';
 *
 * await signOut('your-access-token');
 * ```
 */
export const signOut = async (accessToken: string): Promise<void> => {
  const res = await fetch("https://secure.soundcloud.com/sign-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!res.ok) throw new Error(`Sign-out failed: ${res.status}`);
};
