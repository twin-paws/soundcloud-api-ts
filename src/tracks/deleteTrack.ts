import { scFetch } from "../client/http.js";

/** DELETE /tracks/:id — deletes a track */
export const deleteTrack = (token: string, trackId: string | number): Promise<void> =>
  scFetch<void>({ path: `/tracks/${trackId}`, method: "DELETE", token });
