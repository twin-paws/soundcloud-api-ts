/**
 * Generate a random PKCE code verifier (43 chars, base64url).
 * Works in Node 18+ and modern browsers via globalThis.crypto.
 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/**
 * Derive the S256 code challenge from a code verifier.
 * Uses the Web Crypto API (SubtleCrypto) available in Node 18+ and browsers.
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
