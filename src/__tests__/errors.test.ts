import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundCloudError } from "../errors.js";
import { scFetch } from "../client/http.js";
import { mockFetch } from "./helpers.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SoundCloudError", () => {
  it("parses real SC error response format", () => {
    const err = new SoundCloudError(401, "Unauthorized", {
      code: 401,
      message: "invalid_client",
      link: "https://developers.soundcloud.com/docs/api/explorer/open-api",
      status: "401 - Unauthorized",
      errors: [{ error_message: "invalid_client" }],
      error: null,
      error_code: "invalid_client",
    });
    expect(err.status).toBe(401);
    expect(err.statusText).toBe("Unauthorized");
    expect(err.message).toBe("invalid_client");
    expect(err.errorCode).toBe("invalid_client");
    expect(err.docsLink).toBe("https://developers.soundcloud.com/docs/api/explorer/open-api");
    expect(err.errors).toEqual(["invalid_client"]);
    expect(err.name).toBe("SoundCloudError");
  });

  it("handles SC 404 response format", () => {
    const err = new SoundCloudError(404, "Not Found", {
      code: 404,
      message: "404 - Not Found",
      link: "https://developers.soundcloud.com/docs/api/explorer/open-api",
      status: "404 - Not Found",
      errors: [{ error_message: "404 - Not Found" }],
      error: null,
    });
    expect(err.message).toBe("404 - Not Found");
    expect(err.isNotFound).toBe(true);
    expect(err.errors).toEqual(["404 - Not Found"]);
  });

  it("handles OAuth error_description (token endpoint errors)", () => {
    const err = new SoundCloudError(400, "Bad Request", {
      error_description: "Missing parameter: grant_type",
    });
    expect(err.message).toBe("Missing parameter: grant_type");
  });

  it("falls back to error_code", () => {
    const err = new SoundCloudError(400, "Bad Request", {
      error_code: "invalid_grant",
    });
    expect(err.message).toBe("invalid_grant");
    expect(err.errorCode).toBe("invalid_grant");
  });

  it("errorCode reads OAuth error when error_code is absent", () => {
    const err = new SoundCloudError(400, "Bad Request", {
      error: "invalid_grant",
      error_description: "The refresh token is invalid",
    });
    expect(err.errorCode).toBe("invalid_grant");
    expect(err.message).toBe("The refresh token is invalid");
    expect(err.isInvalidGrant).toBe(true);
  });

  it("errorCode prefers error_code over error", () => {
    const err = new SoundCloudError(401, "Unauthorized", {
      error: "invalid_grant",
      error_code: "invalid_token",
    });
    expect(err.errorCode).toBe("invalid_token");
  });

  it("errorCode ignores null OAuth error", () => {
    const err = new SoundCloudError(401, "Unauthorized", {
      error: null,
      error_code: "invalid_client",
    });
    expect(err.errorCode).toBe("invalid_client");
    expect(err.isInvalidGrant).toBe(false);
  });

  it("isInvalidGrant is false for other codes", () => {
    expect(new SoundCloudError(401, "Unauthorized", { error: "insufficient_scope" }).isInvalidGrant).toBe(false);
    expect(new SoundCloudError(401, "Unauthorized").isInvalidGrant).toBe(false);
  });

  it("isPermanentAuthError matches known dead-token OAuth codes", () => {
    for (const code of ["invalid_grant", "invalid_token", "invalid_request", "unauthorized_client", "access_denied"]) {
      expect(new SoundCloudError(400, "Bad Request", { error: code }).isPermanentAuthError).toBe(true);
    }
    // invalid_client is often a transient infra 401 — not a dead user token
    expect(new SoundCloudError(401, "Unauthorized", { error: "invalid_client" }).isPermanentAuthError).toBe(false);
    expect(new SoundCloudError(401, "Unauthorized").isPermanentAuthError).toBe(false);
  });

  it("falls back to errors array", () => {
    const err = new SoundCloudError(422, "Unprocessable", {
      errors: [{ error_message: "title is required" }],
    });
    expect(err.message).toBe("title is required");
    expect(err.errors).toEqual(["title is required"]);
  });

  it("falls back to status text when body has no useful message", () => {
    const err = new SoundCloudError(500, "Internal Server Error");
    expect(err.message).toBe("500 Internal Server Error");
  });

  it("falls back when body has empty message", () => {
    const err = new SoundCloudError(401, "Unauthorized", {
      code: 401,
      message: "",
      error: null,
    });
    expect(err.message).toBe("401 Unauthorized");
  });

  it("isUnauthorized", () => {
    expect(new SoundCloudError(401, "Unauthorized").isUnauthorized).toBe(true);
    expect(new SoundCloudError(403, "Forbidden").isUnauthorized).toBe(false);
  });

  it("isForbidden", () => {
    expect(new SoundCloudError(403, "Forbidden").isForbidden).toBe(true);
  });

  it("isNotFound", () => {
    expect(new SoundCloudError(404, "Not Found").isNotFound).toBe(true);
  });

  it("isRateLimited", () => {
    expect(new SoundCloudError(429, "Too Many Requests").isRateLimited).toBe(true);
  });

  it("isServerError", () => {
    expect(new SoundCloudError(500, "Internal Server Error").isServerError).toBe(true);
    expect(new SoundCloudError(502, "Bad Gateway").isServerError).toBe(true);
    expect(new SoundCloudError(400, "Bad Request").isServerError).toBe(false);
  });

  it("stores full body", () => {
    const body = { code: 401, message: "test", errors: [{ error_message: "test" }] };
    const err = new SoundCloudError(401, "Unauthorized", body);
    expect(err.body).toEqual(body);
  });
});

describe("scFetch throws SoundCloudError", () => {
  it("throws SoundCloudError with parsed SC response body", async () => {
    mockFetch({
      status: 404,
      statusText: "Not Found",
      ok: false,
      json: {
        code: 404,
        message: "404 - Not Found",
        status: "404 - Not Found",
        errors: [{ error_message: "404 - Not Found" }],
        error: null,
      },
    });
    try {
      await scFetch(
        { path: "/tracks/999", method: "GET", token: "tok" },
        { getToken: () => "tok", setToken: () => {}, retry: { maxRetries: 0, retryBaseDelay: 0 } },
      );
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(SoundCloudError);
      const e = err as SoundCloudError;
      expect(e.status).toBe(404);
      expect(e.message).toBe("404 - Not Found");
      expect(e.isNotFound).toBe(true);
      expect(e.errors).toEqual(["404 - Not Found"]);
    }
  });
});
