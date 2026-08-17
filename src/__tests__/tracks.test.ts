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
    const r = await client.tracks.getRelated(1);
    expect(r).toEqual([{ id: 2 }]);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/related");
    expect(fn.mock.calls[0][0]).toContain("access=playable");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
  });

  it("getRelated unwraps a paginated collection", async () => {
    mockFetch({ json: { collection: [{ id: 3, title: "Rel" }], next_href: "https://next" } });
    const r = await client.tracks.getRelated(1, 5);
    expect(r).toEqual([{ id: 3, title: "Rel" }]);
  });

  it("getRelatedPage returns the official paginated shape", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 3 }], next_href: "https://next" } });
    const page = await client.tracks.getRelatedPage(1, { limit: 5 });
    expect(page.collection).toHaveLength(1);
    expect(fn.mock.calls[0][0]).toContain("limit=5");
  });

  it("getStreamUrl returns the 302 Location", async () => {
    mockFetch({ status: 302, headers: { location: "https://cf.example/stream" }, ok: false });
    const url = await client.tracks.getStreamUrl(1);
    expect(url).toBe("https://cf.example/stream");
  });

  it("getPreviewUrl returns the 302 Location", async () => {
    mockFetch({ status: 302, headers: { location: "https://cf.example/preview" }, ok: false });
    const url = await client.tracks.getPreviewUrl(1);
    expect(url).toBe("https://cf.example/preview");
  });

  it("updateStorefront PUTs JSON", async () => {
    const fn = mockFetch({ json: { track_urn: "soundcloud:tracks:1", title: "Buy", type: "digital", link: "https://x.com" } });
    await client.tracks.updateStorefront(1, { title: "Buy", type: "digital", link: "https://x.com" });
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/storefront");
    expect(fn.mock.calls[0][1].method).toBe("PUT");
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ title: "Buy", type: "digital", link: "https://x.com" });
  });

  it("upload sends multipart FormData", async () => {
    const fn = mockFetch({ json: { id: 9, title: "Up" } });
    const bytes = new Uint8Array([1, 2, 3]);
    await client.tracks.upload({ title: "Up", asset_data: bytes, filename: "a.mp3", genre: "Techno" });
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/tracks");
    expect(fn.mock.calls[0][1].method).toBe("POST");
    expect(fn.mock.calls[0][1].body).toBeInstanceOf(FormData);
  });

  it("getRelated returns [] when the page has no collection", async () => {
    mockFetch({ json: { next_href: "https://next" } });
    expect(await client.tracks.getRelated(1)).toEqual([]);
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
