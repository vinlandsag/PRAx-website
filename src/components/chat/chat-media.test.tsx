// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatComposer } from "./ChatComposer";
import { ChatAttachments } from "./ChatAttachments";

const createURL = vi.fn(() => "blob:test-preview"),
  revokeURL = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", { value: createURL, configurable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: revokeURL, configurable: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const add = (files: File[]) =>
  fireEvent.change(screen.getByLabelText("Select chat attachments"), { target: { files } });
describe("chat attachment composer", () => {
  it("previews images and removes selected files without sending", () => {
    const send = vi.fn();
    render(<ChatComposer saving={false} onSend={send} />);
    add([new File(["image"], "photo.png", { type: "image/png" })]);
    expect(screen.getByRole("img", { name: "Preview of photo.png" }).getAttribute("src")).toBe(
      "blob:test-preview"
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove photo.png" }));
    expect(screen.queryByRole("img")).toBeNull();
    expect(revokeURL).toHaveBeenCalledWith("blob:test-preview");
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects empty, unsupported and excessive file selections", () => {
    render(<ChatComposer saving={false} onSend={vi.fn()} />);
    add([new File(["html"], "page.html")]);
    expect(screen.getByRole("alert").textContent).toContain("Choose an image");
    add([new File([], "empty.txt")]);
    expect(screen.getByRole("alert").textContent).toContain("Empty files");
    add([1, 2, 3, 4].map((n) => new File(["text"], `${n}.txt`)));
    expect(screen.getByRole("alert").textContent).toContain("up to 3");
  });
  it("uploads and sends an attachment-only message then clears the draft", async () => {
    const send = vi.fn().mockResolvedValue(true),
      fetcher = vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ attachment: { id: "upload-1" } }) });
    vi.stubGlobal("fetch", fetcher);
    render(<ChatComposer saving={false} onSend={send} />);
    add([new File(["notes"], "notes.txt")]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(send).toHaveBeenCalledWith("", ["upload-1"]));
    await waitFor(() =>
      expect(screen.queryByRole("list", { name: "Selected attachments" })).toBeNull()
    );
    expect(fetcher).toHaveBeenCalledWith(
      "/api/chat/attachments",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) })
    );
  });
  it("retains the draft after an upload failure and can retry", async () => {
    const send = vi.fn().mockResolvedValue(true),
      fetcher = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: "Upload failed. Try again." } }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ attachment: { id: "retried" } }) });
    vi.stubGlobal("fetch", fetcher);
    render(<ChatComposer saving={false} onSend={send} />);
    add([new File(["notes"], "notes.txt")]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText("notes.txt")).toBeDefined();
    expect(send).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(send).toHaveBeenCalledWith("", ["retried"]));
  });
  it("reuses an uploaded file when message creation needs retry", async () => {
    const send = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
      fetcher = vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ attachment: { id: "retained" } }) });
    vi.stubGlobal("fetch", fetcher);
    render(<ChatComposer saving={false} onSend={send} />);
    add([new File(["notes"], "notes.txt")]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(
        false
      )
    );
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("renders received media, downloads and preview errors accessibly", () => {
    render(
      <ChatAttachments
        files={[
          {
            id: "image",
            name: "photo.png",
            size: 100,
            mimeType: "image/png",
            kind: "image",
            url: "/api/chat/attachments/image",
          },
          {
            id: "video",
            name: "clip.mp4",
            size: 100,
            mimeType: "video/mp4",
            kind: "video",
            url: "/api/chat/attachments/video",
          },
        ]}
      />
    );
    expect(screen.getByLabelText("clip.mp4").hasAttribute("controls")).toBe(true);
    expect(screen.getByRole("link", { name: /photo.png/ }).getAttribute("href")).toBe(
      "/api/chat/attachments/image?download=1"
    );
    fireEvent.error(screen.getByRole("img", { name: "photo.png" }));
    expect(screen.getByText(/Preview unavailable/)).toBeDefined();
  });
});
