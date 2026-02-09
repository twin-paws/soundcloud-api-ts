/**
 * PKCE (Proof Key for Code Exchange) flow for browser / public clients.
 *
 * This example shows the steps you'd wire into a single-page app.
 * It won't run standalone — it's meant as a reference you adapt
 * into your front-end framework.
 *
 *   npx tsx examples/pkce-spa.ts   (prints the generated URLs/values)
 */

import {
  generateCodeVerifier,
  generateCodeChallenge,
  getAuthorizationUrl,
  getUserToken,
} from "soundcloud-api-ts";

const CLIENT_ID = "YOUR_CLIENT_ID";
const REDIRECT_URI = "http://localhost:3000/callback";

async function main() {
  // Step 1: Generate a random code verifier and its SHA-256 challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  console.log("Code verifier:", codeVerifier);
  console.log("Code challenge:", codeChallenge);

  // Step 2: Build the authorization URL and redirect the user to it
  //   In a real SPA you'd do: window.location.href = authUrl
  const authUrl = getAuthorizationUrl(CLIENT_ID, REDIRECT_URI, {
    codeChallenge,
  });
  console.log("\nAuthorization URL (redirect user here):\n", authUrl);

  // Step 3: After the user authorizes, SoundCloud redirects back with a `code`
  //   query parameter. Exchange it for tokens:
  const code = "CODE_FROM_CALLBACK"; // e.g. new URL(window.location.href).searchParams.get('code')

  // For PKCE flows, pass the codeVerifier instead of a client secret
  const token = await getUserToken(
    CLIENT_ID,
    "",           // no client secret for public clients
    REDIRECT_URI,
    code,
    codeVerifier, // proves possession of the original challenge
  );

  console.log("\nAccess token:", token.access_token);
  console.log("Refresh token:", token.refresh_token);
}

main().catch(console.error);
