"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
    } else {
      setTheme(next);
    }
  }, [resolvedTheme, setTheme]);

  return { resolvedTheme, toggleTheme };
}
