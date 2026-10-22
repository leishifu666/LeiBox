import { commonTranslations } from "./common";
import { landingTranslations } from "./landing";
import { docsTranslations } from "./docs";
import { effectsTranslations } from "./effects";

export type Locale = "zh" | "en";
export const LOCALE_STORAGE_KEY = "canvasui:locale";
const rawTranslations: Readonly<Record<string, string>> = {
  ...commonTranslations,
  ...landingTranslations,
  ...docsTranslations,
  ...effectsTranslations,
};
const entities: Record<string, string> = { apos: "'", quot: '"', amp: "&", lt: "<", gt: ">", nbsp: " ", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", middot: "·", larr: "←", rarr: "→", ndash: "–", mdash: "—" };
export function normalizeCopy(text: string): string {
  return text.replace(/&([a-z]+);/gi, (full, name: string) => entities[name] ?? full).trim().replace(/\s+/g, " ");
}
export const translations: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(rawTranslations).map(([key, value]) => [normalizeCopy(key), value]));

/** Translate presentation copy only. Callers keep code, URLs and data keys intact. */
export function translateText(text: string, locale: Locale): string {
  if (locale === "en" || !text.trim()) return text;
  const normalized = normalizeCopy(text);
  let translated = translations[normalized];
  if (!translated) {
    const empty = normalized.match(/^No results for [“"](.*)[”"]$/);
    if (empty) translated = `没有找到“${empty[1]}”的相关结果`;
    const copyForAi = normalized.match(/^Copy (.+) for AI$/);
    if (copyForAi) translated = `复制${translateText(copyForAi[1], locale)}供 AI 使用`;
    const sharePlayground = normalized.match(/^Share the (.+) playground$/);
    if (sharePlayground) translated = `分享${translateText(sharePlayground[1], locale)}演练场`;
  }
  if (!translated) return text;
  return `${text.match(/^\s*/)?.[0] ?? ""}${translated}${text.match(/\s*$/)?.[0] ?? ""}`;
}
