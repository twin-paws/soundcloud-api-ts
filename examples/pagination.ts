/**
 * Pagination helpers: paginate, paginateItems, and fetchAll.
 *
 * Replace the placeholder credentials with your own before running:
 *   npx tsx examples/pagination.ts
 */

import {
  paginate,
  paginateItems,
  fetchAll,
  searchTracks,
  scFetchUrl,
  getClientToken,
  type SoundCloudTrack,
  type SoundCloudPaginatedResponse,
} from "soundcloud-api-ts";

const CLIENT_ID = "YOUR_CLIENT_ID";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";

async function main() {
  // Authenticate
  const token = await getClientToken(CLIENT_ID, CLIENT_SECRET);
  const accessToken = token.access_token;

  // --- paginate: yields one page (collection array) at a time ---
  console.log("=== paginate (page by page) ===");
  const pages = paginate<SoundCloudTrack>(
    () => searchTracks(accessToken, "ambient"),
    (url) => scFetchUrl(url, accessToken) as Promise<SoundCloudPaginatedResponse<SoundCloudTrack>>,
  );

  let pageNum = 0;
  for await (const page of pages) {
    pageNum++;
    console.log(`Page ${pageNum}: ${page.length} tracks`);
    if (pageNum >= 3) break; // stop after 3 pages for this demo
  }

  // --- paginateItems: yields individual items across pages ---
  console.log("\n=== paginateItems (item by item) ===");
  const items = paginateItems<SoundCloudTrack>(
    () => searchTracks(accessToken, "ambient"),
    (url) => scFetchUrl(url, accessToken) as Promise<SoundCloudPaginatedResponse<SoundCloudTrack>>,
  );

  let count = 0;
  for await (const track of items) {
    console.log(`  ${track.title}`);
    count++;
    if (count >= 10) break; // stop after 10 items
  }

  // --- fetchAll: collects everything into a flat array ---
  console.log("\n=== fetchAll (with maxItems limit) ===");
  const allTracks = await fetchAll<SoundCloudTrack>(
    () => searchTracks(accessToken, "ambient"),
    (url) => scFetchUrl(url, accessToken) as Promise<SoundCloudPaginatedResponse<SoundCloudTrack>>,
    { maxItems: 50 },
  );
  console.log(`Collected ${allTracks.length} tracks total`);
}

main().catch(console.error);
