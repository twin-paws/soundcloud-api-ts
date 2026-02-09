import { describe, it, expect, vi, beforeEach } from "vitest";
import { scFetch, scFetchUrl } from "../client/http.js";
import { SoundCloudError } from "../errors.js";
import { mockFetch, mockFetchSequence } from "./helpers.js";

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
});
