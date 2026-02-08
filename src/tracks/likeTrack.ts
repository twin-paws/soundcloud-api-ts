import { scFetch } from "../client/http.js";

export const LikeSCTrack = async (
  token: string,
  trackId: string
): Promise<boolean> => {
  try {
    await scFetch<unknown>({
      path: `/likes/tracks/${trackId}`,
      method: "POST",
      token,
    });
    return true;
  } catch {
    return false;
  }
};
