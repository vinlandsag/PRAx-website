import { sampleBuilders } from "./catalog";
import type { Profile } from "./types";

// These are read-only display fixtures, never authentication accounts.
export const sampleMembers = sampleBuilders
  .filter((builder) => !builder.id.startsWith("usr_"))
  .map((builder) => ({
    id: `demo_${builder.id}`,
    profile: {
      name: builder.name,
      handle: `@${builder.id}`,
      bio: "",
      skills: [],
      currentProject: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      avatarUrl: "",
    } satisfies Profile,
  }));
export function demoMember(id: string) {
  return sampleMembers.find((member) => member.id === id || member.id === `demo_${id}`);
}
export function memberProfileHref(id: string, from: "chat" | "leaderboard" = "chat") {
  return `/members/${encodeURIComponent(demoMember(id)?.id ?? id)}?from=${from}`;
}
