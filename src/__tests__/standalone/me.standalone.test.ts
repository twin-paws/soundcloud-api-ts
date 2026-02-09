import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { getMeActivities, getMeActivitiesOwn, getMeActivitiesTracks } from "../../me/activities.js";
import { getMeLikesTracks, getMeLikesPlaylists } from "../../me/likes.js";
import { getMeFollowings, getMeFollowingsTracks, followUser, unfollowUser } from "../../me/followings.js";
import { getMeFollowers } from "../../me/followers.js";
import { getMePlaylists } from "../../me/playlists.js";
import { getMeTracks } from "../../me/tracks.js";

beforeEach(() => { vi.restoreAllMocks(); });

const paginated = { collection: [], next_href: null };

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
