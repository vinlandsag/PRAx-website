import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { GET as listUsers } from "./route";
import { POST as approveUser } from "./[id]/approve/route";

const mock = vi.hoisted(() => ({ getPrismaClient: vi.fn() }));
vi.mock("@/lib/db/prisma", () => mock);

const secret = "users-route-test-session-secret-more-than-32-characters";
const member: SessionUser = {
  id: "pending-member",
  email: "member@example.test",
  name: "Pending Member",
  role: "MEMBER",
  status: "APPROVED",
};
const admin: SessionUser = { ...member, id: "current-admin", role: "ADMIN" };

function request(path: string, user?: SessionUser) {
  return new Request(`http://localhost${path}`, {
    headers: user ? { cookie: `prax_session=${signSession(user)}` } : {},
  });
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  mock.getPrismaClient.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("persisted admin member access", () => {
  it("denies visitors and members before querying the database", async () => {
    expect((await listUsers(request("/api/admin/users"))).status).toBe(401);
    expect((await listUsers(request("/api/admin/users", member))).status).toBe(403);
    expect(mock.getPrismaClient).not.toHaveBeenCalled();
  });

  it("lists only approved fields for the selected status", async () => {
    const createdAt = new Date("2026-10-31T10:00:00Z");
    mock.getPrismaClient.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: admin.id,
          name: admin.name,
          role: "ADMIN",
          status: "APPROVED",
        }),
        findMany: vi.fn().mockResolvedValue([
          { id: member.id, name: member.name, email: member.email, status: "PENDING_APPROVAL", createdAt },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    });
    const response = await listUsers(request("/api/admin/users?status=PENDING_APPROVAL", admin));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.users[0]).not.toHaveProperty("passwordHash");
    expect(result.users[0].status).toBe("PENDING_APPROVAL");
  });

  it("approves only pending members and blocks an admin from approving themselves", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: admin.id, name: admin.name, role: "ADMIN", status: "APPROVED" })
      .mockResolvedValueOnce({
        id: member.id,
        name: member.name,
        email: member.email,
        role: "MEMBER",
        status: "APPROVED",
        createdAt: new Date("2026-10-31T10:00:00Z"),
      });
    mock.getPrismaClient.mockReturnValue({ user: { updateMany, findUnique } });
    const response = await approveUser(request(`/api/admin/users/${member.id}/approve`, admin), {
      params: Promise.resolve({ id: member.id }),
    });
    expect(response.status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: member.id, role: "MEMBER", status: "PENDING_APPROVAL" },
      data: { status: "APPROVED" },
    });
    const self = await approveUser(request(`/api/admin/users/${admin.id}/approve`, admin), {
      params: Promise.resolve({ id: admin.id }),
    });
    expect(self.status).toBe(403);
  });
});
