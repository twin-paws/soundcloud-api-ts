/**
 * Basic usage of the SoundCloud API client.
 *
 * Replace the placeholder credentials with your own before running:
 *   npx tsx examples/basic-usage.ts
 */

import { SoundCloudClient } from "soundcloud-api-ts";

async function main() {
  // 1. Create a client with your app credentials
  const sc = new SoundCloudClient({
    clientId: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
  });

  // 2. Obtain a client-credentials token (no user login required)
  const token = await sc.auth.getClientToken();
  sc.setToken(token.access_token);

  // 3. Get a track by ID
  const track = await sc.tracks.getTrack(123456789);
  console.log("Track:", track.title, "by", track.user.username);

  // 4. Search for tracks
  const results = await sc.search.searchTracks("lofi hip hop");
  console.log(`Found ${results.collection.length} tracks`);
  for (const t of results.collection) {
    console.log(` - ${t.title}`);
  }

  // 5. Get a user by ID
  const user = await sc.users.getUser(987654321);
  console.log("User:", user.username);

  // 6. Get a user's tracks
  const userTracks = await sc.users.getUserTracks(user.id);
  console.log(`${user.username} has uploaded:`);
  for (const t of userTracks.collection) {
    console.log(` - ${t.title}`);
  }
}

main().catch(console.error);
