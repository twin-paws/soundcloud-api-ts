import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { searchTracks } from "../../search/searchTracks.js";
import { searchUsers } from "../../search/searchUsers.js";
import { searchPlaylists } from "../../search/searchPlaylists.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("searchTracks", () => {
  it("searches tracks", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1, title: "Hit" }], next_href: null } });
    const r = await searchTracks("tok", "lofi");
    expect(r.collection[0].title).toBe("Hit");
    expect(fn.mock.calls[0][0]).toContain("q=lofi");
  });

  it("supports pagination", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await searchTracks("tok", "lofi", 2);
    expect(fn.mock.calls[0][0]).toContain("offset=20");
  });
});

describe("searchUsers", () => {
  it("searches users", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1, username: "dj" }], next_href: null } });
    const r = await searchUsers("tok", "dj");
    expect(r.collection[0].username).toBe("dj");
    expect(fn.mock.calls[0][0]).toContain("q=dj");
  });

  it("works with pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await searchUsers("tok", "dj", 2);
    expect(fn.mock.calls[0][0]).toContain("offset=20");
  });

  it("does not add offset for pageNumber=0", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await searchUsers("tok", "dj", 0);
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });

  it("does not add offset for undefined pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await searchUsers("tok", "dj");
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });
});

describe("searchPlaylists", () => {
  it("searches playlists without pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1, title: "Mix" }], next_href: null } });
    const r = await searchPlaylists("tok", "chill");
    expect(r.collection[0].title).toBe("Mix");
    expect(fn.mock.calls[0][0]).toContain("q=chill");
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });

  it("works with pageNumber", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await searchPlaylists("tok", "chill", 3);
    expect(fn.mock.calls[0][0]).toContain("offset=30");
  });

  it("does not add offset for pageNumber=0", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await searchPlaylists("tok", "chill", 0);
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });
});
