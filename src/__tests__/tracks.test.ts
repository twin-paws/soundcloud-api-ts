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

describe("tracks", () => {
  it("getTrack calls /tracks/:id", async () => {
    const fn = mockFetch({ json: { id: 1, title: "Song" } });
    const r = await client.tracks.getTrack(1);
    expect(r).toEqual({ id: 1, title: "Song" });
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/tracks/1");
  });

  it("getStreams", async () => {
    const fn = mockFetch({ json: { http_mp3_128_url: "url" } });
    await client.tracks.getStreams(1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/streams");
  });

  it("getComments", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.tracks.getComments(1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/comments");
  });

  it("createComment sends POST with body", async () => {
    const fn = mockFetch({ json: { id: 99, body: "nice" } });
    await client.tracks.createComment(1, "nice", 5000);
    expect(fn.mock.calls[0][1].method).toBe("POST");
    const body = JSON.parse(fn.mock.calls[0][1].body);
    expect(body).toEqual({ comment: { body: "nice", timestamp: 5000 } });
  });

  it("getLikes", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.tracks.getLikes(1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/favoriters");
  });

  it("getReposts", async () => {
    const fn = mockFetch({ json: { collection: [] } });
    await client.tracks.getReposts(1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/reposters");
  });

  it("getRelated", async () => {
    const fn = mockFetch({ json: [{ id: 2 }] });
    await client.tracks.getRelated(1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/related");
  });

  it("update sends PUT", async () => {
    const fn = mockFetch({ json: { id: 1, title: "New" } });
    await client.tracks.update(1, { title: "New" });
    expect(fn.mock.calls[0][1].method).toBe("PUT");
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ track: { title: "New" } });
  });

  it("delete sends DELETE", async () => {
    const fn = mockFetch({ status: 204 });
    await client.tracks.delete(1);
    expect(fn.mock.calls[0][1].method).toBe("DELETE");
    expect(fn.mock.calls[0][0]).toContain("/tracks/1");
  });

  it("getTracks fetches multiple tracks by ids", async () => {
    const fn = mockFetch({ json: [{ id: 1, title: "A" }, { id: 2, title: "B" }] });
    const r = await client.tracks.getTracks([1, 2]);
    expect(fn.mock.calls[0][0]).toContain("/tracks?ids=1,2");
    expect(r).toHaveLength(2);
    expect(r[0].title).toBe("A");
  });

  it("getTracks with single id", async () => {
    const fn = mockFetch({ json: [{ id: 5, title: "Solo" }] });
    const r = await client.tracks.getTracks([5]);
    expect(fn.mock.calls[0][0]).toContain("/tracks?ids=5");
    expect(r[0].id).toBe(5);
  });

  it("getTracks throws when more than 200 ids are provided", async () => {
    const ids = Array.from({ length: 201 }, (_, i) => i + 1);
    await expect(client.tracks.getTracks(ids)).rejects.toThrow(
      "getTracks: SoundCloud API supports a maximum of 200 IDs per request",
    );
  });
});
