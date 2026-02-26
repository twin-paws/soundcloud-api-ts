import { SoundCloudError, type SoundCloudErrorBody } from "../errors.js";

const BASE_URL = "https://api.soundcloud.com";
const AUTH_BASE_URL = "https://secure.soundcloud.com";

/**
 * Options for making a request to the SoundCloud API via {@link scFetch}.
 */
export interface RequestOptions {
  /** API path relative to `https://api.soundcloud.com` (e.g. "/tracks/123"). Paths starting with `/oauth` are routed to `https://secure.soundcloud.com`. */
  path: string;
  /** HTTP method */
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** OAuth access token to include in the Authorization header */
  token?: string;
  /** Request body — automatically serialized based on type */
  body?: Record<string, unknown> | FormData | URLSearchParams;
  /** Additional headers to include in the request */
  headers?: Record<string, string>;
  /** Override the Content-Type header (defaults to "application/json" for object bodies) */
  contentType?: string;
}

/**
 * Structured telemetry emitted after every API request.
 */
export interface SCRequestTelemetry {
  /** HTTP method used */
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** API path or full URL */
  path: string;
  /** Total duration including retries, in milliseconds */
  durationMs: number;
  /** Final HTTP status code */
  status: number;
  /** Number of retries performed (0 = succeeded on first attempt) */
  retryCount: number;
  /** Error message if the request ultimately failed */
  error?: string;
}

/**
 * Information passed to the `onRetry` callback on each retry attempt.
 */
export interface RetryInfo {
  /** Which retry attempt this is (1-based) */
  attempt: number;
  /** Delay in milliseconds before this retry fires */
  delayMs: number;
  /** Human-readable reason (e.g. "429 Too Many Requests") */
  reason: string;
  /** HTTP status that triggered the retry, if applicable */
  status?: number;
  /** The URL that was requested */
  url: string;
}

/**
 * Configuration for automatic retry with exponential backoff on transient errors.
 */
export interface RetryConfig {
  /** Maximum number of retries on 429/5xx responses (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  retryBaseDelay: number;
  /** Optional callback for debug logging of retry attempts */
  onDebug?: (message: string) => void;
  /** Optional callback fired before each retry with structured retry info */
  onRetry?: (info: RetryInfo) => void;
}

/**
 * Context for automatic token refresh when a request returns 401 Unauthorized.
 * Used internally by {@link SoundCloudClient} to transparently refresh expired tokens.
 */
export interface AutoRefreshContext {
  /** Returns the current stored access token */
  getToken: () => string | undefined;
  /** Called to obtain fresh tokens; if absent, 401 errors are thrown directly */
  onTokenRefresh?: () => Promise<{ access_token: string; refresh_token?: string }>;
  /** Callback to store the new tokens after a successful refresh */
  setToken: (accessToken: string, refreshToken?: string) => void;
  /** Retry configuration for this context */
  retry?: RetryConfig;
  /** Called after every API request with structured telemetry */
  onRequest?: (telemetry: SCRequestTelemetry) => void;
}

const DEFAULT_RETRY: RetryConfig = { maxRetries: 3, retryBaseDelay: 1000 };

/**
 * Creates a promise that resolves after the specified delay.
 *
 * @param ms - Delay duration in milliseconds
 * @returns A promise that resolves after `ms` milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function getRetryDelay(
  response: { status: number; headers: { get(key: string): string | null } },
  attempt: number,
  config: RetryConfig,
): number {
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (!Number.isNaN(seconds)) return Math.min(seconds * 1000, 60000);
    }
  }
  // Exponential backoff with jitter
  const base = config.retryBaseDelay * Math.pow(2, attempt);
  return base + Math.random() * base * 0.1;
}

async function parseErrorBody(response: { json(): Promise<unknown> }): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Make a request to the SoundCloud API using native `fetch`.
 *
 * Handles JSON serialization, OAuth headers, automatic retries on 429/5xx,
 * and optional automatic token refresh on 401. For 302 redirects, returns
 * the `Location` header value. For 204 responses, returns `undefined`.
 *
 * @param options - Request configuration (path, method, token, body)
 * @param refreshCtx - Optional auto-refresh context for transparent token renewal
 * @returns Parsed JSON response, redirect URL, or undefined for empty responses
 * @throws {SoundCloudError} When the API returns a non-retryable error status
 *
 * @example
 * ```ts
 * import { scFetch } from 'soundcloud-api-ts';
 *
 * const track = await scFetch<SoundCloudTrack>({
 *   path: '/tracks/123456',
 *   method: 'GET',
 *   token: 'your-access-token',
 * });
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api
 */
export async function scFetch<T>(
  options: RequestOptions,
  refreshCtx?: AutoRefreshContext,
  onRequest?: (telemetry: SCRequestTelemetry) => void,
): Promise<T> {
  const retryConfig = refreshCtx?.retry ?? DEFAULT_RETRY;
  const telemetryCallback = onRequest ?? refreshCtx?.onRequest;
  const startTime = Date.now();
  let retryCount = 0;
  let finalStatus = 0;

  const emitTelemetry = (error?: string) => {
    if (!telemetryCallback) return;
    telemetryCallback({
      method: options.method,
      path: options.path,
      durationMs: Date.now() - startTime,
      status: finalStatus,
      retryCount,
      ...(error ? { error } : {}),
    });
  };

  const execute = async (tokenOverride?: string): Promise<T> => {
    const isAuthPath = options.path.startsWith("/oauth");
    const url = `${isAuthPath ? AUTH_BASE_URL : BASE_URL}${options.path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };

    const token = tokenOverride ?? options.token;
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `OAuth ${token}`;
    }

    let fetchBody: string | FormData | URLSearchParams | undefined;
    if (options.body) {
      if (options.body instanceof URLSearchParams) {
        fetchBody = options.body;
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else if (options.body instanceof FormData) {
        fetchBody = options.body;
      } else {
        headers["Content-Type"] = options.contentType ?? "application/json";
        fetchBody = JSON.stringify(options.body);
      }
    } else if (options.contentType) {
      headers["Content-Type"] = options.contentType;
    }

    let lastResponse: Awaited<ReturnType<typeof fetch>> | undefined;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: fetchBody,
        redirect: "manual",
      });

      finalStatus = response.status;

      if (response.status === 302) {
        const location = response.headers.get("location");
        if (location) {
          emitTelemetry();
          return location as T;
        }
      }

      if (response.status === 204 || response.headers.get("content-length") === "0") {
        emitTelemetry();
        return undefined as T;
      }

      if (response.ok) {
        const data = await response.json();
        // Attach non-enumerable _meta so callers can access status/headers without breaking toEqual checks
        if (typeof data === "object" && data !== null) {
          const metaHeaders: Record<string, string> = {};
          if (typeof response.headers.forEach === "function") {
            response.headers.forEach((value: string, key: string) => {
              metaHeaders[key] = value;
            });
          }
          try {
            Object.defineProperty(data, "_meta", {
              value: { status: response.status, headers: metaHeaders },
              enumerable: false,
              configurable: true,
              writable: true,
            });
          } catch {
            // frozen objects — skip
          }
        }
        emitTelemetry();
        return data as T;
      }

      // Don't retry 401 (handled by token refresh) or non-retryable 4xx
      if (!isRetryable(response.status)) {
        const body = await parseErrorBody(response);
        const err = new SoundCloudError(response.status, response.statusText, body as SoundCloudErrorBody);
        emitTelemetry(err.message);
        throw err;
      }

      lastResponse = response;

      if (attempt < retryConfig.maxRetries) {
        retryCount = attempt + 1;
        const delayMs = getRetryDelay(response, attempt, retryConfig);
        retryConfig.onDebug?.(
          `Retry ${attempt + 1}/${retryConfig.maxRetries} after ${Math.round(delayMs)}ms (status ${response.status})`,
        );
        retryConfig.onRetry?.({
          attempt: retryCount,
          delayMs,
          reason: `${response.status} ${response.statusText}`,
          status: response.status,
          url,
        });
        await delay(delayMs);
      }
    }

    // All retries exhausted
    const body = await parseErrorBody(lastResponse!);
    const err = new SoundCloudError(lastResponse!.status, lastResponse!.statusText, body as SoundCloudErrorBody);
    emitTelemetry(err.message);
    throw err;
  };

  try {
    return await execute();
  } catch (err) {
    // Auto-refresh on 401
    if (
      refreshCtx?.onTokenRefresh &&
      err instanceof SoundCloudError &&
      err.status === 401
    ) {
      const newToken = await refreshCtx.onTokenRefresh();
      refreshCtx.setToken(newToken.access_token, newToken.refresh_token);
      return execute(newToken.access_token);
    }
    throw err;
  }
}

/**
 * Fetch an absolute URL (e.g. `next_href` from paginated responses).
 *
 * Used internally for pagination — follows the same retry logic as {@link scFetch}.
 *
 * @param url - Absolute URL to fetch (typically a `next_href` value)
 * @param token - OAuth access token to include in the Authorization header
 * @param retryConfig - Optional retry configuration override
 * @returns Parsed JSON response
 * @throws {SoundCloudError} When the API returns a non-retryable error status
 *
 * @example
 * ```ts
 * import { scFetchUrl } from 'soundcloud-api-ts';
 *
 * const nextPage = await scFetchUrl<SoundCloudPaginatedResponse<SoundCloudTrack>>(
 *   response.next_href,
 *   'your-access-token',
 * );
 * ```
 */
export async function scFetchUrl<T>(
  url: string,
  token?: string,
  retryConfig?: RetryConfig,
  onRequest?: (telemetry: SCRequestTelemetry) => void,
): Promise<T> {
  const config = retryConfig ?? DEFAULT_RETRY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `OAuth ${token}`;

  const startTime = Date.now();
  let retryCount = 0;
  let finalStatus = 0;

  const emitTelemetry = (error?: string) => {
    if (!onRequest) return;
    onRequest({
      method: "GET",
      path: url,
      durationMs: Date.now() - startTime,
      status: finalStatus,
      retryCount,
      ...(error ? { error } : {}),
    });
  };

  let lastResponse: Awaited<ReturnType<typeof fetch>> | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const response = await fetch(url, { method: "GET", headers, redirect: "manual" });

    finalStatus = response.status;

    if (response.status === 302) {
      const location = response.headers.get("location");
      if (location) {
        emitTelemetry();
        return location as T;
      }
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
      emitTelemetry();
      return undefined as T;
    }

    if (response.ok) {
      const data = await response.json();
      if (typeof data === "object" && data !== null) {
        const metaHeaders: Record<string, string> = {};
        if (typeof response.headers.forEach === "function") {
          response.headers.forEach((value: string, key: string) => {
            metaHeaders[key] = value;
          });
        }
        try {
          Object.defineProperty(data, "_meta", {
            value: { status: response.status, headers: metaHeaders },
            enumerable: false,
            configurable: true,
            writable: true,
          });
        } catch {
          // frozen objects — skip
        }
      }
      emitTelemetry();
      return data as T;
    }

    if (!isRetryable(response.status)) {
      const body = await parseErrorBody(response);
      const err = new SoundCloudError(response.status, response.statusText, body as SoundCloudErrorBody);
      emitTelemetry(err.message);
      throw err;
    }

    lastResponse = response;

    if (attempt < config.maxRetries) {
      retryCount = attempt + 1;
      const delayMs = getRetryDelay(response, attempt, config);
      config.onDebug?.(
        `Retry ${attempt + 1}/${config.maxRetries} after ${Math.round(delayMs)}ms (status ${response.status})`,
      );
      config.onRetry?.({
        attempt: retryCount,
        delayMs,
        reason: `${response.status} ${response.statusText}`,
        status: response.status,
        url,
      });
      await delay(delayMs);
    }
  }

  const body = await parseErrorBody(lastResponse!);
  const err = new SoundCloudError(lastResponse!.status, lastResponse!.statusText, body as SoundCloudErrorBody);
  emitTelemetry(err.message);
  throw err;
}
