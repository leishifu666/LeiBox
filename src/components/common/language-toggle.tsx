"use client";

import { useLanguage } from "@/components/common/language-provider";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const label = locale === "zh" ? "Switch to English" : "切换为中文";
  return (
    <button type="button" data-language-toggle aria-label={label} title={label} lang={locale === "zh" ? "en" : "zh-CN"}
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full border border-border/70 px-2 text-[12px] font-medium text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 motion-reduce:transition-none">
      {locale === "zh" ? "EN" : "中"}
    </button>
  );
}
