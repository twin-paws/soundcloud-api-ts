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

describe("search", () => {
  it("tracks encodes query", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.tracks("hello world");
    expect(fn.mock.calls[0][0]).toContain("/tracks?q=hello+world");
    expect(fn.mock.calls[0][0]).toContain("access=playable");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
  });

  it("tracks with pagination offset", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.tracks("test", 2);
    expect(fn.mock.calls[0][0]).toContain("offset=20");
  });

  it("users encodes query", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.users("deadmau5");
    expect(fn.mock.calls[0][0]).toContain("/users?q=deadmau5");
  });

  it("playlists encodes query", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.playlists("chill");
    expect(fn.mock.calls[0][0]).toContain("/playlists?q=chill");
  });

  it("tracks accepts limit and access overrides", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.search.tracks("q", 1, { limit: 50, access: "playable,preview" });
    expect(fn.mock.calls[0][0]).toContain("limit=50");
    expect(fn.mock.calls[0][0]).toContain("offset=50");
    expect(fn.mock.calls[0][0]).toContain("access=playable%2Cpreview");
  });

  it("throws when limit is out of range", async () => {
    await expect(client.search.tracks("q", undefined, { limit: 201 })).rejects.toThrow(/limit must be between/);
  });
});
