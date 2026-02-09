import type { SoundCloudPaginatedResponse } from "../types/api.js";

/**
 * Async generator that automatically follows `next_href` pagination,
 * yielding each page's `collection` array.
 *
 * @param firstPage - Function that fetches the first page of results
 * @param fetchNext - Function that fetches subsequent pages given a `next_href` URL
 * @returns An async generator yielding arrays of items (one per page)
 *
 * @example
 * ```ts
 * import { paginate, searchTracks, scFetchUrl } from 'soundcloud-api-ts';
 *
 * const pages = paginate(
 *   () => searchTracks(token, 'lofi'),
 *   (url) => scFetchUrl(url, token),
 * );
 *
 * for await (const page of pages) {
 *   console.log(`Got ${page.length} tracks`);
 * }
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api
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
 * Async generator that yields individual items across all pages,
 * automatically following `next_href` pagination.
 *
 * @param firstPage - Function that fetches the first page of results
 * @param fetchNext - Function that fetches subsequent pages given a `next_href` URL
 * @returns An async generator yielding individual items
 *
 * @example
 * ```ts
 * import { paginateItems, searchTracks, scFetchUrl } from 'soundcloud-api-ts';
 *
 * const tracks = paginateItems(
 *   () => searchTracks(token, 'lofi'),
 *   (url) => scFetchUrl(url, token),
 * );
 *
 * for await (const track of tracks) {
 *   console.log(track.title);
 * }
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api
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
 * Collects all pages into a single flat array, with an optional maximum item limit.
 *
 * @param firstPage - Function that fetches the first page of results
 * @param fetchNext - Function that fetches subsequent pages given a `next_href` URL
 * @param options - Optional configuration
 * @param options.maxItems - Maximum number of items to collect (defaults to all)
 * @returns A promise that resolves to a flat array of all collected items
 *
 * @example
 * ```ts
 * import { fetchAll, searchTracks, scFetchUrl } from 'soundcloud-api-ts';
 *
 * const allTracks = await fetchAll(
 *   () => searchTracks(token, 'lofi'),
 *   (url) => scFetchUrl(url, token),
 *   { maxItems: 100 },
 * );
 * console.log(`Fetched ${allTracks.length} tracks`);
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api
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
