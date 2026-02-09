import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { getPlaylist } from "../../playlists/getPlaylist.js";
import { getPlaylistTracks } from "../../playlists/getTracks.js";
import { getPlaylistReposts } from "../../playlists/getReposts.js";
import { createPlaylist } from "../../playlists/createPlaylist.js";
import { updatePlaylist } from "../../playlists/updatePlaylist.js";
import { deletePlaylist } from "../../playlists/deletePlaylist.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("getPlaylist", () => {
  it("fetches a playlist", async () => {
    const fn = mockFetch({ json: { id: 1, title: "PL" } });
    const p = await getPlaylist("tok", 1);
    expect(p.title).toBe("PL");
    expect(fn.mock.calls[0][0]).toContain("/playlists/1");
  });
});

describe("getPlaylistTracks", () => {
  it("fetches playlist tracks", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1 }], next_href: null } });
    await getPlaylistTracks("tok", 1, 10, 5);
    expect(fn.mock.calls[0][0]).toContain("/playlists/1/tracks");
    expect(fn.mock.calls[0][0]).toContain("offset=5");
  });

  it("works without limit and offset", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getPlaylistTracks("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
    expect(fn.mock.calls[0][0]).not.toContain("offset=");
  });
});

describe("getPlaylistReposts", () => {
  it("fetches reposters without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getPlaylistReposts("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("/playlists/1/reposters");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getPlaylistReposts("tok", 1, 20);
    expect(fn.mock.calls[0][0]).toContain("limit=20");
  });
});

describe("createPlaylist", () => {
  it("creates a playlist", async () => {
    const fn = mockFetch({ json: { id: 99, title: "New" } });
    const p = await createPlaylist("tok", { title: "New" });
    expect(p.title).toBe("New");
    expect(fn.mock.calls[0][0]).toContain("/playlists");
  });
});

describe("updatePlaylist", () => {
  it("updates a playlist", async () => {
    const fn = mockFetch({ json: { id: 1, title: "Updated" } });
    const p = await updatePlaylist("tok", 1, { title: "Updated" });
    expect(p.title).toBe("Updated");
    expect(fn.mock.calls[0][0]).toContain("/playlists/1");
  });
});

describe("deletePlaylist", () => {
  it("deletes a playlist", async () => {
    const fn = mockFetch({ json: {} });
    await deletePlaylist("tok", 1);
    expect(fn.mock.calls[0][0]).toContain("/playlists/1");
  });
});
