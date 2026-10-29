import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as upload } from "@/app/api/chat/attachments/route";
import { GET as download, DELETE as removeUpload } from "@/app/api/chat/attachments/[id]/route";
import { GET as workspace, PATCH } from "@/app/api/workspace/route";
import { authStore } from "@/lib/db/auth-store";
import { signSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { workspaceStore } from "./store";
import { attachmentStore } from "./attachment-store";
import { memberProfileHref } from "./members";
let member: SessionUser, other: SessionUser;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64"
);
const cookie = (user: SessionUser) => ({ cookie: `prax_session=${signSession(user)}` });
beforeAll(async () => {
  await authStore.initDefaultSeed();
  member = (await authStore.findUserById("usr_member_01"))!;
  other = await authStore.createUser({
    email: "unpublished-email@example.test",
    name: "Other account",
    passwordHash: null,
    status: "APPROVED",
  });
});
beforeEach(() => {
  workspaceStore.reset();
  vi.useRealTimers();
});
function uploadRequest(
  user: SessionUser | undefined,
  name = "image.png",
  bytes: Uint8Array = png,
  type = "image/png"
) {
  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes).buffer], name, { type }));
  return new Request("http://localhost/api/chat/attachments", {
    method: "POST",
    headers: user ? cookie(user) : {},
    body: form,
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });
function requestFile(user: SessionUser | undefined, id: string, range?: string, query = "") {
  return new Request(`http://localhost/api/chat/attachments/${id}${query}`, {
    headers: { ...(user ? cookie(user) : {}), ...(range ? { range } : {}) },
  });
}
async function put(name = "image.png", bytes: Uint8Array = png) {
  const response = await upload(uploadRequest(member, name, bytes));
  expect(response.status).toBe(201);
  return (await response.json()).attachment;
}
async function send(ids: string[], content = "") {
  return PATCH(
    new Request("http://localhost/api/workspace", {
      method: "PATCH",
      headers: cookie(member),
      body: JSON.stringify({
        resource: "messages",
        operation: "create",
        data: { content, attachmentIds: ids },
      }),
    })
  );
}
describe("profiles opened through interactions", () => {
  it("opens an approved account before their first workspace visit without leaking private fields", async () => {
    const response = await workspace(
      new Request(`http://localhost/api/workspace?memberId=${other.id}`, {
        headers: cookie(member),
      })
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({ isDemo: false, profile: { name: "Other account" } });
    for (const field of ["email", "passwordHash", "settings", "todos", "notes", "goals"])
      expect(JSON.stringify(result)).not.toContain(`"${field}"`);
    expect(JSON.stringify(result)).not.toContain("unpublished-email");
  });
  it("returns 404 for inactive and unknown targets and 401 for visitors", async () => {
    for (const id of ["usr_pending_01", "usr_suspended_01", "missing"]) {
      expect(
        (
          await workspace(
            new Request(`http://localhost/api/workspace?memberId=${id}`, {
              headers: cookie(member),
            })
          )
        ).status
      ).toBe(404);
    }
    expect(
      (await workspace(new Request(`http://localhost/api/workspace?memberId=${other.id}`))).status
    ).toBe(401);
  });
  it("labels sample profiles and uses context-specific links without creating accounts", async () => {
    const result = await (
      await workspace(
        new Request("http://localhost/api/workspace?memberId=demo_meera", {
          headers: cookie(member),
        })
      )
    ).json();
    expect(result).toMatchObject({ isDemo: true, profile: { name: "Meera Shah" } });
    expect(await authStore.findUserById("demo_meera")).toBeNull();
    expect(memberProfileHref("meera", "leaderboard")).toBe("/members/demo_meera?from=leaderboard");
    expect(memberProfileHref("usr_admin_01", "chat")).toBe("/members/usr_admin_01?from=chat");
  });
});
describe("chat media permissions and validation", () => {
  it("preserves case-sensitive browser multipart boundaries", async () => {
    const boundary = "----WebKitFormBoundaryCaseSensitive";
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="readme.txt"\r\nContent-Type: text/plain\r\n\r\nSafe text\r\n--${boundary}--\r\n`;
    const response = await upload(
      new Request("http://localhost/api/chat/attachments", {
        method: "POST",
        headers: { ...cookie(member), "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body,
      })
    );
    expect(response.status).toBe(201);
  });
  it("blocks visitor and inactive uploads", async () => {
    expect((await upload(uploadRequest(undefined))).status).toBe(401);
    expect((await upload(uploadRequest({ ...member, status: "PENDING_APPROVAL" }))).status).toBe(
      403
    );
  });
  it("rejects foreign-origin uploads", async () => {
    const request = uploadRequest(member);
    request.headers.set("origin", "https://other.test");
    expect((await upload(request)).status).toBe(403);
  });
  it("detects content type and keeps an unsent attachment private", async () => {
    const response = await upload(uploadRequest(member, "image.png", png, "text/html"));
    expect(response.status).toBe(201);
    const file = (await response.json()).attachment;
    expect(file).toMatchObject({ kind: "image", mimeType: "image/png", size: png.length });
    expect((await download(requestFile(other, file.id), params(file.id))).status).toBe(404);
    const own = await download(requestFile(member, file.id), params(file.id));
    expect(own.status).toBe(200);
    expect(own.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await own.arrayBuffer())).toEqual(png);
  });
  it("allows attachment-only messages, approved recipients and caption edits", async () => {
    const file = await put();
    const response = await send([file.id]);
    expect(response.status).toBe(200);
    const message = (await response.json()).messages.at(-1);
    expect(message).toMatchObject({ content: "", attachments: [{ id: file.id }] });
    expect((await download(requestFile(other, file.id), params(file.id))).status).toBe(200);
    expect((await download(requestFile(undefined, file.id), params(file.id))).status).toBe(401);
    const edited = await PATCH(
      new Request("http://localhost/api/workspace", {
        method: "PATCH",
        headers: cookie(member),
        body: JSON.stringify({
          resource: "messages",
          operation: "update",
          id: message.id,
          data: { content: "" },
        }),
      })
    );
    expect(edited.status).toBe(200);
  });
  it("prevents claiming another account's upload and reusing a published upload", async () => {
    const file = await put();
    const stolen = await PATCH(
      new Request("http://localhost/api/workspace", {
        method: "PATCH",
        headers: cookie(other),
        body: JSON.stringify({
          resource: "messages",
          operation: "create",
          data: { attachmentIds: [file.id] },
        }),
      })
    );
    expect(stolen.status).toBe(403);
    expect((await send([file.id, file.id])).status).toBe(400);
    expect((await send([file.id])).status).toBe(200);
    expect((await send([file.id])).status).toBe(403);
  });
  it("removes attachment bytes when its message is removed", async () => {
    const file = await put();
    const response = await send([file.id]);
    const message = (await response.json()).messages.at(-1);
    const removed = await PATCH(
      new Request("http://localhost/api/workspace", {
        method: "PATCH",
        headers: cookie(member),
        body: JSON.stringify({ resource: "messages", operation: "delete", id: message.id }),
      })
    );
    expect(removed.status).toBe(200);
    expect((await download(requestFile(member, file.id), params(file.id))).status).toBe(404);
  });
  it("allows only the uploader to remove unsent files and rejects direct removal after sending", async () => {
    const file = await put();
    expect(
      (
        await removeUpload(
          new Request(`http://localhost${file.url}`, { method: "DELETE", headers: cookie(other) }),
          params(file.id)
        )
      ).status
    ).toBe(404);
    expect(
      (
        await removeUpload(
          new Request(`http://localhost${file.url}`, { method: "DELETE", headers: cookie(member) }),
          params(file.id)
        )
      ).status
    ).toBe(204);
    expect((await download(requestFile(member, file.id), params(file.id))).status).toBe(404);
    const sent = await put();
    await send([sent.id]);
    expect(
      (
        await removeUpload(
          new Request(`http://localhost${sent.url}`, { method: "DELETE", headers: cookie(member) }),
          params(sent.id)
        )
      ).status
    ).toBe(409);
  });
  it.each([
    ["wrong.png", new TextEncoder().encode("not an image")],
    ["unsafe.svg", new TextEncoder().encode("<svg/>")],
    ["run.exe", new Uint8Array([77, 90])],
    ["empty.txt", new Uint8Array()],
    ["payload.constructor", new TextEncoder().encode("not an allowed extension")],
    ["payload.__proto__", new TextEncoder().encode("not an allowed extension")],
  ])("rejects invalid or unsupported file %s", async (name, bytes) => {
    expect((await upload(uploadRequest(member, name, bytes))).status).toBe(400);
  });
  it("rejects oversized files and malformed multipart data", async () => {
    expect(
      (await upload(uploadRequest(member, "big.png", new Uint8Array(5 * 1024 * 1024 + 1)))).status
    ).toBe(400);
    expect(
      (
        await upload(
          new Request("http://localhost/api/chat/attachments", {
            method: "POST",
            headers: { ...cookie(member), "content-type": "multipart/form-data; boundary=missing" },
            body: "not a form",
          })
        )
      ).status
    ).toBe(400);
  });
  it("serves documents as downloads and supports byte ranges for video seeking", async () => {
    const text = new TextEncoder().encode("Safe document content"),
      doc = await put("readme.txt", text);
    await send([doc.id]);
    const response = await download(requestFile(other, doc.id), params(doc.id));
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    const mp4 = new Uint8Array([
      0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0, 105, 115, 111, 109, 109, 112,
      52, 50,
    ]);
    const video = await put("clip.mp4", mp4);
    await send([video.id]);
    const partial = await download(requestFile(other, video.id, "bytes=4-11"), params(video.id));
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe("bytes 4-11/24");
    expect(new Uint8Array(await partial.arrayBuffer())).toEqual(mp4.slice(4, 12));
    expect(
      (await download(requestFile(other, video.id, "bytes=100-200"), params(video.id))).status
    ).toBe(416);
    const suffix = await download(requestFile(other, video.id, "bytes=-4"), params(video.id));
    expect(new Uint8Array(await suffix.arrayBuffer())).toEqual(mp4.slice(-4));
  });
  it("limits per-message file count and expires abandoned uploads", async () => {
    const files = await Promise.all([put(), put(), put(), put()]);
    expect((await send(files.map((file) => file.id))).status).toBe(400);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 31 * 60_000);
    expect(() => attachmentStore.get(files[0].id, member.id)).toThrow("Attachment not found");
    vi.useRealTimers();
  });
});
