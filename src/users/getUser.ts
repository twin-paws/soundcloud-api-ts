import { scFetchAndMap } from "../client/http.js";
import { SCApiUserToTSDUser } from "../mappers/user.js";
import type { SCApiUser } from "../types/api.js";
import type { SCUser } from "../types/models.js";

export const GetSCUserWithId = (token: string, userId: string): Promise<SCUser> => {
  return scFetchAndMap<SCUser, SCApiUser>(
    { path: `/users/${userId}`, method: "GET", token },
    SCApiUserToTSDUser
  );
};
