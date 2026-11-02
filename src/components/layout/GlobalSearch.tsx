"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, EmptyState, Icon, Input, Modal } from "@/components/ui";
import { searchWorkspace } from "@/lib/workspace/filter";
import { useResource } from "@/lib/api/use-resource";
import type { TaskFeed } from "@/lib/api/contracts";
import type { SpaceData } from "@/lib/workspace/types";
import { useWorkspace } from "@/lib/workspace/use-workspace";

export function GlobalSearch() {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const { data, error } = useWorkspace();
  const taskFeed = useResource<TaskFeed>(open ? "/api/tasks" : null);
  // Private plans are fetched only while search is open, never on every page.
  const space = useResource<SpaceData>(open ? "/api/space" : null);
  const results = searchWorkspace(query, space.data, taskFeed.data?.tasks, data?.user.role);
  useEffect(() => {
    const hotkey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", hotkey);
    return () => document.removeEventListener("keydown", hotkey);
  }, []);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  return (
    <>
      <Button
        variant="secondary"
        aria-label="Search platform"
        onClick={() => setOpen(true)}
        className="gap-2 md:min-w-48"
      >
        <Icon name="search" />
        <span className="hidden text-text-muted md:inline">Search anything…</span>
        <kbd className="ml-4 hidden text-[10px] text-text-faint lg:inline">Ctrl/⌘ K</kbd>
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Search PRAX"
        subtitle="Find pages, tasks, and your own plans."
        maxWidth="lg"
      >
        <Input
          ref={input}
          label="Search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={true}
          aria-controls="platform-search-results"
          aria-activedescendant={results[selected] ? `search-${selected}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((i) => (results.length ? (i + 1) % results.length : 0));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
            }
            if (e.key === "Enter" && results[selected]) {
              e.preventDefault();
              setOpen(false);
              router.push(results[selected].href);
            }
          }}
        />
        <div
          id="platform-search-results"
          role="listbox"
          aria-label="Search results"
          className="mt-3 max-h-80 overflow-y-auto"
        >
          {results.map((result, i) => (
            <Link
              onClick={() => setOpen(false)}
              key={result.id}
              id={`search-${i}`}
              role="option"
              aria-selected={i === selected}
              href={result.href}
              className={`mb-1 block rounded-md p-3 ${i === selected ? "bg-lavender text-lavender-text" : "hover:bg-surface-hover"}`}
            >
              <span className="block text-[10px] text-text-muted">{result.section}</span>
              <span className="text-xs font-semibold">{result.title}</span>
            </Link>
          ))}
        </div>
        {query.trim() && !results.length && (
          <EmptyState
            title="No results"
            description="Try a task title, category, page or one of your notes."
          />
        )}
        {!query.trim() && (
          <p className="mt-3 text-xs text-text-muted">
            Type to search. Use arrow keys and Enter to open a result.
          </p>
        )}
        {(error || space.error) && (
          <p className="mt-2 text-xs text-text-muted">
            Some content could not load. You can still search platform pages.
          </p>
        )}
      </Modal>
    </>
  );
}
