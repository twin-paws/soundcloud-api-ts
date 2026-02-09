/**
 * Shape of error response bodies returned by the SoundCloud API.
 *
 * The API returns varying combinations of these fields depending on the endpoint
 * and error type. All fields are optional.
 *
 * @example
 * ```json
 * {
 *   "code": 401,
 *   "message": "invalid_client",
 *   "link": "https://developers.soundcloud.com/docs/api/explorer/open-api",
 *   "status": "401 - Unauthorized",
 *   "errors": [{"error_message": "invalid_client"}],
 *   "error": null,
 *   "error_code": "invalid_client"
 * }
 * ```
 *
 * @see https://developers.soundcloud.com/docs/api/explorer/open-api
 */
export interface SoundCloudErrorBody {
  /** HTTP status code echoed in the response body */
  code?: number;
  /** Error message from SoundCloud (e.g. "invalid_client", "404 - Not Found") */
  message?: string;
  /** Human-readable status string (e.g. "401 - Unauthorized") */
  status?: string;
  /** Link to SoundCloud API documentation */
  link?: string;
  /** Array of individual error detail objects */
  errors?: Array<{ error_message?: string }>;
  /** Generic error field — typically null in SoundCloud responses */
  error?: string | null;
  /** Machine-readable error code (e.g. "invalid_client") */
  error_code?: string;
  /** OAuth error description, present in `/oauth2/token` error responses */
  error_description?: string;
}

/**
 * Error class thrown when a SoundCloud API request fails.
 *
 * Provides structured access to HTTP status, error codes, and convenience
 * getters for common error categories.
 *
 * @example
 * ```ts
 * import { SoundCloudError } from 'tsd-soundcloud';
 *
 * try {
 *   await sc.tracks.getTrack(999999999);
 * } catch (err) {
 *   if (err instanceof SoundCloudError) {
 *     if (err.isNotFound) console.log('Track not found');
 *     if (err.isRateLimited) console.log('Rate limited, retry later');
 *     console.log(err.status, err.message);
 *   }
 * }
 * ```
 */
export class SoundCloudError extends Error {
  /** HTTP status code of the failed response (e.g. 401, 404, 429) */
  readonly status: number;
  /** HTTP status text of the failed response (e.g. "Unauthorized", "Not Found") */
  readonly statusText: string;
  /** Machine-readable error code from SoundCloud (e.g. "invalid_client"), if present */
  readonly errorCode?: string;
  /** Link to SoundCloud API documentation, if included in the error response */
  readonly docsLink?: string;
  /** Individual error messages extracted from the response body's `errors` array */
  readonly errors: string[];
  /** The full parsed error response body, if available */
  readonly body?: SoundCloudErrorBody;

  /**
   * Creates a new SoundCloudError.
   *
   * @param status - HTTP status code
   * @param statusText - HTTP status text
   * @param body - Parsed JSON error response body from SoundCloud, if available
   */
  constructor(status: number, statusText: string, body?: SoundCloudErrorBody) {
    // Build the most useful message we can from SC's response
    const msg =
      body?.message ||
      body?.error_description ||
      body?.error_code ||
      body?.errors?.[0]?.error_message ||
      body?.error ||
      `${status} ${statusText}`;

    super(msg);
    this.name = "SoundCloudError";
    this.status = status;
    this.statusText = statusText;
    this.errorCode = body?.error_code ?? undefined;
    this.docsLink = body?.link ?? undefined;
    this.errors =
      body?.errors
        ?.map((e) => e.error_message)
        .filter((m): m is string => !!m) ?? [];
    this.body = body;
  }

  /** True if status is 401 Unauthorized (invalid or expired token) */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True if status is 403 Forbidden (insufficient permissions) */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True if status is 404 Not Found (resource does not exist) */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True if status is 429 Too Many Requests (rate limit exceeded) */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** True if status is 5xx (SoundCloud server error) */
  get isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}
