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
});

describe("getMeActivitiesOwn", () => {
  it("fetches own activities", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivitiesOwn("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/activities/all/own");
  });
});

describe("getMeActivitiesTracks", () => {
  it("fetches track activities", async () => {
    const fn = mockFetch({ json: { ...paginated, future_href: null } });
    await getMeActivitiesTracks("tok", 5);
    expect(fn.mock.calls[0][0]).toContain("/me/activities/tracks");
  });
});

describe("getMeLikesTracks", () => {
  it("fetches liked tracks", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeLikesTracks("tok", 10);
    expect(fn.mock.calls[0][0]).toContain("/me/likes/tracks");
  });
});

describe("getMeLikesPlaylists", () => {
  it("fetches liked playlists", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeLikesPlaylists("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/likes/playlists");
  });
});

describe("getMeFollowings", () => {
  it("fetches followings", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowings("tok", 20);
    expect(fn.mock.calls[0][0]).toContain("/me/followings?");
  });
});

describe("getMeFollowingsTracks", () => {
  it("fetches followings tracks", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeFollowingsTracks("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/followings/tracks");
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
});

describe("getMePlaylists", () => {
  it("fetches playlists", async () => {
    const fn = mockFetch({ json: paginated });
    await getMePlaylists("tok");
    expect(fn.mock.calls[0][0]).toContain("/me/playlists");
  });
});

describe("getMeTracks", () => {
  it("fetches tracks", async () => {
    const fn = mockFetch({ json: paginated });
    await getMeTracks("tok", 10);
    expect(fn.mock.calls[0][0]).toContain("/me/tracks");
  });
});
