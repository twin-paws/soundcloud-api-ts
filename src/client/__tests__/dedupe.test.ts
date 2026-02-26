import { describe, it, expect, vi } from "vitest";
import { InFlightDeduper } from "../dedupe.js";

describe("InFlightDeduper", () => {
  it("returns the same promise for concurrent identical keys", () => {
    const deduper = new InFlightDeduper();
    const factory = vi.fn(() => Promise.resolve(42));

    const p1 = deduper.add("key", factory);
    const p2 = deduper.add("key", factory);

    expect(p1).toBe(p2);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("resolves with the factory value", async () => {
    const deduper = new InFlightDeduper();
    const result = await deduper.add("key", () => Promise.resolve("hello"));
    expect(result).toBe("hello");
  });

  it("allows a new request after the first settles", async () => {
    const deduper = new InFlightDeduper();
    const factory = vi.fn().mockResolvedValue(1);

    await deduper.add("key", factory);
    await deduper.add("key", factory);

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("cleans up after rejection too", async () => {
    const deduper = new InFlightDeduper();
    const factory = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(deduper.add("key", factory)).rejects.toThrow("fail");
    expect(deduper.size).toBe(0);

    // Next call starts fresh
    const factory2 = vi.fn().mockResolvedValue("ok");
    const result = await deduper.add("key", factory2);
    expect(result).toBe("ok");
  });

  it("deduplicates concurrent calls and shares resolved value", async () => {
    const deduper = new InFlightDeduper();
    let resolveIt!: (v: string) => void;
    const deferred = new Promise<string>((res) => { resolveIt = res; });

    const factory = vi.fn(() => deferred);

    const p1 = deduper.add("x", factory);
    const p2 = deduper.add("x", factory);
    const p3 = deduper.add("x", factory);

    expect(factory).toHaveBeenCalledTimes(1);

    resolveIt("shared");

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1).toBe("shared");
    expect(r2).toBe("shared");
    expect(r3).toBe("shared");
  });

  it("handles different keys independently", async () => {
    const deduper = new InFlightDeduper();
    const factoryA = vi.fn(() => Promise.resolve("a"));
    const factoryB = vi.fn(() => Promise.resolve("b"));

    const [ra, rb] = await Promise.all([
      deduper.add("keyA", factoryA),
      deduper.add("keyB", factoryB),
    ]);

    expect(ra).toBe("a");
    expect(rb).toBe("b");
    expect(factoryA).toHaveBeenCalledTimes(1);
    expect(factoryB).toHaveBeenCalledTimes(1);
  });

  it(".size reflects in-flight count", () => {
    const deduper = new InFlightDeduper();

    // Start a promise that never resolves (just for size checking)
    deduper.add("a", () => new Promise(() => {}));
    deduper.add("b", () => new Promise(() => {}));

    expect(deduper.size).toBe(2);
  });
});
