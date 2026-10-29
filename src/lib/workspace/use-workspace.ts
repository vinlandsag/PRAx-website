"use client";
import { useCallback, useEffect, useState } from "react";
import type { WorkspaceData, WorkspaceMutation } from "./types";

async function readWorkspace(): Promise<WorkspaceData> {
  const response = await fetch("/api/workspace", { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Could not load workspace.");
  return result;
}

export function useWorkspace() {
  const [data, setData] = useState<WorkspaceData | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Could not load workspace.");
      setData(result);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load workspace.");
    }
  }, []);
  useEffect(() => {
    let active = true;
    readWorkspace()
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load workspace.");
      });
    const update = (event: Event) => {
      const result = (event as CustomEvent<WorkspaceData>).detail;
      if (result?.user) {
        setData(result);
        setError("");
      } else void refresh();
    };
    window.addEventListener("prax:workspace", update);
    return () => {
      active = false;
      window.removeEventListener("prax:workspace", update);
    };
  }, [refresh]);
  const mutate = async (mutation: WorkspaceMutation) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Could not save changes.");
      setData(result);
      window.dispatchEvent(new CustomEvent("prax:workspace", { detail: result }));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { data, error, saving, mutate, refresh };
}
