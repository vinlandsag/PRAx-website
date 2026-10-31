import type { SessionUser } from "./types";
import { hashPassword, verifyPassword } from "./password";

// Public local fixture retained at the user's request. Never a production account.
const member: Readonly<SessionUser> = Object.freeze({
  id: "usr_member_01",
  email: "member@prax.build",
  name: "Arjun Varma",
  role: "MEMBER",
  status: "APPROVED",
});
let passwordHash: Promise<string> | undefined;

export function localDevelopmentMember(request: Request): SessionUser | null {
  if (process.env.NODE_ENV !== "development") return null;
  try {
    const url = new URL(request.url);
    const host = new URL(url.protocol + "//" + (request.headers.get("host") || url.host));
    if (!["localhost", "127.0.0.1", "[::1]"].includes(host.hostname)) return null;
    return { ...member };
  } catch {
    return null;
  }
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.host;
    return new URL(origin).origin === new URL(url.protocol + "//" + host).origin;
  } catch {
    return false;
  }
}

export async function verifyDevelopmentPassword(password: string) {
  if (process.env.NODE_ENV !== "development") return false;
  passwordHash ??= hashPassword("MemberPass123!");
  return verifyPassword(password, await passwordHash);
}

export function matchesDevelopmentMember(user: SessionUser, fixture: SessionUser) {
  return (
    user.id === fixture.id &&
    user.email === fixture.email &&
    user.role === fixture.role &&
    user.status === fixture.status
  );
}
