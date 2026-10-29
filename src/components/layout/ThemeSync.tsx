"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("prax-theme", theme);
  } catch {
    /* A blocked storage preference does not block the page. */
  }
}
export function ThemeSync() {
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    try {
      const saved = localStorage.getItem("prax-theme");
      if (saved === "dark" || saved === "light") applyTheme(saved);
    } catch {}
    const sync = () => {
      void fetch("/api/workspace", { cache: "no-store" })
        .then(async (response) => (response.ok ? response.json() : null))
        .then((result) => {
          if (active && (result?.settings?.theme === "light" || result?.settings?.theme === "dark"))
            applyTheme(result.settings.theme);
        })
        .catch(() => {});
    };
    sync();
    const update = (event: Event) => {
      const theme = (event as CustomEvent<{ settings?: { theme?: string } }>).detail?.settings
        ?.theme;
      if (theme === "dark" || theme === "light") applyTheme(theme);
      else sync();
    };
    window.addEventListener("prax:workspace", update);
    return () => {
      active = false;
      window.removeEventListener("prax:workspace", update);
    };
  }, [pathname]);
  return null;
}
