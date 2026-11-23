import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundCloudClient } from "../client/SoundCloudClient.js";
import { IMPLEMENTED_ROUTES } from "../client/registry.js";
import { SoundCloudError } from "../errors.js";
import { getSystemPlaylist } from "../playlists/getSystemPlaylist.js";
import { getMeLikesSystemPlaylists } from "../me/likes.js";
import { getUserLikesSystemPlaylists } from "../users/getLikesSystemPlaylists.js";
import { disconnect } from "../auth/disconnect.js";
import { mockFetch } from "./helpers.js";

const config = { clientId: "cid", clientSecret: "cs" };
const URN = "soundcloud:system-playlists:track-stations:2287580618";
const station = { kind: "system-playlist", urn: URN, title: "Track station", track_count: 1, tracks: [{ id: 1 }] };
const paginated = { collection: [station], next_href: null };

let client: SoundCloudClient;

beforeEach(() => {
  vi.restoreAllMocks();
  client = new SoundCloudClient(config);
  client.setToken("tok");
});

describe("system playlists (client)", () => {
  it("playlists.getSystemPlaylist calls /system-playlists/{id} with the URN", async () => {
    const fn = mockFetch({ json: station });
    const r = await client.playlists.getSystemPlaylist(URN);
    expect(r).toEqual(station);
    expect(fn.mock.calls[0][0]).toBe(`https://api.soundcloud.com/system-playlists/${URN}`);
    expect(fn.mock.calls[0][1].method).toBe("GET");
    expect(fn.mock.calls[0][1].headers.Authorization).toBe("OAuth tok");
  });

  it("playlists.getSystemPlaylist sends the access filter and honours a token override", async () => {
    const fn = mockFetch({ json: station });
    await client.playlists.getSystemPlaylist("track-stations:1", { access: "playable,preview", token: "other" });
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/system-playlists/track-stations:1?access=playable%2Cpreview");
    expect(fn.mock.calls[0][1].headers.Authorization).toBe("OAuth other");
  });

  it("me.getLikesSystemPlaylists calls /me/likes/system-playlists", async () => {
    const fn = mockFetch({ json: paginated });
    const r = await client.me.getLikesSystemPlaylists();
    expect(r.collection[0].urn).toBe(URN);
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/me/likes/system-playlists?linked_partitioning=true");
  });

  it("me.getLikesSystemPlaylists with limit", async () => {
    const fn = mockFetch({ json: paginated });
    await client.me.getLikesSystemPlaylists(10);
    expect(fn.mock.calls[0][0]).toContain("/me/likes/system-playlists?limit=10&linked_partitioning=true");
  });

  it("users.getLikesSystemPlaylists calls /users/{id}/likes/system-playlists", async () => {
    const fn = mockFetch({ json: paginated });
    await client.users.getLikesSystemPlaylists(42);
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/users/42/likes/system-playlists?linked_partitioning=true");
  });

  it("users.getLikesSystemPlaylists with limit", async () => {
    const fn = mockFetch({ json: paginated });
    await client.users.getLikesSystemPlaylists("soundcloud:users:42", 5);
    expect(fn.mock.calls[0][0]).toContain("/users/soundcloud:users:42/likes/system-playlists?limit=5&linked_partitioning=true");
  });
});

describe("system playlists (standalone)", () => {
  it("getSystemPlaylist fetches by id", async () => {
    const fn = mockFetch({ json: station });
    const r = await getSystemPlaylist("tok", URN);
    expect(r.urn).toBe(URN);
    expect(fn.mock.calls[0][0]).toBe(`https://api.soundcloud.com/system-playlists/${URN}`);
  });

  it("getSystemPlaylist passes access", async () => {
    const fn = mockFetch({ json: station });
    await getSystemPlaylist("tok", URN, { access: "playable" });
    expect(fn.mock.calls[0][0]).toContain(`/system-playlists/${URN}?access=playable`);
  });

  it("getMeLikesSystemPlaylists with and without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeLikesSystemPlaylists("tok");
    await getMeLikesSystemPlaylists("tok", 20);
    expect(fn.mock.calls[0][0]).toContain("/me/likes/system-playlists?linked_partitioning=true");
    expect(fn.mock.calls[1][0]).toContain("/me/likes/system-playlists?limit=20&linked_partitioning=true");
  });

  it("getUserLikesSystemPlaylists with and without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getUserLikesSystemPlaylists("tok", 123);
    await getUserLikesSystemPlaylists("tok", 123, 15);
    expect(fn.mock.calls[0][0]).toContain("/users/123/likes/system-playlists?linked_partitioning=true");
    expect(fn.mock.calls[1][0]).toContain("/users/123/likes/system-playlists?limit=15&linked_partitioning=true");
  });
});

describe("disconnect", () => {
  it("auth.disconnect POSTs /disconnect with the given token", async () => {
    const fn = mockFetch({ status: 204 });
    await expect(client.auth.disconnect("tok123")).resolves.toBeUndefined();
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/disconnect");
    expect(fn.mock.calls[0][1].method).toBe("POST");
    expect(fn.mock.calls[0][1].headers.Authorization).toBe("OAuth tok123");
  });

  it("auth.disconnect throws SoundCloudError when the token does not support disconnect", async () => {
    mockFetch({ status: 400, statusText: "Bad Request", json: { message: "not supported" } });
    await expect(client.auth.disconnect("tok123")).rejects.toBeInstanceOf(SoundCloudError);
  });

  it("standalone disconnect POSTs /disconnect", async () => {
    const fn = mockFetch({ status: 204 });
    await expect(disconnect("tok123")).resolves.toBeUndefined();
    expect(fn.mock.calls[0][0]).toBe("https://api.soundcloud.com/disconnect");
    expect(fn.mock.calls[0][1].method).toBe("POST");
  });
});

describe("registry", () => {
  it("lists the system playlist and disconnect routes", () => {
    expect(IMPLEMENTED_ROUTES).toEqual(expect.arrayContaining([
      "GET /system-playlists/{id}",
      "GET /me/likes/system-playlists",
      "GET /users/{user_urn}/likes/system-playlists",
      "POST /disconnect",
    ]));
  });
});
