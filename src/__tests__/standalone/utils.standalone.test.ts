import { describe, it, expect } from "vitest";
import { getSoundCloudWidgetUrl } from "../../utils/widget.js";

describe("getSoundCloudWidgetUrl", () => {
  it("returns a widget URL for a track ID", () => {
    const url = getSoundCloudWidgetUrl(123);
    expect(url).toContain("tracks/123");
    expect(url).toContain("show_teaser=false");
  });

  it("works with string IDs", () => {
    const url = getSoundCloudWidgetUrl("456");
    expect(url).toContain("tracks/456");
  });
});
