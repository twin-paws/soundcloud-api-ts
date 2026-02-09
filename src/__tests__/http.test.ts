import { describe, it, expect, vi, beforeEach } from "vitest";
import { scFetch, scFetchUrl } from "../client/http.js";
import { SoundCloudError } from "../errors.js";
import { mockFetch, mockFetchSequence } from "./helpers.js";

/* Helper: mock fetch where response.json() throws */
function mockFetchJsonThrows(overrides: { status?: number; statusText?: string; ok?: boolean } = {}) {
  const status = overrides.status ?? 400;
  const ok = overrides.ok ?? false;
  const fn = vi.fn().mockResolvedValue({
    status,
    statusText: overrides.statusText ?? "Bad Request",
    ok,
    json: vi.fn().mockRejectedValue(new Error("invalid json")),
    headers: { get: () => null },
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => { vi.restoreAllMocks(); });

describe("scFetch", () => {
  it("makes GET requests", async () => {
    const fn = mockFetch({ json: { id: 1 } });
    const result = await scFetch({ path: "/tracks/1", method: "GET", token: "tok" });
    expect(result).toEqual({ id: 1 });
    expect(fn).toHaveBeenCalledWith("https://api.soundcloud.com/tracks/1", expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({ Authorization: "OAuth tok" }),
    }));
  });

  it("makes POST with JSON body", async () => {
    const fn = mockFetch({ json: { ok: true } });
    await scFetch({ path: "/test", method: "POST", token: "tok", body: { foo: "bar" } });
    const call = fn.mock.calls[0][1];
    expect(call.method).toBe("POST");
    expect(call.body).toBe('{"foo":"bar"}');
    expect(call.headers["Content-Type"]).toBe("application/json");
  });

  it("makes POST with URLSearchParams", async () => {
    const fn = mockFetch({ json: { ok: true } });
    const params = new URLSearchParams({ grant_type: "client_credentials" });
    await scFetch({ path: "/oauth2/token", method: "POST", body: params });
    const call = fn.mock.calls[0][1];
    expect(call.body).toBeInstanceOf(URLSearchParams);
    expect(call.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
  });

  it("makes PUT requests", async () => {
    const fn = mockFetch({ json: { updated: true } });
    await scFetch({ path: "/tracks/1", method: "PUT", token: "tok", body: { track: {} } });
    expect(fn.mock.calls[0][1].method).toBe("PUT");
  });

  it("makes DELETE requests", async () => {
    const fn = mockFetch({ json: { deleted: true } });
    await scFetch({ path: "/tracks/1", method: "DELETE", token: "tok" });
    expect(fn.mock.calls[0][1].method).toBe("DELETE");
  });

  it("handles 204 no content", async () => {
    mockFetch({ status: 204, statusText: "No Content" });
    const result = await scFetch({ path: "/test", method: "DELETE", token: "tok" });
    expect(result).toBeUndefined();
  });

  it("handles 302 redirect", async () => {
    mockFetch({ status: 302, headers: { location: "https://example.com/resolved" }, ok: false });
    const result = await scFetch({ path: "/resolve?url=test", method: "GET", token: "tok" });
    expect(result).toBe("https://example.com/resolved");
  });

  it("handles 302 without location header", async () => {
    mockFetch({ status: 302, ok: false });
    await expect(
      scFetch({ path: "/test", method: "GET", token: "tok" }, { getToken: () => "tok", setToken: () => {}, retry: { maxRetries: 0, retryBaseDelay: 0 } }),
    ).rejects.toThrow(SoundCloudError);
  });

  it("throws SoundCloudError on non-ok response", async () => {
    mockFetch({ status: 404, statusText: "Not Found", ok: false });
    await expect(
      scFetch(
        { path: "/bad", method: "GET", token: "tok" },
        { getToken: () => "tok", setToken: () => {}, retry: { maxRetries: 0, retryBaseDelay: 0 } },
      ),
    ).rejects.toThrow(SoundCloudError);
  });
});

describe("scFetchUrl", () => {
  it("fetches JSON from a URL", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    const result = await scFetchUrl("https://api.soundcloud.com/me/tracks?linked_partitioning=true", "tok");
    expect(result).toEqual({ collection: [], next_href: null });
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/me/tracks?linked_partitioning=true");
  });

  it("falls back to exponential backoff when retry-after is NaN", async () => {
    mockFetchSequence([
      { status: 429, statusText: "Too Many Requests", ok: false, json: { error: "rate limit" }, headers: { "retry-after": "not-a-number" } },
      { status: 200, json: { ok: true } },
    ]);
    const result = await scFetchUrl("https://api.soundcloud.com/test", "tok", { maxRetries: 1, retryBaseDelay: 1 });
    expect(result).toEqual({ ok: true });
  });

  it("throws SoundCloudError after retries exhausted on 429", async () => {
    mockFetchSequence([
      { status: 429, statusText: "Too Many Requests", ok: false, json: { error: "rate limit" } },
      { status: 429, statusText: "Too Many Requests", ok: false, json: { error: "rate limit" } },
    ]);
    await expect(
      scFetchUrl("https://api.soundcloud.com/test", "tok", { maxRetries: 1, retryBaseDelay: 1 }),
    ).rejects.toThrow(SoundCloudError);
  });

  it("throws SoundCloudError after retries exhausted on 500", async () => {
    mockFetchSequence([
      { status: 500, statusText: "Internal Server Error", ok: false, json: { error: "server error" } },
      { status: 500, statusText: "Internal Server Error", ok: false, json: { error: "server error" } },
    ]);
    await expect(
      scFetchUrl("https://api.soundcloud.com/test", "tok", { maxRetries: 1, retryBaseDelay: 1 }),
    ).rejects.toThrow(SoundCloudError);
  });

  it("works without token", async () => {
    const fn = mockFetch({ json: { id: 1 } });
    await scFetchUrl("https://api.soundcloud.com/test");
    expect(fn.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("returns redirect location on 302", async () => {
    mockFetch({ status: 302, headers: { location: "https://cdn.example.com/file" }, ok: false });
    const result = await scFetchUrl("https://api.soundcloud.com/resolve?url=x", "tok");
    expect(result).toBe("https://cdn.example.com/file");
  });

  it("handles 302 without location header", async () => {
    mockFetch({ status: 302, ok: false });
    await expect(
      scFetchUrl("https://api.soundcloud.com/test", "tok", { maxRetries: 0, retryBaseDelay: 0 }),
    ).rejects.toThrow(SoundCloudError);
  });

  it("returns undefined on 204", async () => {
    mockFetch({ status: 204, statusText: "No Content" });
    const result = await scFetchUrl("https://api.soundcloud.com/test", "tok");
    expect(result).toBeUndefined();
  });

  it("throws SoundCloudError on non-retryable error", async () => {
    mockFetch({ status: 403, statusText: "Forbidden", ok: false, json: { error: "forbidden" } });
    await expect(
      scFetchUrl("https://api.soundcloud.com/test", "tok", { maxRetries: 0, retryBaseDelay: 0 }),
    ).rejects.toThrow(SoundCloudError);
  });
});

describe("parseErrorBody catch branch", () => {
  it("returns undefined in error body when response.json() throws", async () => {
    mockFetchJsonThrows({ status: 403, statusText: "Forbidden" });
    const err = await scFetch(
      { path: "/bad", method: "GET", token: "tok" },
      { getToken: () => "tok", setToken: () => {}, retry: { maxRetries: 0, retryBaseDelay: 0 } },
    ).catch((e: SoundCloudError) => e);
    expect(err).toBeInstanceOf(SoundCloudError);
    expect((err as SoundCloudError).status).toBe(403);
    expect((err as SoundCloudError).body).toBeUndefined();
  });
});

describe("scFetch body handling", () => {
  it("passes FormData body without Content-Type header", async () => {
    const fn = mockFetch({ json: { ok: true } });
    const formData = new FormData();
    formData.append("file", "data");
    await scFetch({ path: "/test", method: "POST", token: "tok", body: formData as unknown as Record<string, unknown> });
    const call = fn.mock.calls[0][1];
    expect(call.body).toBeInstanceOf(FormData);
    expect(call.headers["Content-Type"]).toBeUndefined();
  });

  it("sets Content-Type from contentType option without body", async () => {
    const fn = mockFetch({ json: { ok: true } });
    await scFetch({ path: "/test", method: "POST", token: "tok", contentType: "text/plain" });
    const call = fn.mock.calls[0][1];
    expect(call.headers["Content-Type"]).toBe("text/plain");
    expect(call.body).toBeUndefined();
  });
});
