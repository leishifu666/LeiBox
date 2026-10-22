"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const COLORS = { light: "#ffffff", dark: "#0a0a0a" } as const;

export function ThemeFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const theme = resolvedTheme === "dark" ? "dark" : "light";

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = COLORS[theme];
  }, [resolvedTheme]);

  return null;
}
