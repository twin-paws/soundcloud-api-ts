import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toBase64 } from "../utils/base64.js";
import { IMPLEMENTED_OPERATIONS } from "../client/registry.js";
import { scFetch, scFetchUrl } from "../client/http.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("toBase64", () => {
  it("encodes via Buffer when available (Node)", () => {
    expect(toBase64("cid:csecret")).toBe(Buffer.from("cid:csecret").toString("base64"));
  });

  it("falls back to btoa when Buffer is unavailable (edge runtimes)", () => {
    const realBuffer = globalThis.Buffer;
    // @ts-expect-error — simulate an edge runtime without Buffer
    globalThis.Buffer = undefined;
    try {
      expect(toBase64("cid:csecret")).toBe(realBuffer.from("cid:csecret").toString("base64"));
    } finally {
      globalThis.Buffer = realBuffer;
    }
  });
});

describe("IMPLEMENTED_OPERATIONS registry", () => {
  it("is a non-empty list of operation ids", () => {
    expect(Array.isArray(IMPLEMENTED_OPERATIONS)).toBe(true);
    expect(IMPLEMENTED_OPERATIONS.length).toBeGreaterThan(0);
    for (const op of IMPLEMENTED_OPERATIONS) expect(typeof op).toBe("string");
  });
});

describe("_meta response metadata", () => {
  function fetchWithForEachHeaders(json: unknown) {
    const entries: Array<[string, string]> = [["x-ratelimit-remaining", "42"]];
    const fn = vi.fn().mockResolvedValue({
      status: 200,
      statusText: "OK",
      ok: true,
      json: vi.fn().mockResolvedValue(json),
      headers: {
        get: () => null,
        forEach: (cb: (v: string, k: string) => void) => entries.forEach(([k, v]) => cb(v, k)),
      },
    });
    globalThis.fetch = fn as unknown as typeof fetch;
    return fn;
  }

  afterEach(() => { vi.unstubAllGlobals(); });

  it("scFetch attaches non-enumerable _meta with status and headers", async () => {
    fetchWithForEachHeaders({ id: 1 });
    const data = await scFetch<{ id: number }>({ path: "/tracks/1", method: "GET", token: "t" });
    const meta = (data as unknown as { _meta: { status: number; headers: Record<string, string> } })._meta;
    expect(meta.status).toBe(200);
    expect(meta.headers["x-ratelimit-remaining"]).toBe("42");
    expect(Object.keys(data)).not.toContain("_meta");
  });

  it("scFetchUrl attaches non-enumerable _meta with status and headers", async () => {
    fetchWithForEachHeaders({ collection: [] });
    const data = await scFetchUrl<{ collection: unknown[] }>("https://api.soundcloud.com/next", "t");
    const meta = (data as unknown as { _meta: { status: number; headers: Record<string, string> } })._meta;
    expect(meta.status).toBe(200);
    expect(meta.headers["x-ratelimit-remaining"]).toBe("42");
    expect(Object.keys(data)).not.toContain("_meta");
  });
});
