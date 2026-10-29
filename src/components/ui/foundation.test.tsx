// @vitest-environment jsdom
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import {
  colors,
  radii,
  shadows,
  spacing,
  controls,
  icons,
  focus,
  typeScale,
} from "@/lib/design-tokens";
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  Toggle,
  Button,
  Avatar,
  Tabs,
  SegmentedControl,
  Modal,
  FileUpload,
  validateScreenshot,
  Progress,
  StatusBadge,
  statuses,
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableEmptyState,
  Notice,
  Toast,
} from "./index";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("foundation contracts", () => {
  it("resolves every exported CSS token against the canonical theme", () => {
    const css = readFileSync("src/app/tokens.css", "utf8");
    const visit = (value: unknown) => {
      if (typeof value === "object" && value) Object.values(value).forEach(visit);
      else if (typeof value === "string")
        for (const match of value.matchAll(/var\((--[\w-]+)/g))
          expect(css).toContain(`${match[1]}:`);
    };
    [colors, radii, shadows, spacing, controls, icons, focus, typeScale].forEach(visit);
  });
  it("keeps required help and errors linked without duplicate field IDs", () => {
    render(
      <>
        <Input
          label="Proof"
          required
          helperText="HTTPS only"
          error="Link missing"
          aria-describedby="external"
        />
        <Input label="Proof" />
      </>
    );
    const [first, second] = screen.getAllByLabelText(/Proof/);
    expect(first.id).not.toBe(second.id);
    expect((first as HTMLInputElement).required).toBe(true);
    expect(first.getAttribute("aria-describedby")?.split(" ")).toEqual([
      "external",
      screen.getByText("HTTPS only").id,
      screen.getByText("Link missing").id,
    ]);
  });
  it("supports native textarea, select, checkbox and toggle state", () => {
    render(
      <>
        <Textarea label="Notes" />
        <Select label="Category">
          <option>A</option>
          <option>B</option>
        </Select>
        <Checkbox label="Proof checked" />
        <Toggle label="Notifications" />
      </>
    );
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Measured runtime" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "B" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("switch"));
    expect((screen.getByLabelText("Notes") as HTMLTextAreaElement).value).toBe("Measured runtime");
    expect((screen.getByLabelText("Category") as HTMLSelectElement).value).toBe("B");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(true);
  });
  it("loading and disabled buttons never invoke actions and default to type button", () => {
    const action = vi.fn();
    render(
      <>
        <Button isLoading onClick={action}>
          Saving
        </Button>
        <Button disabled onClick={action}>
          Disabled
        </Button>
        <Button>Plain</Button>
      </>
    );
    fireEvent.click(screen.getByText("Saving"));
    fireEvent.click(screen.getByText("Disabled"));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Plain" }).getAttribute("type")).toBe("button");
  });
  it("falls back to initials when the image fails", () => {
    const { container } = render(<Avatar name="  Arjun   Varma " src="/missing.png" />);
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByText("AV")).toBeDefined();
  });
  it.each(["pills", "underline", "segmented"] as const)(
    "connects %s tabs to panels, skips disabled tabs and wraps focus",
    (variant) => {
      function Example() {
        const [active, setActive] = useState("a");
        return (
          <Tabs
            variant={variant}
            activeTab={active}
            onChange={setActive}
            tabs={[
              { id: "a", label: "First", content: "First panel" },
              { id: "b", label: "Disabled", disabled: true },
              { id: "c", label: "Last", content: "Last panel" },
            ]}
          />
        );
      }
      render(<Example />);
      const first = screen.getByRole("tab", { name: "First" });
      fireEvent.keyDown(first, { key: "ArrowRight" });
      const last = screen.getByRole("tab", { name: "Last" });
      expect(document.activeElement).toBe(last);
      expect(last.getAttribute("aria-selected")).toBe("true");
      expect(document.getElementById(last.getAttribute("aria-controls")!)?.textContent).toBe(
        "Last panel"
      );
      fireEvent.keyDown(last, { key: "ArrowRight" });
      expect(document.activeElement).toBe(first);
      fireEvent.keyDown(first, { key: "End" });
      expect(document.activeElement).toBe(last);
      fireEvent.keyDown(last, { key: "Home" });
      expect(document.activeElement).toBe(first);
    }
  );
  it("segmented choices update a controlled radio group", () => {
    function Example() {
      const [value, setValue] = useState("weekly");
      return (
        <SegmentedControl
          label="Period"
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "all", label: "All-time" },
          ]}
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Example />);
    fireEvent.click(screen.getByLabelText("All-time"));
    expect((screen.getByLabelText("All-time") as HTMLInputElement).checked).toBe(true);
  });
  it("expresses every status in text", () => {
    render(
      <>
        {Object.keys(statuses).map((status) => (
          <StatusBadge key={status} status={status as keyof typeof statuses} />
        ))}
      </>
    );
    Object.values(statuses).forEach(([label]) => expect(screen.getByText(label)).toBeDefined());
  });
  it("clamps invalid and overflowing progress values", () => {
    const { rerender } = render(<Progress label="Goal" value={130} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
    rerender(<Progress label="Goal" value={NaN} max={0} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });
  it("renders semantic table headers and an empty row spanning columns", () => {
    render(
      <Table aria-label="Submissions">
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          <TableEmptyState colSpan={2} />
        </tbody>
      </Table>
    );
    expect(screen.getByRole("columnheader", { name: "Task" }).getAttribute("scope")).toBe("col");
    expect(screen.getByRole("cell").getAttribute("colspan")).toBe("2");
  });
  it("announces errors and supports toast dismissal", () => {
    const dismiss = vi.fn();
    render(
      <>
        <Notice tone="danger">Save failed</Notice>
        <Toast message="Saved" onDismiss={dismiss} />
      </>
    );
    expect(screen.getByRole("alert").textContent).toContain("Save failed");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(dismiss).toHaveBeenCalledOnce();
  });
});

describe("dialog keyboard lifecycle", () => {
  it("traps focus both ways, dismisses with Escape, restores focus and scroll state", () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Review"
            footer={<Button>Confirm</Button>}
          >
            <Input label="Note" />
          </Modal>
        </>
      );
    }
    document.body.style.overflow = "scroll";
    render(<Example />);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();
    fireEvent.click(opener);
    const close = screen.getByRole("button", { name: "Close dialog" });
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
    fireEvent.keyDown(confirm, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe("scroll");
    document.body.style.overflow = "";
  });
  it("uses unique accessible title IDs across dialog instances", () => {
    const { rerender } = render(
      <Modal isOpen onClose={() => {}} title="One">
        A
      </Modal>
    );
    const id = screen.getByRole("dialog").getAttribute("aria-labelledby");
    rerender(
      <Modal key="another" isOpen onClose={() => {}} title="Two">
        B
      </Modal>
    );
    expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).not.toBe(id);
  });
});

describe("local screenshot upload", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() })
    );
  });
  afterEach(() => vi.unstubAllGlobals());
  const png = () => new File(["image"], "proof.png", { type: "image/png" });
  it("validates type, size, empty files and multiple selection", () => {
    expect(validateScreenshot([new File(["x"], "x.svg", { type: "image/svg+xml" })])).toContain(
      "PNG"
    );
    expect(validateScreenshot([png()], 2)).toContain("smaller");
    expect(validateScreenshot([new File([], "empty.png", { type: "image/png" })])).toContain(
      "empty"
    );
    expect(validateScreenshot([png(), png()])).toContain("one");
  });
  it("previews selection, notifies consumers, removes and releases its object URL", () => {
    const change = vi.fn();
    render(<FileUpload onFileChange={change} />);
    const file = png();
    fireEvent.change(screen.getByLabelText("Screenshot (optional)"), { target: { files: [file] } });
    expect(screen.getByRole("img").getAttribute("alt")).toContain("proof.png");
    expect(change).toHaveBeenCalledWith(file);
    fireEvent.click(screen.getByRole("button", { name: "Remove screenshot" }));
    expect(screen.queryByRole("img")).toBeNull();
    expect(change).toHaveBeenLastCalledWith(null);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
  it("accepts a dropped image and rejects a later invalid file without losing the preview", () => {
    const { container } = render(<FileUpload />);
    const zone = container.querySelector('[class*="border-dashed"]')!;
    fireEvent.drop(zone, { dataTransfer: { files: [png()] } });
    expect(screen.getByRole("img")).toBeDefined();
    fireEvent.drop(zone, {
      dataTransfer: { files: [new File(["x"], "x.txt", { type: "text/plain" })] },
    });
    expect(screen.getByRole("alert").textContent).toContain("PNG");
    expect(screen.getByRole("img")).toBeDefined();
  });
  it("ignores drops while disabled", () => {
    const change = vi.fn();
    const { container } = render(<FileUpload disabled onFileChange={change} />);
    fireEvent.drop(container.querySelector('[class*="border-dashed"]')!, {
      dataTransfer: { files: [png()] },
    });
    expect(change).not.toHaveBeenCalled();
    expect(screen.queryByRole("img")).toBeNull();
  });
  it("presents corrupt-image failures and releases the preview", () => {
    const change = vi.fn();
    render(<FileUpload onFileChange={change} />);
    fireEvent.change(screen.getByLabelText("Screenshot (optional)"), {
      target: { files: [png()] },
    });
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("alert").textContent).toContain("could not be read");
    expect(change).toHaveBeenLastCalledWith(null);
  });
});
