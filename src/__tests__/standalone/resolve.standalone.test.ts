import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { resolveUrl } from "../../resolve/resolveUrl.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("resolveUrl", () => {
  it("resolves a SoundCloud URL", async () => {
    const fn = mockFetch({ json: "https://api.soundcloud.com/tracks/123" });
    const r = await resolveUrl("tok", "https://soundcloud.com/artist/track");
    expect(r).toContain("tracks/123");
    expect(fn.mock.calls[0][0]).toContain("/resolve");
  });
});
