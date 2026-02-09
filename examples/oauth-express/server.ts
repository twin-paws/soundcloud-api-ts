/**
 * Minimal Express server demonstrating the SoundCloud OAuth 2.0
 * authorization code flow.
 *
 * Setup:
 *   cd examples/oauth-express
 *   npm install
 *   npm start
 *
 * Then visit http://localhost:3000/login
 */

import express from "express";
import {
  getAuthorizationUrl,
  getUserToken,
  getMe,
  type SoundCloudToken,
} from "soundcloud-api-ts";

const CLIENT_ID = "YOUR_CLIENT_ID";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3000/callback";

const app = express();

// In-memory token store (use a real session/store in production)
let storedToken: SoundCloudToken | null = null;

// GET /login — redirect the user to SoundCloud's authorization page
app.get("/login", (_req, res) => {
  const url = getAuthorizationUrl(CLIENT_ID, REDIRECT_URI);
  res.redirect(url);
});

// GET /callback — exchange the authorization code for an access token
app.get("/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.status(400).send("Missing authorization code");
    return;
  }

  try {
    storedToken = await getUserToken(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, code);
    res.send("Authenticated! Visit <a href='/me'>/me</a> to see your profile.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Token exchange failed");
  }
});

// GET /me — fetch the authenticated user's profile
app.get("/me", async (_req, res) => {
  if (!storedToken) {
    res.redirect("/login");
    return;
  }

  try {
    const me = await getMe(storedToken.access_token);
    res.json(me);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch profile");
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
  console.log("Visit http://localhost:3000/login to start the OAuth flow");
});
