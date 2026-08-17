import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundCloudClient } from "../client/SoundCloudClient.js";
import { mockFetch } from "./helpers.js";

const config = { clientId: "cid", clientSecret: "csecret", redirectUri: "http://localhost/callback" };

beforeEach(() => { vi.restoreAllMocks(); });

describe("auth", () => {
  it("getClientToken uses Basic Auth header and client_credentials grant (SC OAuth 2.1)", async () => {
    // SC OAuth 2.1: client_credentials grant requires Authorization: Basic header.
    // client_id/client_secret in request body is no longer supported for this grant.
    const fn = mockFetch({ json: { access_token: "tok", token_type: "bearer" } });
    const client = new SoundCloudClient(config);
    const result = await client.auth.getClientToken();
    expect(result.access_token).toBe("tok");
    const headers = fn.mock.calls[0][1].headers;
    // Basic base64("cid:csecret")
    expect(headers?.Authorization).toBe(`Basic ${Buffer.from("cid:csecret").toString("base64")}`);
    const body = fn.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("client_credentials");
    // client_id and client_secret must NOT be in the body
    expect(body.get("client_id")).toBeNull();
    expect(body.get("client_secret")).toBeNull();
  });

  it("getUserToken sends body credentials and no Basic Auth header", async () => {
    // SC OAuth 2.1: authorization_code grant takes client_id/client_secret in
    // the form body (same as refresh_token; only client_credentials uses Basic).
    const fn = mockFetch({ json: { access_token: "tok" } });
    const client = new SoundCloudClient(config);
    await client.auth.getUserToken("mycode");
    const headers = fn.mock.calls[0][1].headers;
    expect(headers?.Authorization).toBeUndefined();
    const body = fn.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("mycode");
    expect(body.get("client_id")).toBe("cid");
    expect(body.get("client_secret")).toBe("csecret");
    expect(body.get("redirect_uri")).toBe("http://localhost/callback");
  });

  it("getUserToken sends optional codeVerifier", async () => {
    const fn = mockFetch({ json: { access_token: "tok" } });
    const client = new SoundCloudClient(config);
    await client.auth.getUserToken("mycode", "verifier123");
    const body = fn.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("code_verifier")).toBe("verifier123");
  });

  it("refreshUserToken sends body credentials and refresh_token grant", async () => {
    const fn = mockFetch({ json: { access_token: "newtok" } });
    const client = new SoundCloudClient(config);
    await client.auth.refreshUserToken("rt123");
    const headers = fn.mock.calls[0][1].headers;
    expect(headers?.Authorization).toBeUndefined();
    const body = fn.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("rt123");
    expect(body.get("client_id")).toBe("cid");
    expect(body.get("client_secret")).toBe("csecret");
  });

  it("getAuthorizationUrl builds correct URL", () => {
    const client = new SoundCloudClient(config);
    const url = client.auth.getAuthorizationUrl();
    expect(url).toContain("client_id=cid");
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%2Fcallback");
    expect(url).toContain("response_type=code");
  });

  it("getAuthorizationUrl with state and codeChallenge", () => {
    const client = new SoundCloudClient(config);
    const url = client.auth.getAuthorizationUrl({ state: "s1", codeChallenge: "ch1" });
    expect(url).toContain("state=s1");
    expect(url).toContain("code_challenge=ch1");
    expect(url).toContain("code_challenge_method=S256");
  });

  it("signOut hits secure.soundcloud.com", async () => {
    const fn = mockFetch({ status: 200, json: {} });
    const client = new SoundCloudClient(config);
    await client.auth.signOut("tok123");
    expect(fn.mock.calls[0][0]).toBe("https://secure.soundcloud.com/sign-out");
    expect(fn.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ access_token: "tok123" });
  });

  it("signOut throws on non-ok response", async () => {
    mockFetch({ status: 500, statusText: "Internal Server Error", ok: false });
    const client = new SoundCloudClient(config);
    await expect(client.auth.signOut("tok123")).rejects.toThrow("Sign-out failed: 500");
  });

  it("getAuthorizationUrl throws without redirectUri", () => {
    const client = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    expect(() => client.auth.getAuthorizationUrl()).toThrow("redirectUri is required");
  });

  it("getUserToken throws without redirectUri instead of sending redirect_uri=undefined", async () => {
    const fn = mockFetch({ json: { access_token: "tok" } });
    const client = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    await expect(client.auth.getUserToken("mycode")).rejects.toThrow("redirectUri is required");
    expect(fn).not.toHaveBeenCalled();
  });

  it("refreshUserToken omits redirect_uri when not configured (client-credentials refresh)", async () => {
    const fn = mockFetch({ json: { access_token: "tok", refresh_token: "rt2" } });
    const client = new SoundCloudClient({ clientId: "cid", clientSecret: "cs" });
    await client.auth.refreshToken("rt");
    const body = fn.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("redirect_uri")).toBeNull();
    expect(body.get("refresh_token")).toBe("rt");
  });
});
