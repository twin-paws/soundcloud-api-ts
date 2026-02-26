/**
 * Deduplicates concurrent in-flight requests with the same key.
 *
 * When multiple callers request the same resource simultaneously,
 * only one underlying promise is created — all callers share the result.
 * The key is cleaned up automatically once the promise settles.
 *
 * @example
 * ```ts
 * const deduper = new InFlightDeduper();
 *
 * // Both calls share a single fetch:
 * const [a, b] = await Promise.all([
 *   deduper.add('track:123', () => fetchTrack(123)),
 *   deduper.add('track:123', () => fetchTrack(123)),
 * ]);
 * // a === b (same resolved value)
 * ```
 */
export class InFlightDeduper {
  private inFlight = new Map<string, Promise<unknown>>();

  /**
   * Return an existing in-flight promise for `key`, or start a new one via `factory`.
   * The entry is removed from the map once the promise settles (resolve or reject).
   */
  add<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = factory().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  /** Number of currently in-flight requests */
  get size(): number {
    return this.inFlight.size;
  }
}
