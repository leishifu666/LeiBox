"use client";

import { useEffect } from "react";

import { useThemeToggle } from "@/hooks/use-theme-toggle";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function ThemeHotkey() {
  const { toggleTheme } = useThemeToggle();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "d" && event.key !== "D") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
        return;
      if (isEditableTarget(event.target)) return;
      toggleTheme();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleTheme]);

  return null;
}
