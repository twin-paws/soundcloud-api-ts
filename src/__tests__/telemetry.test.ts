import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFetch, mockFetchSequence } from "./helpers.js";
import { SoundCloudClient } from "../client/SoundCloudClient.js";
import { scFetch, scFetchUrl } from "../client/http.js";
import type { SCRequestTelemetry } from "../index.js";

describe("Telemetry (onRequest)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fires on successful API calls", async () => {
    const onRequest = vi.fn();
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
      onRequest,
    });
    mockFetch({ status: 200, json: { id: 123, title: "test" } });

    await client.tracks.getTrack("123", { token: "tok" });

    expect(onRequest).toHaveBeenCalledOnce();
    const t = onRequest.mock.calls[0][0] as SCRequestTelemetry;
    expect(t.method).toBe("GET");
    expect(t.path).toContain("/tracks/123");
    expect(t.status).toBe(200);
    expect(t.retryCount).toBe(0);
    expect(t.durationMs).toEqual(expect.any(Number));
    expect(t.error).toBeUndefined();
  });

  it("fires on error (non-retryable 4xx)", async () => {
    const onRequest = vi.fn();
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
      onRequest,
    });
    mockFetch({ status: 404, statusText: "Not Found", json: { errors: [] } });

    await expect(client.tracks.getTrack("999", { token: "tok" })).rejects.toThrow();

    expect(onRequest).toHaveBeenCalledOnce();
    const t = onRequest.mock.calls[0][0] as SCRequestTelemetry;
    expect(t.status).toBe(404);
    expect(t.error).toEqual(expect.any(String));
  });

  it("fires on 429 with retries via scFetch", async () => {
    const onRequest = vi.fn();
    mockFetchSequence([
      { status: 429, statusText: "Too Many Requests", json: {} },
      { status: 429, statusText: "Too Many Requests", json: {} },
      { status: 200, json: { id: 1 } },
    ]);

    const result = await scFetch(
      { path: "/tracks/1", method: "GET", token: "tok" },
      { getToken: () => "tok", setToken: () => {}, retry: { maxRetries: 3, retryBaseDelay: 1 } },
      onRequest,
    );

    expect(onRequest).toHaveBeenCalledOnce();
    const t = onRequest.mock.calls[0][0] as SCRequestTelemetry;
    expect(t.retryCount).toBe(2);
    expect(t.status).toBe(200);
  });

  it("fires on auth calls (getClientToken)", async () => {
    const onRequest = vi.fn();
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
      onRequest,
    });
    mockFetch({ status: 200, json: { access_token: "tok" } });

    await client.auth.getClientToken();

    expect(onRequest).toHaveBeenCalled();
    const calls = onRequest.mock.calls.map((c: unknown[]) => c[0] as SCRequestTelemetry);
    expect(calls.some((t) => t.path.includes("/oauth/token"))).toBe(true);
  });

  it("fires on auth calls (getUserToken)", async () => {
    const onRequest = vi.fn();
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
      redirectUri: "http://localhost/callback",
      onRequest,
    });
    mockFetch({ status: 200, json: { access_token: "tok" } });

    await client.auth.getUserToken("code");

    expect(onRequest).toHaveBeenCalled();
    const calls = onRequest.mock.calls.map((c: unknown[]) => c[0] as SCRequestTelemetry);
    expect(calls.some((t) => t.path.includes("/oauth/token"))).toBe(true);
  });

  it("fires on auth calls (refreshUserToken)", async () => {
    const onRequest = vi.fn();
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
      onRequest,
    });
    mockFetch({ status: 200, json: { access_token: "newtok", refresh_token: "newrt" } });

    await client.auth.refreshUserToken("rt");

    expect(onRequest).toHaveBeenCalled();
    const calls = onRequest.mock.calls.map((c: unknown[]) => c[0] as SCRequestTelemetry);
    expect(calls.some((t) => t.path.includes("/oauth/token"))).toBe(true);
  });

  it("fires on 401 auto-refresh (two telemetry events)", async () => {
    const onRequest = vi.fn();
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
      onRequest,
      onTokenRefresh: async () => ({ access_token: "newtok", refresh_token: "newrt" }),
    });
    client.setToken("oldtok", "oldrt");

    mockFetchSequence([
      { status: 401, statusText: "Unauthorized", json: { error: "unauthorized" } },
      { status: 200, json: { access_token: "newtok", refresh_token: "newrt" } },
      { status: 200, json: { id: 123, title: "test" } },
    ]);

    await client.tracks.getTrack("123");

    expect(onRequest.mock.calls.length).toBeGreaterThanOrEqual(2);
    const statuses = onRequest.mock.calls.map((c: unknown[]) => (c[0] as SCRequestTelemetry).status);
    expect(statuses).toContain(401);
    expect(statuses).toContain(200);
  });

  it("fires on scFetchUrl (pagination)", async () => {
    const onRequest = vi.fn();
    mockFetch({ status: 200, json: { collection: [], next_href: null } });

    await scFetchUrl(
      "https://api.soundcloud.com/tracks?offset=50",
      "tok",
      undefined,
      onRequest,
    );

    expect(onRequest).toHaveBeenCalledOnce();
    const t = onRequest.mock.calls[0][0] as SCRequestTelemetry;
    expect(t.method).toBe("GET");
    expect(t.path).toContain("https://api.soundcloud.com/tracks?offset=50");
  });

  it("emits separate telemetry for multiple API calls", async () => {
    const onRequest = vi.fn();
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
      onRequest,
    });

    mockFetch({ status: 200, json: { id: 1 } });
    await client.tracks.getTrack("1", { token: "tok" });

    mockFetch({ status: 200, json: { id: 2 } });
    await client.tracks.getTrack("2", { token: "tok" });

    mockFetch({ status: 200, json: { id: 3, username: "u" } });
    await client.users.getUser("3", { token: "tok" });

    expect(onRequest.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("does not crash when no onRequest callback provided", async () => {
    const client = new SoundCloudClient({
      clientId: "cid",
      clientSecret: "cs",
    });
    mockFetch({ status: 200, json: { id: 1 } });

    await expect(client.tracks.getTrack("1", { token: "tok" })).resolves.toBeDefined();
  });

  it("SCRequestTelemetry type is exported and usable", () => {
    const t: SCRequestTelemetry = {
      method: "GET",
      path: "/test",
      durationMs: 100,
      status: 200,
      retryCount: 0,
    };
    expect(t.method).toBe("GET");
  });
});
