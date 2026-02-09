import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { getTrack } from "../../tracks/getTrack.js";
import { getTrackStreams } from "../../tracks/getStreams.js";
import { getTrackComments } from "../../tracks/getComments.js";
import { createTrackComment } from "../../tracks/createComment.js";
import { getTrackLikes } from "../../tracks/getLikes.js";
import { getTrackReposts } from "../../tracks/getReposts.js";
import { getRelatedTracks } from "../../tracks/getRelated.js";
import { updateTrack } from "../../tracks/updateTrack.js";
import { deleteTrack } from "../../tracks/deleteTrack.js";
import { likeTrack } from "../../tracks/likeTrack.js";
import { unlikeTrack } from "../../tracks/unlikeTrack.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("getTrack", () => {
  it("fetches a track", async () => {
    const fn = mockFetch({ json: { id: 1, title: "Song" } });
    const t = await getTrack("tok", 1);
    expect(t.title).toBe("Song");
    expect(fn.mock.calls[0][0]).toContain("/tracks/1");
  });
});

describe("getTrackStreams", () => {
  it("fetches streams", async () => {
    const fn = mockFetch({ json: { hls_mp3_128_url: "https://stream" } });
    const s = await getTrackStreams("tok", 1);
    expect(s.hls_mp3_128_url).toBe("https://stream");
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/streams");
  });
});

describe("getTrackComments", () => {
  it("fetches comments", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1, body: "nice" }], next_href: null } });
    const r = await getTrackComments("tok", 1, 10);
    expect(r.collection[0].body).toBe("nice");
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/comments");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getTrackComments("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("createTrackComment", () => {
  it("creates a comment", async () => {
    const fn = mockFetch({ json: { id: 99, body: "great" } });
    const c = await createTrackComment("tok", 1, "great", 5000);
    expect(c.body).toBe("great");
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/comments");
  });

  it("creates a comment without timestamp", async () => {
    mockFetch({ json: { id: 99, body: "hi" } });
    const c = await createTrackComment("tok", 1, "hi");
    expect(c.body).toBe("hi");
  });
});

describe("getTrackLikes", () => {
  it("fetches likers without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getTrackLikes("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/favoriters");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getTrackLikes("tok", 1, 25);
    expect(fn.mock.calls[0][0]).toContain("limit=25");
  });
});

describe("getTrackReposts", () => {
  it("fetches reposters without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getTrackReposts("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/reposters");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getTrackReposts("tok", 1, 15);
    expect(fn.mock.calls[0][0]).toContain("limit=15");
  });
});

describe("getRelatedTracks", () => {
  it("fetches related tracks", async () => {
    const fn = mockFetch({ json: [{ id: 2, title: "Related" }] });
    const r = await getRelatedTracks("tok", 1, 5);
    expect(r[0].title).toBe("Related");
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/related");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: [] });
    await getRelatedTracks("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/related");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("updateTrack", () => {
  it("updates a track", async () => {
    const fn = mockFetch({ json: { id: 1, title: "New" } });
    const t = await updateTrack("tok", 1, { title: "New" });
    expect(t.title).toBe("New");
    expect(fn.mock.calls[0][0]).toContain("/tracks/1");
  });
});

describe("deleteTrack", () => {
  it("deletes a track", async () => {
    const fn = mockFetch({ json: {} });
    await deleteTrack("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1");
  });
});

describe("likeTrack", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await likeTrack("tok", 1)).toBe(true);
  });

  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: { error: "unauthorized" } });
    expect(await likeTrack("tok", 1)).toBe(false);
  });
});

describe("unlikeTrack", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await unlikeTrack("tok", 1)).toBe(true);
  });

  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: { error: "unauthorized" } });
    expect(await unlikeTrack("tok", 1)).toBe(false);
  });
});
