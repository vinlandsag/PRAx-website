export function memberProfileHref(id: string, from: "chat" | "leaderboard" = "chat") {
  return `/members/${encodeURIComponent(id)}?from=${from}`;
}
