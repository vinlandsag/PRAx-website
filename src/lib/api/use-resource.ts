"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "./client";

export function useResource<T>(path: string | null) {
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    error: string;
    loading: boolean;
  }>({ path, data: null, error: "", loading: !!path });
  const generation = useRef(0);
  const load = useCallback(
    async (version: number) => {
      if (!path) return;
      try {
        const data = await apiRequest<T>(path);
        if (version === generation.current) setState({ path, data, error: "", loading: false });
      } catch (error) {
        if (version === generation.current)
          setState({
            path,
            data: null,
            error: error instanceof Error ? error.message : "Could not load this content.",
            loading: false,
          });
      }
    },
    [path]
  );
  const refresh = useCallback(async () => {
    if (!path) return;
    const version = ++generation.current;
    setState({ path, data: null, error: "", loading: true });
    await load(version);
  }, [path, load]);
  useEffect(() => {
    const counter = generation;
    const version = ++counter.current;
    void load(version);
    return () => {
      counter.current++;
    };
  }, [load]);
  const current = state.path === path ? state : { data: null, error: "", loading: !!path };
  return { ...current, refresh };
}
