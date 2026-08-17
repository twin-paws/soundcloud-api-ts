/** Shared query-string builder for official search endpoints. */

export const SEARCH_LIMIT_MIN = 1;
export const SEARCH_LIMIT_MAX = 200;
export const SEARCH_LIMIT_DEFAULT = 10;

export interface SearchQueryOptions {
  /** Page size (1–200). Default 10 (official examples use 10; spec default is 50). */
  limit?: number;
  /**
   * Filter by track access. Official search examples send `playable`.
   * Omit for user search (not in the spec).
   */
  access?: string;
}

export function buildSearchQuery(
  query: string,
  pageNumber?: number,
  options?: SearchQueryOptions,
): string {
  const limit = options?.limit ?? SEARCH_LIMIT_DEFAULT;
  if (limit < SEARCH_LIMIT_MIN || limit > SEARCH_LIMIT_MAX) {
    throw new Error(`search: limit must be between ${SEARCH_LIMIT_MIN} and ${SEARCH_LIMIT_MAX}`);
  }
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("linked_partitioning", "true");
  params.set("limit", String(limit));
  if (options?.access) params.set("access", options.access);
  if (pageNumber && pageNumber > 0) params.set("offset", String(limit * pageNumber));
  return params.toString();
}
