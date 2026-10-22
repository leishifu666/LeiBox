"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { useThemeToggle } from "@/hooks/use-theme-toggle";
import { useLanguage } from "@/components/common/language-provider";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { t } = useLanguage();
  const { resolvedTheme, toggleTheme } = useThemeToggle();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={t(isDark ? "Switch to light mode" : "Switch to dark mode")}
      onClick={toggleTheme}
      className="grid size-8 place-items-center rounded-full border border-border/70 text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 motion-reduce:transition-none sm:border-transparent"
    >
      <Sun
        aria-hidden
        className="col-start-1 row-start-1 size-[17px] opacity-100 blur-none transition-[opacity,filter] duration-300 ease-out dark:opacity-0 dark:blur-[3px] motion-reduce:transition-none"
      />
      <Moon
        aria-hidden
        className="col-start-1 row-start-1 size-[17px] opacity-0 blur-[3px] transition-[opacity,filter] duration-300 ease-out dark:opacity-100 dark:blur-none motion-reduce:transition-none"
      />
    </button>
  );
}
