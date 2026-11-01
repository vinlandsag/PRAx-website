"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import type { SpaceData, SpaceMutation } from "./types";

const SPACE_PATH = "/api/space";
const fallback = (e: unknown, message: string) => (e instanceof Error ? e.message : message);

/**
 * Loads and changes the signed-in member's Personal Space (to-dos, notes, goals).
 * Calls GET/PATCH /api/space, which is implemented in a later stage; until then requests fail
 * and the error is reported, never replaced with simulated data.
 */
export function useSpace() {
  const [data, setData] = useState<SpaceData | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setData(await apiRequest<SpaceData>(SPACE_PATH));
      setError("");
    } catch (e) {
      setData(null);
      setError(fallback(e, "Could not load your personal space."));
    }
  }, []);
  useEffect(() => {
    let active = true;
    apiRequest<SpaceData>(SPACE_PATH)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((e) => {
        if (active) setError(fallback(e, "Could not load your personal space."));
      });
    return () => {
      active = false;
    };
  }, []);
  const mutate = async (mutation: SpaceMutation) => {
    setSaving(true);
    setError("");
    try {
      setData(
        await apiRequest<SpaceData>(SPACE_PATH, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mutation),
        })
      );
      return true;
    } catch (e) {
      setError(fallback(e, "Could not save changes."));
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { data, error, saving, mutate, refresh };
}
