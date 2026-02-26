import { describe, it, expect, vi, beforeEach } from "vitest";
import { RawClient } from "../raw.js";

function makeFetch(response: {
  status?: number;
  ok?: boolean;
  json?: unknown;
  headers?: Record<string, string>;
}) {
  const status = response.status ?? 200;
  const ok = response.ok ?? status >= 200 && status < 300;
  const headersMap = new Map(Object.entries(response.headers ?? {}));

  return vi.fn().mockResolvedValue({
    status,
    ok,
    json: vi.fn().mockResolvedValue(response.json ?? {}),
    headers: {
      get: (key: string) => headersMap.get(key.toLowerCase()) ?? null,
      forEach: (cb: (v: string, k: string) => void) => headersMap.forEach((v, k) => cb(v, k)),
    },
  });
}

function makeClient(fetchFn = makeFetch({})) {
  return {
    client: new RawClient("https://api.soundcloud.com", () => "test-token", fetchFn as unknown as typeof fetch),
    fetchFn,
  };
}

beforeEach(() => { vi.restoreAllMocks(); });

describe("RawClient.request — path templating", () => {
  it("substitutes {id} from query into path", async () => {
    const fetchFn = makeFetch({ json: { id: 123 } });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    await client.request({ method: "GET", path: "/tracks/{id}", query: { id: 123 } });

    const calledUrl = (fetchFn.mock.calls[0] as [string, unknown])[0];
    expect(calledUrl).toContain("/tracks/123");
    expect(calledUrl).not.toContain("{id}");
  });

  it("leaves unused query params as search params", async () => {
    const fetchFn = makeFetch({ json: {} });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    await client.request({ method: "GET", path: "/tracks", query: { limit: 10, q: "lofi" } });

    const calledUrl = (fetchFn.mock.calls[0] as [string, unknown])[0];
    expect(calledUrl).toContain("limit=10");
    expect(calledUrl).toContain("q=lofi");
  });

  it("substitutes multiple placeholders", async () => {
    const fetchFn = makeFetch({ json: {} });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    await client.request({ method: "GET", path: "/users/{userId}/tracks/{trackId}", query: { userId: 1, trackId: 2 } });

    const calledUrl = (fetchFn.mock.calls[0] as [string, unknown])[0];
    expect(calledUrl).toContain("/users/1/tracks/2");
  });

  it("skips undefined query values", async () => {
    const fetchFn = makeFetch({ json: {} });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    await client.request({ method: "GET", path: "/tracks", query: { limit: undefined, q: "test" } });

    const calledUrl = (fetchFn.mock.calls[0] as [string, unknown])[0];
    expect(calledUrl).not.toContain("limit");
    expect(calledUrl).toContain("q=test");
  });
});

describe("RawClient.request — response shape", () => {
  it("returns data, status, and headers", async () => {
    const fetchFn = makeFetch({ status: 200, json: { title: "Test" }, headers: { "content-type": "application/json" } });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    const res = await client.request({ method: "GET", path: "/tracks/1" });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ title: "Test" });
    expect(res.headers["content-type"]).toBe("application/json");
  });

  it("returns undefined data for 204", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: vi.fn().mockRejectedValue(new Error("no body")),
      headers: {
        get: (key: string) => key === "content-length" ? null : null,
        forEach: vi.fn(),
      },
    });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    const res = await client.request({ method: "DELETE", path: "/tracks/1" });

    expect(res.status).toBe(204);
    expect(res.data).toBeUndefined();
  });

  it("does not throw on non-2xx status", async () => {
    const fetchFn = makeFetch({ status: 404, ok: false, json: { error: "not found" } });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    const res = await client.request({ method: "GET", path: "/tracks/9999" });

    expect(res.status).toBe(404);
    expect(res.data).toEqual({ error: "not found" });
  });

  it("uses explicit token over getToken", async () => {
    const fetchFn = makeFetch({ json: {} });
    const client = new RawClient("https://api.soundcloud.com", () => "stored-token", fetchFn as unknown as typeof fetch);

    await client.request({ method: "GET", path: "/tracks/1", token: "explicit-token" });

    const headers = (fetchFn.mock.calls[0] as [string, { headers: Record<string, string> }])[1].headers;
    expect(headers["Authorization"]).toBe("OAuth explicit-token");
  });
});

describe("RawClient shortcuts", () => {
  it(".get() sends GET", async () => {
    const fetchFn = makeFetch({ json: { id: 1 } });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    const res = await client.get("/tracks/1");

    expect(res.status).toBe(200);
    const opts = (fetchFn.mock.calls[0] as [string, { method: string }])[1];
    expect(opts.method).toBe("GET");
  });

  it(".post() sends POST with JSON body", async () => {
    const fetchFn = makeFetch({ status: 201, json: { id: 2 } });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    await client.post("/tracks", { title: "New Track" });

    const opts = (fetchFn.mock.calls[0] as [string, { method: string; body: string; headers: Record<string, string> }])[1];
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe('{"title":"New Track"}');
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it(".put() sends PUT", async () => {
    const fetchFn = makeFetch({ json: { updated: true } });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    await client.put("/tracks/1", { title: "Updated" });

    const opts = (fetchFn.mock.calls[0] as [string, { method: string }])[1];
    expect(opts.method).toBe("PUT");
  });

  it(".delete() sends DELETE", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 204, ok: true,
      json: vi.fn().mockRejectedValue(new Error()),
      headers: { get: () => null, forEach: vi.fn() },
    });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    const res = await client.delete("/tracks/1");

    expect(res.status).toBe(204);
    const opts = (fetchFn.mock.calls[0] as [string, { method: string }])[1];
    expect(opts.method).toBe("DELETE");
  });

  it(".get() with params appends search params", async () => {
    const fetchFn = makeFetch({ json: [] });
    const client = new RawClient("https://api.soundcloud.com", () => "tok", fetchFn as unknown as typeof fetch);

    await client.get("/tracks", { limit: 5, q: "jazz" });

    const calledUrl = (fetchFn.mock.calls[0] as [string, unknown])[0];
    expect(calledUrl).toContain("limit=5");
    expect(calledUrl).toContain("q=jazz");
  });
});
