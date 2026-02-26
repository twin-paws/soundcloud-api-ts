/**
 * Raw response from the SoundCloud API, including status code and headers.
 */
export type RawResponse<T = unknown> = {
  /** Parsed response body */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers as a plain object */
  headers: Record<string, string>;
};

/**
 * Low-level HTTP client that returns raw responses without throwing on non-2xx status codes.
 * Useful when you need access to status codes, headers, or want to handle errors manually.
 *
 * @example
 * ```ts
 * const raw = sc.raw;
 * const res = await raw.get('/tracks/123456');
 * console.log(res.status, res.headers, res.data);
 * ```
 */
export class RawClient {
  constructor(
    private baseUrl: string,
    private getToken: () => string | undefined,
    private fetchFn: typeof fetch,
  ) {}

  /**
   * Make a raw HTTP request. Path template placeholders like `{id}` are substituted
   * from matching keys in `query` before the remaining query params are appended to
   * the URL as search parameters.
   */
  async request<T = unknown>({
    method,
    path,
    query,
    body,
    token,
  }: {
    method: string;
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    token?: string;
  }): Promise<RawResponse<T>> {
    // Path templating: substitute {param} placeholders from query params
    let resolvedPath = path;
    const remainingQuery: Record<string, string> = {};

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        const placeholder = `{${key}}`;
        if (resolvedPath.includes(placeholder)) {
          resolvedPath = resolvedPath.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
        } else {
          remainingQuery[key] = String(value);
        }
      }
    }

    // Build URL with remaining query params
    const fullUrl = resolvedPath.startsWith("http")
      ? new URL(resolvedPath)
      : new URL(resolvedPath, this.baseUrl);
    for (const [key, value] of Object.entries(remainingQuery)) {
      fullUrl.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const authToken = token ?? this.getToken();
    if (authToken) {
      headers["Authorization"] = `OAuth ${authToken}`;
    }

    let fetchBody: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }

    const response = await this.fetchFn(fullUrl.toString(), {
      method,
      headers,
      body: fetchBody,
    });

    // Collect response headers
    const responseHeaders: Record<string, string> = {};
    if (typeof response.headers.forEach === "function") {
      response.headers.forEach((value: string, key: string) => {
        responseHeaders[key] = value;
      });
    }

    // Parse body
    let data: T;
    const contentLength = response.headers.get("content-length");
    if (response.status === 204 || contentLength === "0") {
      data = undefined as T;
    } else {
      try {
        data = (await response.json()) as T;
      } catch {
        data = undefined as T;
      }
    }

    return { data, status: response.status, headers: responseHeaders };
  }

  /** GET shorthand */
  get<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<RawResponse<T>> {
    return this.request<T>({ method: "GET", path, query: params });
  }

  /** POST shorthand */
  post<T = unknown>(path: string, body?: unknown): Promise<RawResponse<T>> {
    return this.request<T>({ method: "POST", path, body });
  }

  /** PUT shorthand */
  put<T = unknown>(path: string, body?: unknown): Promise<RawResponse<T>> {
    return this.request<T>({ method: "PUT", path, body });
  }

  /** DELETE shorthand */
  delete<T = unknown>(path: string): Promise<RawResponse<T>> {
    return this.request<T>({ method: "DELETE", path });
  }
}
