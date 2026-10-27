"use client";

import { Mail } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useLanguage } from "@/components/common/language-provider";
import { cn } from "@/lib/utils";

let contactOpen = false;
let contactTrigger: HTMLElement | null = null;
const listeners = new Set<() => void>();

export function setContactOpen(next: boolean, trigger?: HTMLElement) {
  if (next) contactTrigger = trigger ?? null;
  contactOpen = next;
  listeners.forEach((listener) => listener());
}

export function getContactTrigger() {
  return contactTrigger;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useContactOpen() {
  return useSyncExternalStore(subscribe, () => contactOpen, () => false);
}

export function ContactButton({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      aria-label={t("Contact and submissions")}
      title={t("Contact and submissions")}
      aria-haspopup="dialog"
      data-contact-trigger="header"
      onClick={(event) => setContactOpen(true, event.currentTarget)}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 motion-reduce:transition-none sm:border-transparent",
        className,
      )}
    >
      <Mail aria-hidden className="size-[17px]" />
    </button>
  );
}
