/**
 * A cache entry with an expiration timestamp.
 */
export interface SoundCloudCacheEntry<T> {
  /** The cached value */
  value: T;
  /** Unix timestamp (ms) when this entry expires */
  expiresAt: number;
}

/**
 * Cache interface for SoundCloud API responses.
 *
 * Implement this interface to plug in any caching backend (in-memory, Redis, etc.).
 * Pass an instance as `cache` in {@link SoundCloudClientConfig} to enable caching.
 *
 * @example
 * ```ts
 * // Simple in-memory implementation
 * class SimpleCache implements SoundCloudCache {
 *   private store = new Map<string, SoundCloudCacheEntry<unknown>>();
 *
 *   get<T>(key: string): T | undefined {
 *     const entry = this.store.get(key) as SoundCloudCacheEntry<T> | undefined;
 *     if (!entry || Date.now() > entry.expiresAt) return undefined;
 *     return entry.value;
 *   }
 *
 *   set<T>(key: string, value: T, { ttlMs }: { ttlMs: number }): void {
 *     this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
 *   }
 *
 *   delete(key: string): void {
 *     this.store.delete(key);
 *   }
 * }
 * ```
 */
export interface SoundCloudCache {
  /** Retrieve a cached value by key, or `undefined` if missing or expired */
  get<T>(key: string): Promise<T | undefined> | T | undefined;
  /** Store a value with a TTL in milliseconds */
  set<T>(key: string, value: T, options: { ttlMs: number }): Promise<void> | void;
  /** Remove a cached entry */
  delete(key: string): Promise<void> | void;
}
