import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFetchSequence } from "./helpers.js";
import { SoundCloudClient } from "../client/SoundCloudClient.js";
import { paginate, paginateItems, fetchAll } from "../client/paginate.js";
import { scFetchUrl } from "../client/http.js";
import type { SoundCloudPaginatedResponse } from "../types/api.js";

function makePage<T>(collection: T[], next_href: string = ""): SoundCloudPaginatedResponse<T> {
  return { collection, next_href };
}

describe("paginate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("yields multiple pages following next_href", async () => {
    const pages = [
      makePage([1, 2], "https://api.soundcloud.com/page2"),
      makePage([3, 4], "https://api.soundcloud.com/page3"),
      makePage([5, 6]),
    ];
    let callIndex = 0;
    const firstPage = () => Promise.resolve(pages[0]);
    const fetchNext = (_url: string) => Promise.resolve(pages[++callIndex]);

    const result: number[][] = [];
    for await (const page of paginate(firstPage, fetchNext)) {
      result.push(page);
    }

    expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
  });

  it("stops when next_href is null/empty", async () => {
    const firstPage = () => Promise.resolve(makePage(["a", "b"]));
    const fetchNext = vi.fn();

    const result: string[][] = [];
    for await (const page of paginate(firstPage, fetchNext)) {
      result.push(page);
    }

    expect(result).toEqual([["a", "b"]]);
    expect(fetchNext).not.toHaveBeenCalled();
  });
});

describe("paginateItems", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("yields individual items across pages", async () => {
    const pages = [
      makePage([1, 2], "https://next"),
      makePage([3]),
    ];
    let callIndex = 0;
    const firstPage = () => Promise.resolve(pages[0]);
    const fetchNext = () => Promise.resolve(pages[++callIndex]);

    const result: number[] = [];
    for await (const item of paginateItems(firstPage, fetchNext)) {
      result.push(item);
    }

    expect(result).toEqual([1, 2, 3]);
  });
});

describe("fetchAll", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("collects all items into flat array", async () => {
    const pages = [
      makePage([1, 2], "https://next"),
      makePage([3, 4]),
    ];
    let callIndex = 0;
    const firstPage = () => Promise.resolve(pages[0]);
    const fetchNext = () => Promise.resolve(pages[++callIndex]);

    const result = await fetchAll(firstPage, fetchNext);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it("respects maxItems limit", async () => {
    const pages = [
      makePage([1, 2, 3], "https://next"),
      makePage([4, 5, 6]),
    ];
    let callIndex = 0;
    const firstPage = () => Promise.resolve(pages[0]);
    const fetchNext = () => Promise.resolve(pages[++callIndex]);

    const result = await fetchAll(firstPage, fetchNext, { maxItems: 4 });
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it("works with single page (no next_href)", async () => {
    const firstPage = () => Promise.resolve(makePage([10, 20]));
    const fetchNext = vi.fn();

    const result = await fetchAll(firstPage, fetchNext);
    expect(result).toEqual([10, 20]);
    expect(fetchNext).not.toHaveBeenCalled();
  });
});

describe("SoundCloudClient pagination methods", () => {
  let sc: SoundCloudClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    sc = new SoundCloudClient({ clientId: "id", clientSecret: "secret" });
    sc.setToken("test-token");
  });

  it("sc.paginate yields pages via fetch", async () => {
    const fetchMock = mockFetchSequence([
      { json: makePage([{ id: 1 }], "https://api.soundcloud.com/next?cursor=abc") },
      { json: makePage([{ id: 2 }]) },
    ]);

    const pages: unknown[][] = [];
    for await (const page of sc.paginate(() => sc.search.tracks("test"))) {
      pages.push(page);
    }

    expect(pages).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Second call should be to the absolute next_href URL
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.soundcloud.com/next?cursor=abc");
  });

  it("sc.fetchAll collects all pages", async () => {
    mockFetchSequence([
      { json: makePage([{ id: 1 }, { id: 2 }], "https://api.soundcloud.com/next") },
      { json: makePage([{ id: 3 }]) },
    ]);

    const result = await sc.fetchAll(() => sc.search.tracks("test"));
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it("sc.paginateItems yields individual items", async () => {
    mockFetchSequence([
      { json: makePage([{ id: 1 }, { id: 2 }], "https://api.soundcloud.com/next") },
      { json: makePage([{ id: 3 }]) },
    ]);

    const items: unknown[] = [];
    for await (const item of sc.paginateItems(() => sc.search.tracks("test"))) {
      items.push(item);
    }
    expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });
});
