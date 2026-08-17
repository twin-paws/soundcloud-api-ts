import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { getTrack } from "../../tracks/getTrack.js";
import { getTracks } from "../../tracks/getTracks.js";
import { getTrackStreams } from "../../tracks/getStreams.js";
import { getTrackComments } from "../../tracks/getComments.js";
import { createTrackComment } from "../../tracks/createComment.js";
import { getTrackLikes } from "../../tracks/getLikes.js";
import { getTrackReposts } from "../../tracks/getReposts.js";
import { getRelatedTracks, getRelatedTracksPage } from "../../tracks/getRelated.js";
import { getTrackStreamUrl } from "../../tracks/getStreamUrl.js";
import { getTrackPreviewUrl } from "../../tracks/getPreviewUrl.js";
import { uploadTrack } from "../../tracks/uploadTrack.js";
import { updateTrackStorefront } from "../../tracks/updateStorefront.js";
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

describe("getTracks (batch)", () => {
  it("fetches multiple tracks by ids in one request", async () => {
    const fn = mockFetch({ json: [{ id: 1 }, { id: 2 }] });
    const tracks = await getTracks("tok", [1, 2]);
    expect(tracks.length).toBe(2);
    expect(fn.mock.calls[0][0]).toContain("/tracks?ids=1,2");
  });

  it("throws when more than 200 ids are provided, before any network call", async () => {
    const fn = mockFetch({ json: [] });
    const ids = Array.from({ length: 201 }, (_, i) => i + 1);
    expect(() => getTracks("tok", ids)).toThrow(
      "getTracks: SoundCloud API supports a maximum of 200 IDs per request",
    );
    expect(fn).not.toHaveBeenCalled();
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
    expect(fn.mock.calls[0][0]).toContain("access=playable");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: [] });
    await getRelatedTracks("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/related");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("unwraps a paginated page and defaults missing collection to []", async () => {
    mockFetch({ json: { next_href: "https://next" } });
    expect(await getRelatedTracks("tok", 1)).toEqual([]);
  });
});

describe("getRelatedTracksPage", () => {
  it("returns the official paginated shape and honors access", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 3 }], next_href: "https://next" } });
    const page = await getRelatedTracksPage("tok", 1, { limit: 5, access: "preview" });
    expect(page.collection).toHaveLength(1);
    expect(fn.mock.calls[0][0]).toContain("limit=5");
    expect(fn.mock.calls[0][0]).toContain("access=preview");
  });
});

describe("getTrackStreamUrl", () => {
  it("returns the 302 Location", async () => {
    mockFetch({ status: 302, headers: { location: "https://cf.example/stream" }, ok: false });
    expect(await getTrackStreamUrl("tok", 1)).toBe("https://cf.example/stream");
  });
});

describe("getTrackPreviewUrl", () => {
  it("returns the 302 Location", async () => {
    mockFetch({ status: 302, headers: { location: "https://cf.example/preview" }, ok: false });
    expect(await getTrackPreviewUrl("tok", 1)).toBe("https://cf.example/preview");
  });
});

describe("uploadTrack", () => {
  it("sends multipart FormData including artwork", async () => {
    const fn = mockFetch({ json: { id: 9, title: "Up" } });
    await uploadTrack("tok", {
      title: "Up",
      asset_data: new Uint8Array([1, 2, 3]),
      filename: "a.mp3",
      genre: "Techno",
      streamable: true,
      downloadable: false,
      commentable: true,
      artwork_data: new Uint8Array([9, 9]),
    });
    expect(fn.mock.calls[0][0]).toContain("/tracks");
    expect(fn.mock.calls[0][1].method).toBe("POST");
    expect(fn.mock.calls[0][1].body).toBeInstanceOf(FormData);
    const form = fn.mock.calls[0][1].body as FormData;
    expect(form.get("track[title]")).toBe("Up");
    expect(form.get("track[artwork_data]")).toBeTruthy();
  });

  it("uses File names when asset and artwork are File objects", async () => {
    const fn = mockFetch({ json: { id: 10, title: "File" } });
    const audio = new File([new Uint8Array([1])], "song.mp3", { type: "audio/mpeg" });
    const art = new File([new Uint8Array([2])], "cover.jpg", { type: "image/jpeg" });
    await uploadTrack("tok", { title: "File", asset_data: audio, artwork_data: art });
    const form = fn.mock.calls[0][1].body as FormData;
    const asset = form.get("track[asset_data]") as File;
    const artwork = form.get("track[artwork_data]") as File;
    expect(asset.name).toBe("song.mp3");
    expect(artwork.name).toBe("cover.jpg");
  });
});

describe("updateTrackStorefront", () => {
  it("PUTs storefront JSON", async () => {
    const fn = mockFetch({ json: { track_urn: "soundcloud:tracks:1", title: "Buy", type: "digital", link: "https://x.com" } });
    await updateTrackStorefront("tok", 1, { title: "Buy", type: "digital", link: "https://x.com" });
    expect(fn.mock.calls[0][0]).toContain("/tracks/1/storefront");
    expect(fn.mock.calls[0][1].method).toBe("PUT");
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ title: "Buy", type: "digital", link: "https://x.com" });
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
