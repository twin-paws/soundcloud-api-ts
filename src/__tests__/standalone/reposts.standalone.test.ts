import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { repostTrack, unrepostTrack, repostPlaylist, unrepostPlaylist } from "../../reposts/index.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("repostTrack", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await repostTrack("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await repostTrack("tok", 1)).toBe(false);
  });
});

describe("unrepostTrack", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await unrepostTrack("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await unrepostTrack("tok", 1)).toBe(false);
  });
});

describe("repostPlaylist", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await repostPlaylist("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await repostPlaylist("tok", 1)).toBe(false);
  });
});

describe("unrepostPlaylist", () => {
  it("returns true on success", async () => {
    mockFetch({ json: {} });
    expect(await unrepostPlaylist("tok", 1)).toBe(true);
  });
  it("returns false on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    expect(await unrepostPlaylist("tok", 1)).toBe(false);
  });
});
