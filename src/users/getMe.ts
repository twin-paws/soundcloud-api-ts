import { scFetch } from "../client/http.js";
import type { SoundCloudMe } from "../types/api.js";

export const getMe = (token: string): Promise<SoundCloudMe> =>
  scFetch<SoundCloudMe>({ path: "/me", method: "GET", token });
