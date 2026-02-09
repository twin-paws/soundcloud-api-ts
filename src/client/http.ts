const BASE_URL = "https://api.soundcloud.com";

export interface RequestOptions {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: Record<string, unknown> | FormData | URLSearchParams;
  contentType?: string;
}

export interface AutoRefreshContext {
  getToken: () => string | undefined;
  onTokenRefresh?: () => Promise<{ access_token: string; refresh_token?: string }>;
  setToken: (accessToken: string, refreshToken?: string) => void;
}

/**
 * Make a request to the SoundCloud API using native fetch.
 * Returns parsed JSON, or for 302 redirects returns the Location header.
 */
export async function scFetch<T>(
  options: RequestOptions,
  refreshCtx?: AutoRefreshContext,
): Promise<T> {
  const execute = async (tokenOverride?: string): Promise<T> => {
    const url = `${BASE_URL}${options.path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const token = tokenOverride ?? options.token;
    if (token) {
      headers["Authorization"] = `OAuth ${token}`;
    }

    let fetchBody: string | FormData | URLSearchParams | undefined;
    if (options.body) {
      if (options.body instanceof URLSearchParams) {
        fetchBody = options.body;
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else if (options.body instanceof FormData) {
        fetchBody = options.body;
        // Don't set Content-Type for FormData — browser/node sets boundary automatically
      } else {
        headers["Content-Type"] = options.contentType ?? "application/json";
        fetchBody = JSON.stringify(options.body);
      }
    } else if (options.contentType) {
      headers["Content-Type"] = options.contentType;
    }

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: fetchBody,
      redirect: "manual",
    });

    if (response.status === 302) {
      const location = response.headers.get("location");
      if (location) {
        return location as T;
      }
    }

    // 200-204 with no content
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    if (!response.ok) {
      throw new Error(
        `SoundCloud API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  };

  try {
    return await execute();
  } catch (err) {
    // Auto-refresh on 401
    if (
      refreshCtx?.onTokenRefresh &&
      err instanceof Error &&
      err.message.includes("401")
    ) {
      const newToken = await refreshCtx.onTokenRefresh();
      refreshCtx.setToken(newToken.access_token, newToken.refresh_token);
      return execute(newToken.access_token);
    }
    throw err;
  }
}

/**
 * Fetch an absolute URL (e.g. next_href from paginated responses).
 * Adds OAuth token if provided.
 */
export async function scFetchUrl<T>(url: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `OAuth ${token}`;

  const response = await fetch(url, { method: "GET", headers, redirect: "manual" });

  if (response.status === 302) {
    const location = response.headers.get("location");
    if (location) return location as T;
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  if (!response.ok) {
    throw new Error(`SoundCloud API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
