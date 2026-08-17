import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  main: string;
  module: string;
  exports: {
    ".": { import: string; require: string; types: string };
    "./types": { import: string; require: string; types: string };
  };
};

// tsup dual-format with no "type": "module" emits CJS as .js and ESM as .mjs.
// Pinning these paths prevents the v1.14.0 ship where require pointed at a
// non-existent index.cjs and import pointed at the CJS file.

describe("package exports map", () => {
  it("points require/main at the CJS build and import/module at the ESM build", () => {
    expect(pkg.main).toBe("./dist/index.js");
    expect(pkg.module).toBe("./dist/index.mjs");
    expect(pkg.exports["."].require).toBe("./dist/index.js");
    expect(pkg.exports["."].import).toBe("./dist/index.mjs");
    expect(pkg.exports["./types"].require).toBe("./dist/types/index.js");
    expect(pkg.exports["./types"].import).toBe("./dist/types/index.mjs");
  });
});
