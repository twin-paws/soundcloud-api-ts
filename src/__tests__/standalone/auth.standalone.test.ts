import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch } from "../helpers.js";
import { getClientToken } from "../../auth/getClientToken.js";
import { getUserToken } from "../../auth/getUserToken.js";
import { refreshUserToken } from "../../auth/refreshUserToken.js";
import { getAuthorizationUrl } from "../../auth/getAuthorizationUrl.js";
import { signOut } from "../../auth/signOut.js";
import { generateCodeVerifier, generateCodeChallenge } from "../../auth/pkce.js";

beforeEach(() => { vi.restoreAllMocks(); });

describe("getClientToken", () => {
  it("exchanges client credentials for a token", async () => {
    const fn = mockFetch({ json: { access_token: "tok", token_type: "bearer" } });
    const token = await getClientToken("cid", "csecret");
    expect(token.access_token).toBe("tok");
    expect(fn).toHaveBeenCalledTimes(1);
    const url = fn.mock.calls[0][0] as string;
    expect(url).toContain("/oauth2/token");
  });
});

describe("getUserToken", () => {
  it("exchanges authorization code for tokens", async () => {
    const fn = mockFetch({ json: { access_token: "at", refresh_token: "rt" } });
    const token = await getUserToken("cid", "csecret", "https://cb.com", "code123");
    expect(token.access_token).toBe("at");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("includes code_verifier when provided", async () => {
    const fn = mockFetch({ json: { access_token: "at", refresh_token: "rt" } });
    await getUserToken("cid", "csecret", "https://cb.com", "code123", "verifier");
    const body = fn.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("code_verifier")).toBe("verifier");
  });
});

describe("refreshUserToken", () => {
  it("refreshes an expired token", async () => {
    const fn = mockFetch({ json: { access_token: "new_at", refresh_token: "new_rt" } });
    const token = await refreshUserToken("cid", "csecret", "https://cb.com", "old_rt");
    expect(token.access_token).toBe("new_at");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("getAuthorizationUrl", () => {
  it("builds a basic authorization URL", () => {
    const url = getAuthorizationUrl("cid", "https://cb.com");
    expect(url).toContain("client_id=cid");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("response_type=code");
  });

  it("includes state and codeChallenge", () => {
    const url = getAuthorizationUrl("cid", "https://cb.com", { state: "s1", codeChallenge: "ch" });
    expect(url).toContain("state=s1");
    expect(url).toContain("code_challenge=ch");
    expect(url).toContain("code_challenge_method=S256");
  });
});

describe("signOut", () => {
  it("posts to sign-out endpoint", async () => {
    const fn = mockFetch({ status: 200, json: {} });
    await signOut("mytoken");
    expect(fn).toHaveBeenCalledTimes(1);
    const url = fn.mock.calls[0][0] as string;
    expect(url).toContain("sign-out");
  });

  it("throws on failure", async () => {
    mockFetch({ status: 401, ok: false, json: {} });
    await expect(signOut("bad")).rejects.toThrow("Sign-out failed");
  });
});

describe("PKCE", () => {
  it("generates a code verifier", () => {
    const v = generateCodeVerifier();
    expect(v.length).toBeGreaterThan(40);
  });

  it("generates a code challenge from verifier", async () => {
    const v = generateCodeVerifier();
    const c = await generateCodeChallenge(v);
    expect(c.length).toBeGreaterThan(0);
    expect(c).not.toContain("=");
  });
});
