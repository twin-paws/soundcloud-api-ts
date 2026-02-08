import { scFetch } from "../client/http.js";

export const ResolveSCUrl = (token: string, url: string): Promise<string> => {
  return scFetch<string>({
    path: `/resolve?url=${url}`,
    method: "GET",
    token,
  });
};
