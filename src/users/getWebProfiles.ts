import { scFetch } from "../client/http.js";
import type { SoundCloudWebProfile } from "../types/api.js";

/** GET /users/:id/web-profiles — returns user's external links */
export const getUserWebProfiles = (token: string, userId: string | number): Promise<SoundCloudWebProfile[]> =>
  scFetch<SoundCloudWebProfile[]>({ path: `/users/${userId}/web-profiles`, method: "GET", token });
