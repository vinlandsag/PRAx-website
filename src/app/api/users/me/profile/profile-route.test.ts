import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { signSession, verifySession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET, PATCH } from "./route";

const mock = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => mock);

const secret = "profile-route-test-secret-longer-than-thirty-two-characters";
const member: SessionUser = {
  id: "profile-member-1",
  name: "Milan Member",
  email: "milan@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
const persistedAccount = {
  id: member.id,
  name: member.name,
  role: member.role,
  status: member.status,
};
const storedProfile = {
  id: member.id,
  name: member.name,
  handle: "@milanbuilds",
  bio: "Building PRAX",
  skills: ["TypeScript"],
  currentProject: "PRAX",
  portfolioUrl: "https://example.test/portfolio",
  githubUrl: "",
  linkedinUrl: "",
  avatarUrl: "",
};
const expectedProfile = {
  name: storedProfile.name,
  handle: storedProfile.handle,
  bio: storedProfile.bio,
  skills: storedProfile.skills,
  currentProject: storedProfile.currentProject,
  portfolioUrl: storedProfile.portfolioUrl,
  githubUrl: storedProfile.githubUrl,
  linkedinUrl: storedProfile.linkedinUrl,
  avatarUrl: storedProfile.avatarUrl,
};
function withStats<T extends object>(prisma: T) {
  return Object.assign(prisma, {
    $queryRaw: vi
      .fn()
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]),
    $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    streak: { findUnique: vi.fn().mockResolvedValue({ current: 0 }) },
    submission: { count: vi.fn().mockResolvedValue(0) },
  });
}

function request(url: string, user?: SessionUser, body?: unknown, origin = "http://localhost") {
  return new Request(url, {
    method: body === undefined ? "GET" : "PATCH",
    headers: {
      ...(user ? { cookie: `prax_session=${signSession(user)}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json", origin }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv("NODE_ENV", "test");
  mock.getPrismaClient.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/users/me/profile", () => {
  it("loads only the signed-in user's profile fields", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(persistedAccount)
      .mockResolvedValueOnce(storedProfile);
    mock.getPrismaClient.mockReturnValue(withStats({ user: { findUnique } }));

    const response = await GET(
      request("http://localhost/api/users/me/profile?userId=someone-else", member)
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ profile: expectedProfile, stats: { totalPoints: 0 } });
    expect(findUnique).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: member.id } })
    );
    expect(findUnique).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: member.id }, select: expect.any(Object) })
    );
    expect(JSON.stringify(body)).not.toContain("email");
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("requires a valid session before accessing the database", async () => {
    const response = await GET(request("http://localhost/api/users/me/profile"));
    expect(response.status).toBe(401);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
  });

  it("denies a signed-in identity with no persisted approved account", async () => {
    mock.getPrismaClient.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    });
    const response = await GET(request("http://localhost/api/users/me/profile", member));
    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/users/me/profile", () => {
  it("saves validated fields by the signed-in user's ID and refreshes the name claim", async () => {
    const updated = { ...storedProfile, name: "Milan Updated", bio: "Updated bio" };
    const findUnique = vi.fn().mockResolvedValue(persistedAccount);
    const update = vi.fn().mockResolvedValue(updated);
    mock.getPrismaClient.mockReturnValue(withStats({ user: { findUnique, update } }));

    const response = await PATCH(
      request("http://localhost/api/users/me/profile", member, {
        name: " Milan Updated ",
        bio: "Updated bio",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      profile: { ...expectedProfile, name: updated.name, bio: updated.bio },
      stats: { totalPoints: 0 },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: member.id },
        data: { name: "Milan Updated", bio: "Updated bio" },
      })
    );
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly");
    const refreshed = verifySession(cookie!.split(";")[0].slice("prax_session=".length));
    expect(refreshed?.user.name).toBe("Milan Updated");
  });

  it("rejects client-selected user IDs without querying or updating any account", async () => {
    const update = vi.fn();
    mock.getPrismaClient.mockReturnValue({ user: { update } });
    const response = await PATCH(
      request("http://localhost/api/users/me/profile", member, {
        name: "Someone else",
        userId: "victim-user",
      })
    );
    expect(response.status).toBe(400);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects unsafe links, invalid handles, and oversized skills", async () => {
    const invalidBodies = [
      { portfolioUrl: "javascript:alert(1)" },
      { handle: "not-a-handle" },
      { skills: Array.from({ length: 16 }, (_, index) => `skill-${index}`) },
    ];
    for (const body of invalidBodies) {
      const response = await PATCH(request("http://localhost/api/users/me/profile", member, body));
      expect(response.status).toBe(400);
    }
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin write and a missing session", async () => {
    const crossOrigin = await PATCH(
      request("http://localhost/api/users/me/profile", member, { bio: "hello" }, "https://evil.test")
    );
    const anonymous = await PATCH(
      request("http://localhost/api/users/me/profile", undefined, { bio: "hello" })
    );
    expect(crossOrigin.status).toBe(403);
    expect(anonymous.status).toBe(401);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
  });

  it("revalidates account approval before changing the profile", async () => {
    mock.getPrismaClient.mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ ...persistedAccount, status: "SUSPENDED" }) },
    });
    const response = await PATCH(
      request("http://localhost/api/users/me/profile", member, { bio: "hello" })
    );
    expect(response.status).toBe(403);
  });

  it("returns a conflict when the requested handle is already used", async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError("unique handle", {
      code: "P2002",
      clientVersion: "7.10.1",
      meta: { target: ["handle"] },
    });
    mock.getPrismaClient.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue(persistedAccount),
        update: vi.fn().mockRejectedValue(conflict),
      },
    });
    const response = await PATCH(
      request("http://localhost/api/users/me/profile", member, { handle: "@takenhandle" })
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "HANDLE_ALREADY_TAKEN", status: 409 },
    });
  });
});
