import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundCloudClient } from "../client/SoundCloudClient.js";
import { mockFetch, mockFetchSequence } from "./helpers.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("SoundCloudClient", () => {
  it("setToken and accessToken/refreshToken getters", () => {
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    expect(c.accessToken).toBeUndefined();
    c.setToken("at", "rt");
    expect(c.accessToken).toBe("at");
    expect(c.refreshToken).toBe("rt");
  });

  it("clearToken clears both tokens", () => {
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("at", "rt");
    c.clearToken();
    expect(c.accessToken).toBeUndefined();
    expect(c.refreshToken).toBeUndefined();
  });

  it("methods use stored token", async () => {
    const fn = mockFetch({ json: { id: 1 } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("stored-tok");
    await c.users.getUser(1);
    expect(fn.mock.calls[0][1].headers.Authorization).toBe("OAuth stored-tok");
  });

  it("token override via options", async () => {
    const fn = mockFetch({ json: { id: 1 } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("stored");
    await c.users.getUser(1, { token: "override-tok" });
    expect(fn.mock.calls[0][1].headers.Authorization).toBe("OAuth override-tok");
  });

  it("throws when no token available", async () => {
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    await expect(c.users.getUser(1)).rejects.toThrow("No access token available");
  });

  it("me.getActivitiesOwn calls correct path", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null, future_href: null } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("tok");
    await c.me.getActivitiesOwn(5);
    expect(fn.mock.calls[0][0]).toContain("/me/activities/all/own");
    expect(fn.mock.calls[0][0]).toContain("limit=5");
  });

  it("me.getActivitiesTracks calls correct path", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null, future_href: null } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("tok");
    await c.me.getActivitiesTracks(10);
    expect(fn.mock.calls[0][0]).toContain("/me/activities/tracks");
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("me.getFollowingsTracks calls correct path", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("tok");
    await c.me.getFollowingsTracks(5);
    expect(fn.mock.calls[0][0]).toContain("/me/followings/tracks");
    expect(fn.mock.calls[0][0]).toContain("limit=5");
  });

  it("me.getActivitiesOwn without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null, future_href: null } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("tok");
    await c.me.getActivitiesOwn();
    expect(fn.mock.calls[0][0]).toContain("/me/activities/all/own");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("me.getActivitiesTracks without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null, future_href: null } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("tok");
    await c.me.getActivitiesTracks();
    expect(fn.mock.calls[0][0]).toContain("/me/activities/tracks");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("me.getFollowingsTracks without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    c.setToken("tok");
    await c.me.getFollowingsTracks();
    expect(fn.mock.calls[0][0]).toContain("/me/followings/tracks");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("onTokenRefresh auto-retries on 401", async () => {
    const fn = mockFetchSequence([
      { status: 401, statusText: "Unauthorized", ok: false },
      { json: { id: 1 } },
    ]);
    const refreshFn = vi.fn().mockResolvedValue({ access_token: "new-tok", refresh_token: "new-rt" });
    const c = new SoundCloudClient({ clientId: "cid", clientSecret: "cs", onTokenRefresh: refreshFn });
    c.setToken("old-tok");
    const r = await c.users.getUser(1);
    expect(r).toEqual({ id: 1 });
    expect(refreshFn).toHaveBeenCalled();
    expect(c.accessToken).toBe("new-tok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
