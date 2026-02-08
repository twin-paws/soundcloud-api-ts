/**
 * Parses a SoundCloud tag_list string into an array of tags.
 * Handles quoted multi-word tags (e.g. `"hip hop" electronic bass`).
 */
export const GetTags = (tagList?: string): string[] => {
  if (!tagList) return [];

  // Parse quoted and unquoted tokens (replicates splitargs behavior)
  const tags: string[] = [];
  const regex = /[^\s"]+|"([^"]*)"/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(tagList)) !== null) {
    tags.push(match[1] ?? match[0]);
  }

  return tags.map((tag) =>
    (encodeURIComponent(tag.trim()) as string).replace(/[']/g, "\\$&")
  );
};
