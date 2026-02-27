/**
 * Encode a string to base64 in a way that works across Node.js, Bun, Deno,
 * Cloudflare Workers, and browser runtimes.
 *
 * Node.js (≥20) and Bun expose `Buffer`, so we use it when available.
 * All other runtimes (edge, browser) expose the WHATWG `btoa` global.
 */
export const toBase64 = (value: string): string => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  }
  return btoa(value);
};
