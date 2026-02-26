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

describe("me", () => {
  it("getMe calls /me", async () => {
    const fn = mockFetch({ json: { id: 1, username: "me" } });
    const r = await client.me.getMe();
    expect(r).toEqual({ id: 1, username: "me" });
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/me");
  });

  it("getActivities calls /me/activities", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getActivities(5);
    expect(fn.mock.calls[0][0]).toContain("/me/activities?limit=5");
  });

  it("getLikesTracks calls /me/likes/tracks", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getLikesTracks();
    expect(fn.mock.calls[0][0]).toContain("/me/likes/tracks");
  });

  it("getLikesPlaylists calls /me/likes/playlists", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getLikesPlaylists();
    expect(fn.mock.calls[0][0]).toContain("/me/likes/playlists");
  });

  it("getFollowings calls /me/followings", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getFollowings();
    expect(fn.mock.calls[0][0]).toContain("/me/followings?");
  });

  it("getFollowers calls /me/followers", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getFollowers();
    expect(fn.mock.calls[0][0]).toContain("/me/followers");
  });

  it("getTracks calls /me/tracks", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getTracks();
    expect(fn.mock.calls[0][0]).toContain("/me/tracks");
  });

  it("getPlaylists calls /me/playlists", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.me.getPlaylists();
    expect(fn.mock.calls[0][0]).toContain("/me/playlists");
  });

  it("follow uses PUT", async () => {
    const fn = mockFetch({ status: 204 });
    await client.me.follow(123);
    expect(fn.mock.calls[0][0]).toContain("/me/followings/123");
    expect(fn.mock.calls[0][1].method).toBe("PUT");
  });

  it("unfollow uses DELETE", async () => {
    const fn = mockFetch({ status: 204 });
    await client.me.unfollow(123);
    expect(fn.mock.calls[0][0]).toContain("/me/followings/123");
    expect(fn.mock.calls[0][1].method).toBe("DELETE");
  });

  it("getConnections calls /me/connections", async () => {
    const fn = mockFetch({ json: [{ id: 1, service: "twitter", display_name: "myhandle", kind: "connection", created_at: "", uri: "" }] });
    const r = await client.me.getConnections();
    expect(fn.mock.calls[0][0]).toContain("/me/connections");
    expect(r[0].service).toBe("twitter");
  });
});
