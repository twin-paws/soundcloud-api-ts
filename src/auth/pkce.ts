/**
 * Generate a random PKCE code verifier (43+ characters, base64url-encoded).
 *
 * Uses the Web Crypto API (`globalThis.crypto`), compatible with Node 18+ and modern browsers.
 *
 * @returns A cryptographically random code verifier string
 *
 * @example
 * ```ts
 * import { generateCodeVerifier, generateCodeChallenge } from 'soundcloud-api-ts';
 *
 * const verifier = generateCodeVerifier();
 * const challenge = await generateCodeChallenge(verifier);
 * // Use `challenge` in getAuthorizationUrl, then `verifier` in getUserToken
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7636
 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/**
 * Derive the S256 PKCE code challenge from a code verifier.
 *
 * Computes `BASE64URL(SHA256(verifier))` using the Web Crypto API (SubtleCrypto),
 * available in Node 18+ and modern browsers.
 *
 * @param verifier - The code verifier string (typically from {@link generateCodeVerifier})
 * @returns The base64url-encoded SHA-256 hash of the verifier
 *
 * @example
 * ```ts
 * import { generateCodeVerifier, generateCodeChallenge } from 'soundcloud-api-ts';
 *
 * const verifier = generateCodeVerifier();
 * const challenge = await generateCodeChallenge(verifier);
 * console.log(challenge); // e.g. "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7636#section-4.2
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(digest));
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
