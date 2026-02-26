import { describe, it, expect } from "vitest";
import type { SoundCloudCache, SoundCloudCacheEntry } from "../cache.js";

/**
 * A simple in-memory implementation of SoundCloudCache for testing the interface contract.
 */
class InMemoryCache implements SoundCloudCache {
  private store = new Map<string, SoundCloudCacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as SoundCloudCacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, { ttlMs }: { ttlMs: number }): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  get size() {
    return this.store.size;
  }
}

describe("SoundCloudCache — InMemoryCache implementation", () => {
  it("returns undefined for a missing key", () => {
    const cache = new InMemoryCache();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("returns a stored value before expiry", () => {
    const cache = new InMemoryCache();
    cache.set("key", { id: 1 }, { ttlMs: 5000 });
    expect(cache.get("key")).toEqual({ id: 1 });
  });

  it("returns undefined for an expired entry", () => {
    const cache = new InMemoryCache();
    cache.set("key", "value", { ttlMs: -1 }); // already expired
    expect(cache.get("key")).toBeUndefined();
  });

  it("delete removes the entry", () => {
    const cache = new InMemoryCache();
    cache.set("key", 42, { ttlMs: 5000 });
    cache.delete("key");
    expect(cache.get("key")).toBeUndefined();
  });

  it("overwriting a key replaces the value", () => {
    const cache = new InMemoryCache();
    cache.set("key", "first", { ttlMs: 5000 });
    cache.set("key", "second", { ttlMs: 5000 });
    expect(cache.get("key")).toBe("second");
  });

  it("stores values of different types", () => {
    const cache = new InMemoryCache();
    cache.set("str", "hello", { ttlMs: 5000 });
    cache.set("num", 99, { ttlMs: 5000 });
    cache.set("arr", [1, 2, 3], { ttlMs: 5000 });
    cache.set("obj", { a: 1 }, { ttlMs: 5000 });

    expect(cache.get("str")).toBe("hello");
    expect(cache.get("num")).toBe(99);
    expect(cache.get<number[]>("arr")).toEqual([1, 2, 3]);
    expect(cache.get("obj")).toEqual({ a: 1 });
  });

  it("evicts expired entry on next get", () => {
    const cache = new InMemoryCache();
    cache.set("key", "val", { ttlMs: -100 });
    expect(cache.size).toBe(1);
    cache.get("key"); // triggers eviction
    expect(cache.size).toBe(0);
  });
});

describe("SoundCloudCacheEntry type contract", () => {
  it("has value and expiresAt fields", () => {
    const entry: SoundCloudCacheEntry<string> = { value: "test", expiresAt: Date.now() + 1000 };
    expect(entry.value).toBe("test");
    expect(typeof entry.expiresAt).toBe("number");
  });
});
