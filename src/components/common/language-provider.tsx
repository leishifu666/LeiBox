"use client";

import { Children, cloneElement, createContext, isValidElement, useContext, useLayoutEffect, useMemo, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { LOCALE_STORAGE_KEY, translateText, type Locale } from "@/lib/i18n/translate";
import { useLanguageTransition } from "@/hooks/use-language-transition";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string) => string;
};
const LanguageContext = createContext<LanguageContextValue>({
  locale: "zh", setLocale: () => {}, t: (text) => translateText(text, "zh"),
});

const localeListeners = new Set<() => void>();
let transientLocale: Locale | null = null;
const serverLocale = (): Locale => "zh";
function readLocale(): Locale {
  if (transientLocale) return transientLocale;
  try { return localStorage.getItem(LOCALE_STORAGE_KEY) === "en" ? "en" : "zh"; }
  catch { return "zh"; }
}
function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
      transientLocale = null;
      listener();
    }
  };
  window.addEventListener("storage", sync);
  return () => { localeListeners.delete(listener); window.removeEventListener("storage", sync); };
}
function commitLocale(next: Locale) {
  try { localStorage.setItem(LOCALE_STORAGE_KEY, next); transientLocale = null; }
  catch { transientLocale = next; /* Storage is optional; switching still works in memory. */ }
  localeListeners.forEach(listener => listener());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, serverLocale);
  const setLocale = useLanguageTransition(locale, commitLocale);
  useLayoutEffect(() => { document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"; document.documentElement.dataset.locale = locale; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (text: string) => translateText(text, locale) }), [locale, setLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

function translateNode(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === "string") return translateText(node, locale);
  if (!isValidElement(node)) return node;
  // Technical samples must remain copyable byte-for-byte in either language.
  if (node.type === "code" || node.type === "pre" || node.type === "script" || node.type === "style") return node;
  const element = node as ReactElement<{ children?: ReactNode }>;
  if (element.props.children === undefined) return element;
  return cloneElement(element, {}, translateChildren(element.props.children, locale));
}

function translateChildren(children: ReactNode, locale: Locale): ReactNode {
  const nodes = Children.toArray(children);
  if (nodes.every((child) => typeof child === "string" || typeof child === "number")) {
    return translateText(nodes.join(""), locale);
  }
  return Children.map(children, (child) => translateNode(child, locale));
}

/** Context-aware text, rendered without adding wrappers to the measured DOM. */
export function T({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  return <>{translateChildren(children, locale)}</>;
}
