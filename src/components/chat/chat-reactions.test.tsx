// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ChatReactions } from "./ChatReactions";
import { REACTION_EMOJIS } from "@/lib/workspace/types";

afterEach(cleanup);

describe("ChatReactions", () => {
  it("shows only reactions that have been used, with counts and your own state", () => {
    render(
      <ChatReactions
        author="Ada"
        disabled={false}
        onToggle={vi.fn()}
        reactions={[
          { emoji: "🎉", count: 2, reacted: true },
          { emoji: "👍", count: 1, reacted: false },
          { emoji: "👀", count: 0, reacted: false },
        ]}
      />
    );
    const mine = screen.getByRole("button", { name: "🎉 2 reactions, including yours" });
    expect(mine.getAttribute("aria-pressed")).toBe("true");
    const other = screen.getByRole("button", { name: "👍 1 reaction" });
    expect(other.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("button", { name: /👀/ })).toBeNull();
  });

  it("toggles an existing reaction", () => {
    const onToggle = vi.fn();
    render(
      <ChatReactions
        author="Ada"
        disabled={false}
        onToggle={onToggle}
        reactions={[{ emoji: "🎉", count: 1, reacted: true }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /🎉 1 reaction/ }));
    expect(onToggle).toHaveBeenCalledWith("🎉");
  });

  it("offers the fixed six-emoji palette and closes it after a choice", () => {
    const onToggle = vi.fn();
    render(<ChatReactions author="Ada" disabled={false} onToggle={onToggle} reactions={[]} />);
    const add = screen.getByRole("button", { name: "Add reaction to message by Ada" });
    expect(add.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(add);
    expect(add.getAttribute("aria-expanded")).toBe("true");
    const palette = screen.getByRole("group", { name: "Choose a reaction" });
    expect(within(palette).getAllByRole("button")).toHaveLength(REACTION_EMOJIS.length);
    fireEvent.click(within(palette).getByRole("button", { name: "React with ❤️" }));
    expect(onToggle).toHaveBeenCalledWith("❤️");
    expect(screen.queryByRole("group", { name: "Choose a reaction" })).toBeNull();
  });

  it("disables every control while a reaction is being saved", () => {
    render(
      <ChatReactions
        author="Ada"
        disabled
        onToggle={vi.fn()}
        reactions={[{ emoji: "👍", count: 1, reacted: false }]}
      />
    );
    for (const button of screen.getAllByRole("button"))
      expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("gives every control at least a 44px target", () => {
    render(
      <ChatReactions
        author="Ada"
        disabled={false}
        onToggle={vi.fn()}
        reactions={[{ emoji: "👍", count: 1, reacted: false }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Add reaction to message by Ada" }));
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("min-h-11");
      expect(button.className).toContain("min-w-11");
    }
  });
});
