import { scFetch } from "../client/http.js";

/** DELETE /likes/tracks/:id — unlikes a track */
export const unlikeTrack = async (token: string, trackId: string | number): Promise<boolean> => {
  try {
    await scFetch<unknown>({ path: `/likes/tracks/${trackId}`, method: "DELETE", token });
    return true;
  } catch {
    return false;
  }
};
