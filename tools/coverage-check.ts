#!/usr/bin/env node
/**
 * tools/coverage-check.ts
 *
 * Reports OpenAPI coverage based on IMPLEMENTED_OPERATIONS vs the operations
 * extracted from the OpenAPI spec by openapi-sync.
 *
 * Run via: pnpm openapi:coverage (or: npx tsx tools/coverage-check.ts)
 *
 * Always exits 0 — CI never fails on low coverage.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { IMPLEMENTED_OPERATIONS } from "../src/client/registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

interface OpenAPIOperation {
  operationId: string;
  path: string;
  method: string;
}

interface CoverageBaseline {
  coverage: number;
  implemented: number;
  total: number;
}

function loadOperations(): OpenAPIOperation[] {
  const opsPath = join(ROOT, "tools", "openapi-operations.json");
  if (!existsSync(opsPath)) {
    process.stdout.write(
      "⚠️  tools/openapi-operations.json not found. Run pnpm openapi:sync first.\n",
    );
    return [];
  }
  try {
    return JSON.parse(readFileSync(opsPath, "utf8")) as OpenAPIOperation[];
  } catch {
    process.stderr.write("⚠️  Failed to parse tools/openapi-operations.json\n");
    return [];
  }
}

function main() {
  const allOps = loadOperations();
  const total = allOps.length;

  if (total === 0) {
    process.stdout.write(
      "OpenAPI Coverage: unknown (no operations data — run pnpm openapi:sync)\n",
    );
    // Write a baseline with zeros so the artifact upload still works
    const baseline: CoverageBaseline = { coverage: 0, implemented: 0, total: 0 };
    writeFileSync(
      join(ROOT, "tools", "coverage-baseline.json"),
      JSON.stringify(baseline, null, 2) + "\n",
      "utf8",
    );
    return;
  }

  const implementedSet = new Set(IMPLEMENTED_OPERATIONS);
  const implemented = allOps.filter((op) => implementedSet.has(op.operationId));
  const notImplemented = allOps.filter((op) => !implementedSet.has(op.operationId));

  const coveragePct = Math.round((implemented.length / total) * 1000) / 10;

  process.stdout.write(`\nOpenAPI Coverage: ${implemented.length}/${total} operations (${coveragePct}%)\n\n`);

  process.stdout.write(`Implemented (${implemented.length}):\n`);
  for (const op of implemented) {
    process.stdout.write(`  ✅ ${op.operationId} — ${op.method} ${op.path}\n`);
  }

  process.stdout.write(`\nNot yet wrapped (${notImplemented.length}):\n`);
  for (const op of notImplemented) {
    process.stdout.write(`  ⬜ ${op.operationId} — ${op.method} ${op.path}\n`);
  }

  // Also log any IMPLEMENTED_OPERATIONS entries that don't appear in the spec
  const specIds = new Set(allOps.map((op) => op.operationId));
  const unknownImpl = IMPLEMENTED_OPERATIONS.filter((id) => !specIds.has(id));
  if (unknownImpl.length > 0) {
    process.stdout.write(`\nIn registry but not in spec (${unknownImpl.length}):\n`);
    for (const id of unknownImpl) {
      process.stdout.write(`  ❓ ${id}\n`);
    }
  }

  const baseline: CoverageBaseline = {
    coverage: coveragePct,
    implemented: implemented.length,
    total,
  };

  const baselinePath = join(ROOT, "tools", "coverage-baseline.json");
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n", "utf8");
  process.stdout.write(`\nWrote coverage-baseline.json: ${coveragePct}% (${implemented.length}/${total})\n`);
}

main();
