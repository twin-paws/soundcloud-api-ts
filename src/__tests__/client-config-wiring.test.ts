import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundCloudClient } from "../client/SoundCloudClient.js";
import type { SoundCloudCache } from "../client/cache.js";
import { mockFetch } from "./helpers.js";

// Pins that the dedupe / cache / fetch config options are actually wired into
// the request path. These options were accepted but silently ignored from
// v1.12.0 through v1.13.4 — these tests prevent that regression class.

const config = { clientId: "cid", clientSecret: "cs" };

function deferredFetch(json: unknown) {
  let release!: () => void;
  const gate = new Promise<void>((res) => { release = () => res(); });
  const fn = vi.fn().mockImplementation(async () => {
    await gate;
    return {
      status: 200,
      statusText: "OK",
      ok: true,
      json: vi.fn().mockResolvedValue(json),
      headers: { get: () => null },
    };
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return { fn, release };
}

beforeEach(() => { vi.restoreAllMocks(); });

describe("dedupe wiring", () => {
  it("concurrent identical GETs share one fetch (default dedupe: true)", async () => {
    const { fn, release } = deferredFetch({ id: 1, title: "t" });
    const sc = new SoundCloudClient(config);
    sc.setToken("tok");

    const p1 = sc.tracks.getTrack(1);
    const p2 = sc.tracks.getTrack(1);
    release();
    const [a, b] = await Promise.all([p1, p2]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("different paths are not deduplicated", async () => {
    const { fn, release } = deferredFetch({ id: 1 });
    const sc = new SoundCloudClient(config);
    sc.setToken("tok");

    const p1 = sc.tracks.getTrack(1);
    const p2 = sc.tracks.getTrack(2);
    release();
    await Promise.all([p1, p2]);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("sequential identical GETs each fetch (dedupe is in-flight only)", async () => {
    const fn = mockFetch({ json: { id: 1 } });
    const sc = new SoundCloudClient(config);
    sc.setToken("tok");

    await sc.tracks.getTrack(1);
    await sc.tracks.getTrack(1);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("dedupe: false disables coalescing", async () => {
    const { fn, release } = deferredFetch({ id: 1 });
    const sc = new SoundCloudClient({ ...config, dedupe: false });
    sc.setToken("tok");

    const p1 = sc.tracks.getTrack(1);
    const p2 = sc.tracks.getTrack(1);
    release();
    await Promise.all([p1, p2]);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("POST requests are never deduplicated", async () => {
    const { fn, release } = deferredFetch({ id: 9 });
    const sc = new SoundCloudClient(config);
    sc.setToken("tok");

    const p1 = sc.tracks.createComment(1, "hi");
    const p2 = sc.tracks.createComment(1, "hi");
    release();
    await Promise.all([p1, p2]);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("cache wiring", () => {
  function makeCache() {
    const store = new Map<string, unknown>();
    const cache: SoundCloudCache & { setCalls: Array<{ key: string; ttlMs: number }> } = {
      setCalls: [],
      get: <T,>(key: string) => store.get(key) as T | undefined,
      set: <T,>(key: string, value: T, { ttlMs }: { ttlMs: number }) => {
        store.set(key, value);
        cache.setCalls.push({ key, ttlMs });
      },
      delete: (key: string) => { store.delete(key); },
    };
    return cache;
  }

  it("caches GET responses and serves repeat calls without fetching", async () => {
    const fn = mockFetch({ json: { id: 1, title: "cached" } });
    const cache = makeCache();
    const sc = new SoundCloudClient({ ...config, cache });
    sc.setToken("tok");

    const first = await sc.tracks.getTrack(1);
    const second = await sc.tracks.getTrack(1);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("passes cacheTtlMs to the cache backend (default 60000)", async () => {
    mockFetch({ json: { id: 1 } });
    const cache = makeCache();
    const sc = new SoundCloudClient({ ...config, cache, cacheTtlMs: 5000 });
    sc.setToken("tok");
    await sc.tracks.getTrack(1);
    expect(cache.setCalls[0].ttlMs).toBe(5000);

    const cache2 = makeCache();
    const sc2 = new SoundCloudClient({ ...config, cache: cache2 });
    sc2.setToken("tok");
    await sc2.tracks.getTrack(1);
    expect(cache2.setCalls[0].ttlMs).toBe(60000);
  });

  it("does not cache POST responses", async () => {
    const fn = mockFetch({ json: { id: 1 } });
    const cache = makeCache();
    const sc = new SoundCloudClient({ ...config, cache });
    sc.setToken("tok");

    await sc.tracks.createComment(1, "hi");
    await sc.tracks.createComment(1, "hi");

    expect(fn).toHaveBeenCalledTimes(2);
    expect(cache.setCalls.length).toBe(0);
  });
});

describe("fetch injection wiring", () => {
  function customFetch(json: unknown) {
    return vi.fn().mockResolvedValue({
      status: 200,
      statusText: "OK",
      ok: true,
      json: vi.fn().mockResolvedValue(json),
      headers: { get: () => null },
    }) as unknown as typeof fetch;
  }

  it("namespace methods use the injected fetch, not globalThis.fetch", async () => {
    const globalFn = mockFetch({ json: { wrong: true } });
    const custom = customFetch({ id: 1, title: "via custom" });
    const sc = new SoundCloudClient({ ...config, fetch: custom });
    sc.setToken("tok");

    const track = await sc.tracks.getTrack(1);

    expect(track.title).toBe("via custom");
    expect(custom).toHaveBeenCalledTimes(1);
    expect(globalFn).not.toHaveBeenCalled();
  });

  it("auth token methods use the injected fetch", async () => {
    const globalFn = mockFetch({ json: { wrong: true } });
    const custom = customFetch({ access_token: "tok-from-custom" });
    const sc = new SoundCloudClient({ ...config, fetch: custom });

    const token = await sc.auth.getClientToken();

    expect(token.access_token).toBe("tok-from-custom");
    expect(globalFn).not.toHaveBeenCalled();
  });

  it("signOut uses the injected fetch", async () => {
    const globalFn = mockFetch({ json: {} });
    const custom = customFetch({});
    const sc = new SoundCloudClient({ ...config, fetch: custom });

    await sc.auth.signOut("tok");

    expect(custom).toHaveBeenCalledTimes(1);
    expect(globalFn).not.toHaveBeenCalled();
  });

  it("pagination next_href fetches use the injected fetch", async () => {
    const globalFn = mockFetch({ json: {} });
    const page2 = { collection: [{ id: 2 }], next_href: undefined };
    const page1 = { collection: [{ id: 1 }], next_href: "https://api.soundcloud.com/page2" };
    const custom = vi.fn()
      .mockResolvedValueOnce({
        status: 200, statusText: "OK", ok: true,
        json: vi.fn().mockResolvedValue(page1),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        status: 200, statusText: "OK", ok: true,
        json: vi.fn().mockResolvedValue(page2),
        headers: { get: () => null },
      }) as unknown as typeof fetch;
    const sc = new SoundCloudClient({ ...config, fetch: custom });
    sc.setToken("tok");

    const all = await sc.fetchAll(() => sc.search.tracks("q"));

    expect(all.length).toBe(2);
    expect(custom).toHaveBeenCalledTimes(2);
    expect(globalFn).not.toHaveBeenCalled();
  });
});

describe("auth retry config wiring", () => {
  it("sc.auth honors configured maxRetries on 5xx", async () => {
    const fn = vi.fn().mockResolvedValue({
      status: 503,
      statusText: "Service Unavailable",
      ok: false,
      json: vi.fn().mockResolvedValue({}),
      headers: { get: () => null },
    });
    globalThis.fetch = fn as unknown as typeof fetch;

    const sc = new SoundCloudClient({ ...config, maxRetries: 0 });
    await expect(sc.auth.getClientToken()).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1); // no retries when maxRetries: 0
  });
});
