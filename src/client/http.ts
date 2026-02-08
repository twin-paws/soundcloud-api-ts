const BASE_URL = "https://api.soundcloud.com";

export interface RequestOptions {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: Record<string, unknown> | FormData;
  contentType?: string;
}

/**
 * Make a request to the SoundCloud API using native fetch.
 * Returns parsed JSON, or for 302 redirects returns the Location header.
 */
export async function scFetch<T>(options: RequestOptions): Promise<T> {
  const url = `${BASE_URL}${options.path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.token) {
    headers["Authorization"] = `OAuth ${options.token}`;
  }

  let fetchBody: string | FormData | undefined;
  if (options.body) {
    if (options.body instanceof FormData) {
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
}
