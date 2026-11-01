import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET, PATCH } from "./route";

const mock = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => mock);

const secret = "settings-route-test-secret-longer-than-thirty-two-characters";
const member: SessionUser = {
  id: "settings-member-1",
  name: "Member",
  email: "member@example.test",
  role: "MEMBER",
  status: "APPROVED",
};
const account = { id: member.id, name: member.name, role: member.role, status: member.status };
const row = {
  theme: "DARK",
  reviewNotifications: false,
  streakReminder: true,
  chatNotifications: false,
  showPortfolio: false,
};
const profile = {
  name: member.name,
  handle: "@member",
  bio: "",
  skills: [],
  currentProject: "",
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  avatarUrl: "",
};

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

describe("GET /api/users/me/settings", () => {
  it("returns persisted settings for the approved session account", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(account)
      .mockResolvedValueOnce({ id: member.id, ...profile });
    mock.getPrismaClient.mockReturnValue({
      user: { findUnique },
      userPreferences: { findUnique: vi.fn().mockResolvedValue(row) },
    });

    const response = await GET(
      request("http://localhost/api/users/me/settings?userId=someone-else", member)
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: { email: member.email, role: member.role },
      profile,
      settings: {
        theme: "dark",
        reviewNotifications: false,
        streakReminder: true,
        chatNotifications: false,
        showPortfolio: false,
      },
    });
    expect(findUnique).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: member.id } })
    );
    expect(findUnique).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: member.id } })
    );
  });

  it("uses UI defaults until the member has saved preferences", async () => {
    mock.getPrismaClient.mockReturnValue({
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(account)
          .mockResolvedValueOnce({ id: member.id, ...profile }),
      },
      userPreferences: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const response = await GET(request("http://localhost/api/users/me/settings", member));
    expect((await response.json()).settings).toEqual({
      theme: "light",
      reviewNotifications: true,
      streakReminder: true,
      chatNotifications: false,
      showPortfolio: true,
    });
  });

  it("requires an authenticated approved persisted account", async () => {
    const anonymous = await GET(request("http://localhost/api/users/me/settings"));
    expect(anonymous.status).toBe(401);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();

    mock.getPrismaClient.mockReturnValue({ user: { findUnique: vi.fn().mockResolvedValue(null) } });
    const missing = await GET(request("http://localhost/api/users/me/settings", member));
    expect(missing.status).toBe(403);
  });
});

describe("PATCH /api/users/me/settings", () => {
  it("upserts preferences using only the signed-in user's ID", async () => {
    const upsert = vi.fn().mockResolvedValue(row);
    mock.getPrismaClient.mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(account) },
      userPreferences: { upsert },
    });
    const response = await PATCH(
      request("http://localhost/api/users/me/settings", member, {
        theme: "dark",
        showPortfolio: false,
      })
    );
    expect(response.status).toBe(200);
    expect((await response.json()).settings).toMatchObject({ theme: "dark", showPortfolio: false });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: member.id },
        update: { theme: "DARK", showPortfolio: false },
        create: expect.objectContaining({ userId: member.id, showPortfolio: false }),
      })
    );
  });

  it("rejects client-selected IDs, roles, malformed values, cross-origin and anonymous writes", async () => {
    const upsert = vi.fn();
    mock.getPrismaClient.mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(account) },
      userPreferences: { upsert },
    });
    const invalid = [
      { userId: "victim", theme: "dark" },
      { role: "ADMIN" },
      { theme: "system" },
      { streakReminder: "yes" },
      {},
    ];
    for (const body of invalid) {
      expect(
        (await PATCH(request("http://localhost/api/users/me/settings", member, body))).status
      ).toBe(400);
    }
    expect(
      (
        await PATCH(
          request(
            "http://localhost/api/users/me/settings",
            member,
            { theme: "dark" },
            "https://evil.test"
          )
        )
      ).status
    ).toBe(403);
    expect(
      (await PATCH(request("http://localhost/api/users/me/settings", undefined, { theme: "dark" })))
        .status
    ).toBe(401);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rechecks persisted approval before saving", async () => {
    mock.getPrismaClient.mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ ...account, status: "SUSPENDED" }) },
      userPreferences: { upsert: vi.fn() },
    });
    const response = await PATCH(
      request("http://localhost/api/users/me/settings", member, { chatNotifications: true })
    );
    expect(response.status).toBe(403);
  });
});
