import { SoundCloudClient } from "./src/index.js";

const client = new SoundCloudClient({
  clientId: "",
  clientSecret: "",
  redirectUri: "https://www.thesubdelta.com/sc-login",
});

const code = "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiQTI1NktXIn0.uQgzDjO1G4Kpm8OrA0x02U2Cfi-dnQL5mGDstfdoqWQ0mSDN0MRpYg.HZoWFvulphyctmzeOL7dbg.0WUamuSteoaustIpi8znwQIZ8Yy29x0CSuJzzLiscPSTEGW5-RNWphhPotjJvQQB1PdBNwXktihl6LR4fkAIWJ29eyNFOCMj9Jh5UQsxcnSXyaRKgrGTjtLyOdMByqRNw08oiQuQDueSkbPwFESppAkEFxW-c6LqyKXTLWug5NqE_jxRbg0JZ79zBaQXejSS.CTKZneZyUiPt_bEyvptO8A";

async function run() {
  // Try user token first, fall back to client token
  console.log("=== 1. Auth ===");
  try {
    const token = await client.auth.getUserToken(code);
    client.setToken(token.access_token, token.refresh_token);
    console.log("✅ User token acquired");
  } catch (e: any) {
    console.log("⚠️  Code expired, falling back to client_credentials:", e.message);
    const token = await client.auth.getClientToken();
    client.setToken(token.access_token);
    console.log("✅ Client token acquired");
  }

  console.log("\n=== 2. /me ===");
  try {
    const me = await client.me.getMe();
    console.log(`✅ ${me.username} (id: ${me.id}) — ${me.track_count} tracks, ${me.followers_count} followers`);
  } catch (e: any) {
    console.log(`❌ me.getMe — ${e.message}`);
  }

  console.log("\n=== 3. Search ===");
  let trackId: number | undefined;
  try {
    const r = await client.search.tracks("deadmau5");
    trackId = r.collection?.[0]?.id;
    console.log(`✅ search.tracks — ${r.collection?.length} results, first: ${r.collection?.[0]?.title} (${trackId})`);
  } catch (e: any) { console.log(`❌ search.tracks — ${e.message}`); }

  try {
    const r = await client.search.users("deadmau5");
    console.log(`✅ search.users — ${r.collection?.length} results, first: ${r.collection?.[0]?.username}`);
  } catch (e: any) { console.log(`❌ search.users — ${e.message}`); }

  try {
    const r = await client.search.playlists("lofi");
    console.log(`✅ search.playlists — ${r.collection?.length} results`);
  } catch (e: any) { console.log(`❌ search.playlists — ${e.message}`); }

  console.log("\n=== 4. User endpoints (deadmau5 581512809) ===");
  const uid = 581512809;
  const userTests: [string, () => Promise<any>][] = [
    ["users.getUser", () => client.users.getUser(uid)],
    ["users.getTracks", () => client.users.getTracks(uid, 3)],
    ["users.getFollowers", () => client.users.getFollowers(uid, 3)],
    ["users.getFollowings", () => client.users.getFollowings(uid, 3)],
    ["users.getPlaylists", () => client.users.getPlaylists(uid, 3)],
    ["users.getLikesTracks", () => client.users.getLikesTracks(uid, 3)],
    ["users.getWebProfiles", () => client.users.getWebProfiles(uid)],
  ];
  for (const [name, fn] of userTests) {
    try {
      const r = await fn();
      const c = r?.collection?.length ?? (Array.isArray(r) ? r.length : "single");
      console.log(`✅ ${name} — ${c}`);
    } catch (e: any) { console.log(`❌ ${name} — ${e.message}`); }
  }

  console.log("\n=== 5. Track endpoints ===");
  if (trackId) {
    const trackTests: [string, () => Promise<any>][] = [
      ["tracks.getTrack", () => client.tracks.getTrack(trackId!)],
      ["tracks.getComments", () => client.tracks.getComments(trackId!, 3)],
      ["tracks.getRelated", () => client.tracks.getRelated(trackId!, 3)],
      ["tracks.getStreams", () => client.tracks.getStreams(trackId!)],
      ["tracks.getLikes", () => client.tracks.getLikes(trackId!, 3)],
      ["tracks.getReposts", () => client.tracks.getReposts(trackId!, 3)],
    ];
    for (const [name, fn] of trackTests) {
      try {
        const r = await fn();
        const c = r?.collection?.length ?? (Array.isArray(r) ? r.length : "single");
        console.log(`✅ ${name} — ${c}`);
      } catch (e: any) { console.log(`❌ ${name} — ${e.message}`); }
    }
  }

  console.log("\n=== 6. /me endpoints ===");
  const meTests: [string, () => Promise<any>][] = [
    ["me.getLikesTracks", () => client.me.getLikesTracks(3)],
    ["me.getLikesPlaylists", () => client.me.getLikesPlaylists(3)],
    ["me.getFollowings", () => client.me.getFollowings(3)],
    ["me.getFollowers", () => client.me.getFollowers(3)],
    ["me.getTracks", () => client.me.getTracks(3)],
    ["me.getPlaylists", () => client.me.getPlaylists(3)],
    ["me.getActivities", () => client.me.getActivities(3)],
  ];
  for (const [name, fn] of meTests) {
    try {
      const r = await fn();
      const c = r?.collection?.length ?? "n/a";
      console.log(`✅ ${name} — ${c}`);
    } catch (e: any) { console.log(`❌ ${name} — ${e.message}`); }
  }

  console.log("\n=== 7. Resolve ===");
  try {
    const r = await client.resolve.resolveUrl("https://soundcloud.com/deadmau5");
    console.log(`✅ resolve — ${typeof r === "string" ? r.substring(0, 80) : "object"}`);
  } catch (e: any) { console.log(`❌ resolve — ${e.message}`); }

  console.log("\n=== Done! ===");
}

run().catch(console.error);
