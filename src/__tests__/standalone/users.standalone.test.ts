import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { getMe } from "../../users/getMe.js";
import { getUser } from "../../users/getUser.js";
import { getFollowers } from "../../users/getFollowers.js";
import { getFollowings } from "../../users/getFollowings.js";
import { getUserTracks } from "../../users/getTracks.js";
import { getUserPlaylists } from "../../users/getPlaylists.js";
import { getUserLikesTracks } from "../../users/getLikesTracks.js";
import { getUserLikesPlaylists } from "../../users/getLikesPlaylists.js";
import { getUserWebProfiles } from "../../users/getWebProfiles.js";
import { getRelatedUsers } from "../../users/getRelated.js";
import { getUserRepostsTracks } from "../../users/getRepostsTracks.js";
import { getUserRepostsPlaylists } from "../../users/getRepostsPlaylists.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("getMe", () => {
  it("fetches authenticated user", async () => {
    const fn = mockFetch({ json: { id: 1, username: "me" } });
    const me = await getMe("tok");
    expect(me.username).toBe("me");
    expect(fn.mock.calls[0][0]).toContain("/me");
  });
});

describe("getUser", () => {
  it("fetches user by ID", async () => {
    const fn = mockFetch({ json: { id: 123, username: "test" } });
    const user = await getUser("tok", 123);
    expect(user.username).toBe("test");
    expect(fn.mock.calls[0][0]).toContain("/users/123");
  });
});

describe("getFollowers", () => {
  it("fetches followers", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1 }], next_href: null } });
    const r = await getFollowers("tok", 123, 10);
    expect(r.collection).toHaveLength(1);
    expect(fn.mock.calls[0][0]).toContain("/users/123/followers");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getFollowers("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getFollowings", () => {
  it("fetches followings without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getFollowings("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("/users/123/followings");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getFollowings("tok", 123, 30);
    expect(fn.mock.calls[0][0]).toContain("limit=30");
  });
});

describe("getUserTracks", () => {
  it("fetches user tracks", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 1, title: "t" }], next_href: null } });
    const r = await getUserTracks("tok", 123, 5);
    expect(r.collection[0].title).toBe("t");
    expect(fn.mock.calls[0][0]).toContain("/users/123/tracks");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserTracks("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getUserPlaylists", () => {
  it("fetches user playlists without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserPlaylists("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("/users/123/playlists");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserPlaylists("tok", 123, 20);
    expect(fn.mock.calls[0][0]).toContain("limit=20");
  });
});

describe("getUserLikesTracks", () => {
  it("fetches liked tracks", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserLikesTracks("tok", 123, 10, "cursor1");
    expect(fn.mock.calls[0][0]).toContain("/users/123/likes/tracks");
    expect(fn.mock.calls[0][0]).toContain("cursor=cursor1");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserLikesTracks("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getUserLikesPlaylists", () => {
  it("fetches liked playlists without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserLikesPlaylists("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("/users/123/likes/playlists");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserLikesPlaylists("tok", 123, 15);
    expect(fn.mock.calls[0][0]).toContain("limit=15");
  });
});

describe("getUserWebProfiles", () => {
  it("fetches web profiles", async () => {
    const fn = mockFetch({ json: [{ service: "twitter", url: "https://x.com/u" }] });
    const profiles = await getUserWebProfiles("tok", 123);
    expect(profiles[0].service).toBe("twitter");
    expect(fn.mock.calls[0][0]).toContain("/users/123/web-profiles");
  });
});

describe("getRelatedUsers", () => {
  it("fetches related artists with limit", async () => {
    const fn = mockFetch({ json: { collection: [{ id: 7 }], next_href: null } });
    const r = await getRelatedUsers("tok", 123, 10);
    expect(r.collection[0].id).toBe(7);
    expect(fn.mock.calls[0][0]).toContain("/users/123/related");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getRelatedUsers("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getUserRepostsTracks", () => {
  it("fetches track reposts with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserRepostsTracks("tok", 123, 8);
    expect(fn.mock.calls[0][0]).toContain("/users/123/reposts/tracks");
    expect(fn.mock.calls[0][0]).toContain("limit=8");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserRepostsTracks("tok", 123);
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getUserRepostsPlaylists", () => {
  it("fetches playlist reposts without limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserRepostsPlaylists("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("/users/123/reposts/playlists");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getUserRepostsPlaylists("tok", 123, 6);
    expect(fn.mock.calls[0][0]).toContain("limit=6");
  });
});
