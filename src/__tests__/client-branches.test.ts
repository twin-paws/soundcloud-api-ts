import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundCloudClient } from "../client/SoundCloudClient.js";
import { mockFetch } from "./helpers.js";

const config = { clientId: "cid", clientSecret: "cs" };
let client: SoundCloudClient;

beforeEach(() => {
  vi.restoreAllMocks();
  client = new SoundCloudClient(config);
  client.setToken("tok");
});

describe("client limit branches", () => {
  // me methods - with limit
  it("me.getActivities with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getActivities();
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("me.getLikesTracks with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getLikesTracks(10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("me.getLikesPlaylists with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getLikesPlaylists(10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("me.getFollowings with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getFollowings(10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("me.getFollowers with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getFollowers(10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("me.getTracks with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getTracks(10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("me.getPlaylists with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getPlaylists(10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  // users methods - with limit
  it("users.getTracks without limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.users.getTracks(42);
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("users.getFollowers with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.users.getFollowers(42, 10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("users.getFollowings with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.users.getFollowings(42, 10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("users.getPlaylists with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.users.getPlaylists(42, 10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("users.getLikesTracks with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.users.getLikesTracks(42, 10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("users.getLikesTracks with cursor", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.users.getLikesTracks(42, 10, "abc");
    expect(fn.mock.calls[0][0]).toContain("cursor=abc");
  });

  it("users.getLikesPlaylists with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.users.getLikesPlaylists(42, 10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  // tracks methods - with limit
  it("tracks.getComments with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.tracks.getComments(1, 20);
    expect(fn.mock.calls[0][0]).toContain("limit=20");
  });

  it("tracks.getLikes with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.tracks.getLikes(1, 20);
    expect(fn.mock.calls[0][0]).toContain("limit=20");
  });

  it("tracks.getReposts with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.tracks.getReposts(1, 20);
    expect(fn.mock.calls[0][0]).toContain("limit=20");
  });

  it("tracks.getRelated with limit", async () => {
    const fn = mockFetch({ json: [] });
    await client.tracks.getRelated(1, 5);
    expect(fn.mock.calls[0][0]).toContain("limit=5");
  });

  // playlists methods - with limit
  it("playlists.getTracks with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.playlists.getTracks(10, 25);
    expect(fn.mock.calls[0][0]).toContain("limit=25");
  });

  it("playlists.getTracks with offset", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.playlists.getTracks(10, 25, 50);
    expect(fn.mock.calls[0][0]).toContain("offset=50");
  });

  it("playlists.getReposts with limit", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.playlists.getReposts(10, 20);
    expect(fn.mock.calls[0][0]).toContain("limit=20");
  });

  // search methods - pageNumber branches
  it("search.users with pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.users("test", 3);
    expect(fn.mock.calls[0][0]).toContain("offset=30");
  });

  it("search.playlists with pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.playlists("test", 2);
    expect(fn.mock.calls[0][0]).toContain("offset=20");
  });

  it("search.tracks without pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.tracks("test");
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });

  it("search.users without pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.users("test");
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });

  it("search.playlists without pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.playlists("test");
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });
});
