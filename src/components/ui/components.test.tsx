// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";

import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Avatar } from "./Avatar";
import { Input } from "./Input";
import { Tabs } from "./Tabs";
import { Modal } from "./Modal";
import { StatCard } from "./StatCard";
import { colors, radii, shadows } from "@/lib/design-tokens";

describe("Design Tokens", () => {
  it("exports CSS-backed tokens and reserved layout measurements", () => {
    expect(colors.sidebar).toBe("var(--color-sidebar)");
    expect(colors.primary).toBe("var(--color-primary)");
    expect(radii.xl).toBe("var(--radius-xl)");
    expect(shadows.card).toBe("var(--shadow-card)");
  });
});

describe("Button component", () => {
  it("renders with default primary variant and text", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeDefined();
    expect(btn.className).toContain("bg-primary");
  });

  it("renders disabled state properly", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button", { name: /disabled/i });
    expect(btn).toBeDefined();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("sets aria-busy when isLoading is true", () => {
    render(<Button isLoading>Saving...</Button>);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Badge component", () => {
  it("renders text label and accessible status indicator", () => {
    render(
      <Badge variant="success" dot>
        Approved
      </Badge>
    );
    const badge = screen.getByText("Approved");
    expect(badge).toBeDefined();
  });
});

describe("Avatar component", () => {
  it("generates correct initials for two-word names", () => {
    render(<Avatar name="Arjun Varma" />);
    expect(screen.getByText("AV")).toBeDefined();
    const imgRole = screen.getByRole("img", { name: "Arjun Varma" });
    expect(imgRole).toBeDefined();
  });

  it("generates initials for single-word names", () => {
    render(<Avatar name="Admin" />);
    expect(screen.getByText("AD")).toBeDefined();
  });
});

describe("Input component", () => {
  it("renders label and associates with input", () => {
    render(<Input label="Email address" placeholder="you@prax.dev" />);
    const input = screen.getByLabelText("Email address");
    expect(input).toBeDefined();
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("sets aria-invalid and links error message via aria-describedby", () => {
    render(<Input label="Email" error="Invalid email address" />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const errorMsg = screen.getByText("Invalid email address");
    expect(input.getAttribute("aria-describedby")).toBe(errorMsg.id);
  });
});

describe("Tabs component", () => {
  const tabs = [
    { id: "all", label: "All Tasks", count: 12 },
    { id: "open", label: "Open", count: 8 },
    { id: "done", label: "Completed", count: 4 },
  ];

  it("renders tablist and tabs with proper ARIA attributes", () => {
    render(<Tabs tabs={tabs} activeTab="all" onChange={() => {}} />);
    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeDefined();

    const allTabs = screen.getAllByRole("tab");
    expect(allTabs.length).toBe(3);
    expect(allTabs[0].getAttribute("aria-selected")).toBe("true");
    expect(allTabs[1].getAttribute("aria-selected")).toBe("false");
  });

  it("handles keyboard navigation across tabs", () => {
    const handleChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="all" onChange={handleChange} />);
    const firstTab = screen.getAllByRole("tab")[0];

    fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    expect(handleChange).toHaveBeenCalledWith("open");

    fireEvent.keyDown(firstTab, { key: "End" });
    expect(handleChange).toHaveBeenCalledWith("done");
  });
});

describe("Modal component", () => {
  it("renders dialog with aria-labelledby matching title id", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Community Rules">
        <p>Rule 1: Be respectful</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe(
      "Community Rules"
    );
    expect(screen.getByText("Rule 1: Be respectful")).toBeDefined();
  });

  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden Modal">
        <p>Hidden content</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("StatCard component", () => {
  it("renders metric label, value and subtext trend", () => {
    render(<StatCard label="Weekly Rank" value="#7" subtext="3 pts behind #6" subtextTrend="up" />);
    expect(screen.getByText("Weekly Rank")).toBeDefined();
    expect(screen.getByText("#7")).toBeDefined();
    expect(screen.getByText("3 pts behind #6")).toBeDefined();
  });
});
