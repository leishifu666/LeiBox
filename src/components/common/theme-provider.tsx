"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

import { ThemeHotkey } from "@/components/common/theme-hotkey";

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  );
}
