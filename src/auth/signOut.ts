/** POST /sign-out — invalidates session associated with current token */
export const signOut = async (accessToken: string): Promise<void> => {
  const res = await fetch("https://secure.soundcloud.com/sign-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!res.ok) throw new Error(`Sign-out failed: ${res.status}`);
};
