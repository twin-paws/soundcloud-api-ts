/**
 * Returns an encoded SoundCloud widget URL for a track ID.
 */
export const getSCWidgetUrl = (trackId: string): string => {
  return `https%3A//api.soundcloud.com/tracks/${trackId}&show_teaser=false&color=%2300a99d&inverse=false&show_user=false&sharing=false&buying=false&liking=false&show_artwork=false&show_name=false`;
};
