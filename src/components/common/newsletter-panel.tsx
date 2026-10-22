"use client";

import { useLanguage } from "@/components/common/language-provider";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

import { NewsletterSignup } from "@/components/common/newsletter-signup";
import { useSubscribed } from "@/components/common/use-subscribed";
import { usePreference } from "@/hooks/use-preference";
import { cn } from "@/lib/utils";

const STATES = ["open", "dismissed", "reopened", "hidden", "shown"] as const;

const subscribeToNothing = () => () => {};

export function NewsletterPanel() {
  const { t } = useLanguage();
  const [state, setState] = usePreference<(typeof STATES)[number]>(
    "newsletter",
    "open",
    STATES,
  );

  const [subscribed] = useSubscribed();

  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const visible =
    state === "open" || state === "reopened" || state === "shown";

  if (!mounted || subscribed === "yes" || !visible) return null;

  return (
    <aside
      aria-label={t("Newsletter")}
      onAnimationEnd={(event) => {
        if (event.animationName.startsWith("newsletter-panel-")) {
          setState("shown");
        }
      }}
      className={cn(
        "fixed right-[calc(1rem+var(--demo-sbw,0px))] top-20 z-40 hidden w-[21rem] rounded-[calc(var(--radius)+1.25rem)] border border-border/60 bg-background/80 p-5 shadow-lg shadow-black/5 backdrop-blur-xl backdrop-saturate-150 origin-top-right will-change-transform xl:block dark:shadow-black/40",
        state === "open" && "newsletter-panel-enter",
        state === "reopened" && "newsletter-panel-reopen",
      )}
    >
      <NewsletterSignup
        layout="stack"
        action={
          <button
            type="button"
            onClick={() => setState("dismissed")}
            aria-label={t("Dismiss")}
            className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        }
        onSuccess={() => {
          window.setTimeout(() => setState("dismissed"), 4000);
        }}
      />
    </aside>
  );
}
