import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { likeTrack, unlikeTrack, likePlaylist, unlikePlaylist } from "../../likes/index.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("likeTrack", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await likeTrack("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await likeTrack("tok", 1)).toBe(false);
  });
});

describe("unlikeTrack", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await unlikeTrack("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await unlikeTrack("tok", 1)).toBe(false);
  });
});

describe("likePlaylist", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await likePlaylist("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await likePlaylist("tok", 1)).toBe(false);
  });
});

describe("unlikePlaylist", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await unlikePlaylist("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await unlikePlaylist("tok", 1)).toBe(false);
  });
});
