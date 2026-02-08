const BASE_URL = "https://api.soundcloud.com";

export interface RequestOptions {
  path: string;
  method: "GET" | "POST";
  token?: string;
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

  const response = await fetch(url, {
    method: options.method,
    headers,
    redirect: "manual",
  });

  if (response.status === 302) {
    const location = response.headers.get("location");
    if (location) {
      return location as T;
    }
  }

  if (!response.ok) {
    throw new Error(
      `SoundCloud API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Make a request and map the response through a converter function.
 */
export async function scFetchAndMap<T, V>(
  options: RequestOptions,
  convert: (from: V) => T
): Promise<T> {
  const raw = await scFetch<V>(options);
  return convert(raw);
}
