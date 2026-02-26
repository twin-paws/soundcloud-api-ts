#!/usr/bin/env node
/**
 * tools/openapi-sync.ts
 *
 * Fetches the SoundCloud OpenAPI spec and generates a summary of operations.
 * Run via: pnpm openapi:sync
 *
 * If the spec URL is not publicly accessible, logs a warning and exits cleanly.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SPEC_URLS = [
  "https://raw.githubusercontent.com/soundcloud/api/master/docs/public.yaml",
  "https://developers.soundcloud.com/api/explorer/sound-cloud-api.json",
];

interface OpenAPIOperation {
  operationId: string;
  path: string;
  method: string;
}

async function tryFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json, application/yaml, text/yaml, */*" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseJsonSpec(text: string): OpenAPIOperation[] {
  const spec = JSON.parse(text) as {
    paths?: Record<string, Record<string, { operationId?: string }>>;
  };
  const ops: OpenAPIOperation[] = [];
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation === "object" && operation !== null && "operationId" in operation) {
        ops.push({ operationId: String(operation.operationId), path, method: method.toUpperCase() });
      }
    }
  }
  return ops;
}

async function main() {
  let rawText: string | null = null;
  let usedUrl = "";

  for (const url of SPEC_URLS) {
    process.stderr.write(`Trying ${url} ...\n`);
    const text = await tryFetch(url);
    if (text) {
      rawText = text;
      usedUrl = url;
      break;
    }
    process.stderr.write(`  → not available\n`);
  }

  if (!rawText) {
    process.stderr.write(
      "⚠️  OpenAPI spec could not be fetched from any known URL. " +
        "Skipping openapi.json and openapi-operations.json generation.\n",
    );
    process.exit(0);
  }

  // Save raw spec
  const specPath = join(ROOT, "tools", "openapi.json");

  // If YAML, convert to JSON-parseable form (best-effort for simple cases)
  let jsonText = rawText;
  if (usedUrl.endsWith(".yaml") || usedUrl.endsWith(".yml")) {
    // We don't have a YAML parser — save as-is in a text file instead
    const yamlPath = join(ROOT, "tools", "openapi.yaml");
    writeFileSync(yamlPath, rawText, "utf8");
    process.stdout.write(`Saved spec to tools/openapi.yaml (${rawText.length} bytes)\n`);

    // Try to extract operations via regex (basic support)
    const ops: OpenAPIOperation[] = [];
    const pathRegex = /^  (\/[^\n:]+):/gm;
    const opIdRegex = /operationId:\s*(\S+)/g;
    const methodRegex = /^    (get|post|put|delete|patch):/gm;

    // For YAML specs we skip detailed parsing without a proper YAML lib
    process.stdout.write(
      "ℹ️  YAML spec detected — skipping operations extraction (no YAML parser available). " +
        "Install js-yaml and update this script for full support.\n",
    );
    writeFileSync(join(ROOT, "tools", "openapi-operations.json"), JSON.stringify(ops, null, 2), "utf8");
    process.stdout.write(`Saved 0 operations to tools/openapi-operations.json\n`);
    return;
  }

  writeFileSync(specPath, jsonText, "utf8");
  process.stdout.write(`Saved spec to tools/openapi.json (${jsonText.length} bytes)\n`);

  let ops: OpenAPIOperation[] = [];
  try {
    ops = parseJsonSpec(jsonText);
  } catch (err) {
    process.stderr.write(`⚠️  Failed to parse spec as JSON: ${err}\n`);
  }

  const opsPath = join(ROOT, "tools", "openapi-operations.json");
  writeFileSync(opsPath, JSON.stringify(ops, null, 2), "utf8");
  process.stdout.write(`Saved ${ops.length} operations to tools/openapi-operations.json\n`);
}

main().catch((err) => {
  process.stderr.write(`⚠️  openapi-sync error: ${err}\n`);
  process.exit(0); // exit 0 — spec URL may not be public
});
