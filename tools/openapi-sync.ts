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
  "https://developers.soundcloud.com/docs/api/explorer/api.json",
  "https://raw.githubusercontent.com/soundcloud/api/master/openapi/api.yaml",
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

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]);

function parseJsonSpec(text: string): OpenAPIOperation[] {
  const spec = JSON.parse(text) as {
    paths?: Record<string, Record<string, { operationId?: string } | unknown>>;
  };
  const ops: OpenAPIOperation[] = [];
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      const verb = method.toUpperCase();
      if (!HTTP_METHODS.has(verb)) continue;
      if (typeof operation !== "object" || operation === null) continue;
      const opId = (operation as { operationId?: string }).operationId;
      ops.push({
        operationId: opId ? String(opId) : `${verb} ${path}`,
        path,
        method: verb,
      });
    }
  }
  return ops;
}

function parseYamlPaths(text: string): OpenAPIOperation[] {
  const ops: OpenAPIOperation[] = [];
  let currentPath = "";
  for (const line of text.split(/\r?\n/)) {
    const pathMatch = /^  (\/\S+):$/.exec(line);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }
    const methodMatch = /^    (get|post|put|delete|patch):$/.exec(line);
    if (methodMatch && currentPath) {
      const verb = methodMatch[1].toUpperCase();
      ops.push({ operationId: `${verb} ${currentPath}`, path: currentPath, method: verb });
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

    const ops = parseYamlPaths(rawText);
    writeFileSync(join(ROOT, "tools", "openapi-operations.json"), JSON.stringify(ops, null, 2), "utf8");
    process.stdout.write(`Saved ${ops.length} operations to tools/openapi-operations.json\n`);
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
