/**
 * Returns an encoded SoundCloud widget embed URL for a given track ID.
 *
 * @param trackId - The track's numeric ID or string identifier
 * @returns URL-encoded widget embed URL string
 *
 * @example
 * ```ts
 * import { getSoundCloudWidgetUrl } from 'soundcloud-api-ts';
 *
 * const widgetUrl = getSoundCloudWidgetUrl(123456);
 * console.log(widgetUrl);
 * ```
 */
export const getSoundCloudWidgetUrl = (trackId: string | number): string =>
  `https%3A//api.soundcloud.com/tracks/${trackId}&show_teaser=false&color=%2300a99d&inverse=false&show_user=false&sharing=false&buying=false&liking=false&show_artwork=false&show_name=false`;
