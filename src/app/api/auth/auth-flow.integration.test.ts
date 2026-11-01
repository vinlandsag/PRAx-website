import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { resetRateLimits } from "@/lib/auth/rate-limit";
import { hashInviteCode } from "@/lib/auth/persistence";
import { getPrismaClient } from "@/lib/db/prisma";
import { POST as createInvite } from "@/app/api/invites/route";
import { POST as verifyInvite } from "@/app/api/invites/verify/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as currentUser } from "@/app/api/users/me/route";
import { POST as approveUser } from "@/app/api/admin/users/[id]/approve/route";
import { GET as listTasks } from "@/app/api/tasks/route";
import type { SessionUser } from "@/lib/auth/types";

const database = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const prisma = getPrismaClient();
const runId = `auth-flow-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const adminEmail = `${runId}-admin@example.test`;
const memberEmail = `${runId}-flow-member@example.test`;
const password = "integration-test-password-123";
const sessionSecret = "integration-auth-session-secret-more-than-32-chars";
const previousSessionSecret = process.env.SESSION_SECRET;
let admin: SessionUser;

function jsonRequest(path: string, body: unknown, user?: SessionUser) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(user ? { cookie: `prax_session=${signSession(user)}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function cookieFrom(response: Response) {
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

database("auth and invite PostgreSQL integration", () => {
  beforeAll(async () => {
    if (!prisma) throw new Error("TEST_DATABASE_URL did not initialize Prisma.");
    process.env.SESSION_SECRET = sessionSecret;
    const row = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Synthetic Auth Admin",
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        status: "APPROVED",
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    admin = row;
  });

  beforeEach(() => resetRateLimits());

  afterAll(async () => {
    if (!prisma) return;
    await prisma.inviteCode.deleteMany({ where: { createdById: admin?.id } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: runId } },
    });
    if (previousSessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSessionSecret;
  });

  it("registers as pending, approves through an admin route, then logs in and reads current identity/tasks", async () => {
    const inviteResponse = await createInvite(jsonRequest("/api/invites", { maxUses: 1 }, admin));
    expect(inviteResponse.status).toBe(201);
    const code = (await inviteResponse.json()).invite.code as string;

    const verify = await verifyInvite(jsonRequest("/api/invites/verify", { code }));
    expect(verify.status).toBe(200);
    expect(await verify.json()).toEqual({ valid: true, remainingUses: 1 });

    const registration = await register(
      jsonRequest("/api/auth/register", {
        name: "Synthetic Auth Member",
        email: memberEmail.toUpperCase(),
        password,
        inviteCode: code.toLowerCase(),
      })
    );
    expect(registration.status).toBe(201);
    const pending = (await registration.json()).user;
    expect(pending).toMatchObject({
      email: memberEmail,
      role: "MEMBER",
      status: "PENDING_APPROVAL",
    });
    expect(cookieFrom(registration)).not.toBe("");

    const exhausted = await verifyInvite(jsonRequest("/api/invites/verify", { code }));
    expect(exhausted.status).toBe(400);
    expect((await exhausted.json()).error.code).toBe("INVITE_EXHAUSTED");

    const approval = await approveUser(
      new Request(`http://localhost/api/admin/users/${pending.id}/approve`, {
        method: "POST",
        headers: { cookie: `prax_session=${signSession(admin)}` },
      }),
      { params: Promise.resolve({ id: pending.id }) }
    );
    expect(approval.status).toBe(200);

    const signedIn = await login(jsonRequest("/api/auth/login", { email: memberEmail, password }));
    expect(signedIn.status).toBe(200);
    expect((await signedIn.json()).user).toMatchObject({ role: "MEMBER", status: "APPROVED" });
    const cookie = cookieFrom(signedIn);
    expect(cookie).not.toBe("");

    const me = await currentUser(
      new Request("http://localhost/api/users/me", { headers: { cookie } })
    );
    expect(me.status).toBe(200);
    expect((await me.json()).user).toMatchObject({ id: pending.id, status: "APPROVED" });
    const tasks = await listTasks(
      new Request("http://localhost/api/tasks", { headers: { cookie } })
    );
    expect(tasks.status).toBe(200);
  });

  it("atomically allows only one registration to consume a single-use invite under concurrency", async () => {
    const inviteResponse = await createInvite(jsonRequest("/api/invites", { maxUses: 1 }, admin));
    expect(inviteResponse.status).toBe(201);
    const code = (await inviteResponse.json()).invite.code as string;
    const registrations = await Promise.all(
      [`${runId}-concurrent-a@example.test`, `${runId}-concurrent-b@example.test`].map((email) =>
        register(
          jsonRequest("/api/auth/register", {
            name: "Concurrent Synthetic Member",
            email,
            password,
            inviteCode: code,
          })
        )
      )
    );
    expect(registrations.map((response) => response.status).sort()).toEqual([201, 400]);
    const rejected = registrations.find((response) => response.status === 400);
    expect(rejected && (await rejected.json()).error.code).toBe("INVITE_EXHAUSTED");
    const invite = await prisma!.inviteCode.findUnique({
      where: { codeHash: hashInviteCode(code) },
    });
    expect(invite).toMatchObject({ usedCount: 1, status: "USED" });
  });

  it("rolls back invite use when normalized email uniqueness rejects the registration", async () => {
    const duplicateEmail = `${runId}-rollback@example.test`;
    const firstInvite = (
      await createInvite(jsonRequest("/api/invites", { maxUses: 1 }, admin)).then((response) =>
        response.json()
      )
    ).invite;
    const first = await register(
      jsonRequest("/api/auth/register", {
        name: "Duplicate Test User",
        email: duplicateEmail,
        password,
        inviteCode: firstInvite.code,
      })
    );
    expect(first.status).toBe(201);

    const secondInvite = (
      await createInvite(jsonRequest("/api/invites", { maxUses: 1 }, admin)).then((response) =>
        response.json()
      )
    ).invite;
    const duplicate = await register(
      jsonRequest("/api/auth/register", {
        name: "Duplicate Test User",
        email: duplicateEmail.toUpperCase(),
        password,
        inviteCode: secondInvite.code,
      })
    );
    expect(duplicate.status).toBe(409);
    expect((await duplicate.json()).error.code).toBe("EMAIL_ALREADY_REGISTERED");
    const inviteRow = await prisma!.inviteCode.findUnique({
      where: { codeHash: hashInviteCode(secondInvite.code) },
    });
    expect(inviteRow).toMatchObject({ usedCount: 0, status: "ACTIVE" });
  });
});
