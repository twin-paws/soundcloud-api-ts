import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { getMeActivities, getMeActivitiesOwn, getMeActivitiesTracks } from "../../me/activities.js";
import { getMeLikesTracks, getMeLikesPlaylists } from "../../me/likes.js";
import { getMeFollowings, getMeFollowingsTracks, followUser, unfollowUser } from "../../me/followings.js";
import { getMeFollowers } from "../../me/followers.js";
import { getMePlaylists } from "../../me/playlists.js";
import { getMeTracks } from "../../me/tracks.js";
import { getMeConnections } from "../../me/connections.js";
import { getMeFeed, getMeFeedTracks } from "../../me/feed.js";
import { getMeRecentlyPlayedTracks } from "../../me/recentlyPlayed.js";
import { getMeRepostsTracks, getMeRepostsPlaylists } from "../../me/reposts.js";

beforeEach(() => { vi.restoreAllMocks(); });

const paginated = { collection: [], next_href: null };

describe("getMeConnections", () => {
  it("fetches connected social accounts", async () => {
    const fn = mockFetch({ json: [{ id: 1, service: "twitter" }] });
    const conns = await getMeConnections("tok");
    expect(conns[0].service).toBe("twitter");
    expect(fn.mock.calls[0][0]).toContain("/me/connections");
  });
});

describe("getMeActivities", () => {
  it("fetches activities", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivities("tok", 10);
    expect(fn.mock.calls[0][0]).toContain("/me/activities");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivities("tok");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getMeActivitiesOwn", () => {
  it("fetches own activities", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivitiesOwn("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/activities/all/own");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivitiesOwn("tok", 10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });
});

describe("getMeActivitiesTracks", () => {
  it("fetches track activities", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivitiesTracks("tok", 5);
    expect(fn.mock.calls[0][0]).toContain("/me/activities/tracks");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivitiesTracks("tok");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getMeLikesTracks", () => {
  it("fetches liked tracks", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeLikesTracks("tok", 10);
    expect(fn.mock.calls[0][0]).toContain("/me/likes/tracks");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeLikesTracks("tok");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getMeLikesPlaylists", () => {
  it("fetches liked playlists without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeLikesPlaylists("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/likes/playlists");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeLikesPlaylists("tok", 20);
    expect(fn.mock.calls[0][0]).toContain("limit=20");
  });
});

describe("getMeFollowings", () => {
  it("fetches followings", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowings("tok", 20);
    expect(fn.mock.calls[0][0]).toContain("/me/followings?");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowings("tok");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getMeFollowingsTracks", () => {
  it("fetches followings tracks without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowingsTracks("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/followings/tracks");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowingsTracks("tok", 10);
    expect(fn.mock.calls[0][0]).toContain("limit=10");
  });
});

describe("followUser", () => {
  it("follows a user", async () => {
    const fn = mockFetch({ json: {} });
    await followUser("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("/me/followings/123");
  });
});

describe("unfollowUser", () => {
  it("unfollows a user", async () => {
    const fn = mockFetch({ json: {} });
    await unfollowUser("tok", 123);
    expect(fn.mock.calls[0][0]).toContain("/me/followings/123");
  });
});

describe("getMeFollowers", () => {
  it("fetches followers", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowers("tok", 50);
    expect(fn.mock.calls[0][0]).toContain("/me/followers");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowers("tok");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getMePlaylists", () => {
  it("fetches playlists", async () => {
    const fn = mockFetch({ json: paginated });
    await getMePlaylists("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/playlists");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMePlaylists("tok", 15);
    expect(fn.mock.calls[0][0]).toContain("limit=15");
  });
});

describe("getMeFeed", () => {
  it("fetches the current feed with limit and access", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getMeFeed("tok", 10, "playable");
    expect(fn.mock.calls[0][0]).toContain("/me/feed?");
    expect(fn.mock.calls[0][0]).toContain("limit=10");
    expect(fn.mock.calls[0][0]).toContain("access=playable");
  });

  it("works without query params", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getMeFeed("tok");
    expect(fn.mock.calls[0][0]).toMatch(/\/me\/feed$/);
  });
});

describe("getMeFeedTracks", () => {
  it("fetches the track feed", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getMeFeedTracks("tok", 5, "playable");
    expect(fn.mock.calls[0][0]).toContain("/me/feed/tracks?");
    expect(fn.mock.calls[0][0]).toContain("limit=5");
    expect(fn.mock.calls[0][0]).toContain("access=playable");
  });

  it("works without query params", async () => {
    const fn = mockFetch({ json: { collection: [], next_href: null } });
    await getMeFeedTracks("tok");
    expect(fn.mock.calls[0][0]).toMatch(/\/me\/feed\/tracks$/);
  });
});

describe("getMeRecentlyPlayedTracks", () => {
  it("unwraps a collection", async () => {
    mockFetch({ json: { collection: [{ id: 1, title: "Last" }] } });
    const r = await getMeRecentlyPlayedTracks("tok");
    expect(r).toEqual([{ id: 1, title: "Last" }]);
  });

  it("returns a bare array and honors access", async () => {
    const fn = mockFetch({ json: [{ id: 2, title: "Bare" }] });
    const r = await getMeRecentlyPlayedTracks("tok", "playable");
    expect(r).toEqual([{ id: 2, title: "Bare" }]);
    expect(fn.mock.calls[0][0]).toContain("/me/recently-played/tracks?access=playable");
  });

  it("returns [] when collection is missing", async () => {
    mockFetch({ json: { next_href: null } });
    expect(await getMeRecentlyPlayedTracks("tok")).toEqual([]);
  });
});

describe("getMeRepostsTracks", () => {
  it("fetches track reposts with limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeRepostsTracks("tok", 8);
    expect(fn.mock.calls[0][0]).toContain("/me/reposts/tracks");
    expect(fn.mock.calls[0][0]).toContain("limit=8");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeRepostsTracks("tok");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});

describe("getMeRepostsPlaylists", () => {
  it("fetches playlist reposts without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeRepostsPlaylists("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/reposts/playlists");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });

  it("works with limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeRepostsPlaylists("tok", 4);
    expect(fn.mock.calls[0][0]).toContain("limit=4");
  });
});

describe("getMeTracks", () => {
  it("fetches tracks", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeTracks("tok", 10);
    expect(fn.mock.calls[0][0]).toContain("/me/tracks");
  });

  it("works without limit", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeTracks("tok");
    expect(fn.mock.calls[0][0]).toContain("linked_partitioning=true");
    expect(fn.mock.calls[0][0]).not.toContain("limit=");
  });
});
