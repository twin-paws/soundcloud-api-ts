import type { SoundCloudPaginatedResponse } from "../types/api.js";
import { scFetchUrl } from "./http.js";

/**
 * Async generator that follows `next_href` automatically, yielding each page's `collection`.
 */
export async function* paginate<T>(
  firstPage: () => Promise<SoundCloudPaginatedResponse<T>>,
  fetchNext: (url: string) => Promise<SoundCloudPaginatedResponse<T>>,
): AsyncGenerator<T[], void, undefined> {
  let page = await firstPage();
  yield page.collection;

  while (page.next_href) {
    page = await fetchNext(page.next_href);
    yield page.collection;
  }
}

/**
 * Async generator that yields individual items across all pages.
 */
export async function* paginateItems<T>(
  firstPage: () => Promise<SoundCloudPaginatedResponse<T>>,
  fetchNext: (url: string) => Promise<SoundCloudPaginatedResponse<T>>,
): AsyncGenerator<T, void, undefined> {
  for await (const page of paginate(firstPage, fetchNext)) {
    for (const item of page) {
      yield item;
    }
  }
}

/**
 * Collects all pages into a single flat array with an optional max items limit.
 */
export async function fetchAll<T>(
  firstPage: () => Promise<SoundCloudPaginatedResponse<T>>,
  fetchNext: (url: string) => Promise<SoundCloudPaginatedResponse<T>>,
  options?: { maxItems?: number },
): Promise<T[]> {
  const result: T[] = [];
  const max = options?.maxItems ?? Infinity;

  for await (const page of paginate(firstPage, fetchNext)) {
    for (const item of page) {
      result.push(item);
      if (result.length >= max) return result;
    }
  }

  return result;
}
