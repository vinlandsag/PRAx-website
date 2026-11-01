"use client";
import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { REACTION_EMOJIS, type ChatReaction, type ReactionEmoji } from "@/lib/workspace/types";

const tap = "min-h-11 min-w-11";

export function ChatReactions({
  author,
  reactions,
  disabled,
  onToggle,
}: {
  author: string;
  reactions: ChatReaction[];
  disabled: boolean;
  onToggle: (emoji: ReactionEmoji) => void;
}) {
  const [picking, setPicking] = useState(false);
  const byEmoji = new Map(reactions.map((reaction) => [reaction.emoji, reaction]));
  const used = REACTION_EMOJIS.filter((emoji) => (byEmoji.get(emoji)?.count ?? 0) > 0);
  const choose = (emoji: ReactionEmoji) => {
    setPicking(false);
    onToggle(emoji);
  };
  return (
    <div role="group" aria-label={`Reactions to message by ${author}`} className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {used.map((emoji) => {
          const { count, reacted } = byEmoji.get(emoji)!;
          return (
            <Button
              key={emoji}
              size="sm"
              variant={reacted ? "lavender" : "secondary"}
              className={tap}
              aria-pressed={reacted}
              aria-label={`${emoji} ${count} ${count === 1 ? "reaction" : "reactions"}${reacted ? ", including yours" : ""}`}
              disabled={disabled}
              onClick={() => onToggle(emoji)}
            >
              <span aria-hidden="true">{emoji}</span>
              <span aria-hidden="true" className="ml-1">
                {count}
              </span>
            </Button>
          );
        })}
        <Button
          size="sm"
          variant="text"
          iconOnly
          className={tap}
          aria-label={`Add reaction to message by ${author}`}
          aria-expanded={picking}
          disabled={disabled}
          onClick={() => setPicking((open) => !open)}
        >
          <Icon name="plus" />
        </Button>
      </div>
      {picking && (
        <div
          role="group"
          aria-label="Choose a reaction"
          className="mt-1.5 inline-flex flex-wrap gap-1 rounded-md border border-border bg-surface p-1"
        >
          {REACTION_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              size="sm"
              variant={byEmoji.get(emoji)?.reacted ? "lavender" : "ghost"}
              className={tap}
              aria-pressed={byEmoji.get(emoji)?.reacted ?? false}
              aria-label={`React with ${emoji}`}
              disabled={disabled}
              onClick={() => choose(emoji)}
            >
              <span aria-hidden="true" className="text-base">
                {emoji}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
