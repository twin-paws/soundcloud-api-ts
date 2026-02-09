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
});

describe("searchPlaylists", () => {
  it("searches playlists", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1, title: "Mix" }], next_href: null } });
    const r = await searchPlaylists("tok", "chill");
    expect(r.collection[0].title).toBe("Mix");
    expect(fn.mock.calls[0][0]).toContain("q=chill");
  });
});
