"use client";

import { useLanguage } from "@/components/common/language-provider";

import { useState, useSyncExternalStore } from "react";
import { Mail } from "lucide-react";

import { useSubscribed } from "@/components/common/use-subscribed";
import { usePreference } from "@/hooks/use-preference";
import { cn } from "@/lib/utils";

const STATES = ["open", "dismissed", "reopened", "hidden"] as const;

const emptySubscribe = () => () => {};

export function NewsletterNavButton({
  mode = "panel",
  className,
}: {
  mode?: "panel" | "scroll";
  className?: string;
}) {
  const { t } = useLanguage();
  const [state, setState] = usePreference<(typeof STATES)[number]>(
    "newsletter",
    "open",
    STATES,
  );

  const [subscribed] = useSubscribed();
  const [exiting, setExiting] = useState(false);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const scrollToSignup = () => {
    const target = document.getElementById("newsletter");
    if (!target) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });

    window.setTimeout(
      () => {
        target.querySelector<HTMLInputElement>("input[name=email]")?.focus({
          preventScroll: true,
        });
      },
      reduce ? 0 : 500,
    );
  };

  const handleClick = () => {
    if (mode === "scroll") {
      scrollToSignup();
      return;
    }

    setState("reopened");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setExiting(true);
    window.setTimeout(() => setExiting(false), 260);
  };

  const visible =
    mode === "scroll" || state === "dismissed" || state === "hidden";
  const announcing = mode === "panel" && state === "dismissed" && !exiting;

  if (!mounted || subscribed === "yes") return null;
  if (!visible && !exiting) return null;

  return (
    <button
      type="button"
      aria-label={
        t(mode === "scroll" ? "Go to newsletter signup" : "Show newsletter signup")
      }
      onClick={handleClick}
      onAnimationEnd={(event) => {
        if (event.animationName === "newsletter-nav-flash") setState("hidden");
      }}
      className={cn(
        exiting && "newsletter-nav-exit pointer-events-none",
        announcing && "newsletter-nav-enter",
        "relative size-8 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 motion-reduce:transition-none sm:border-transparent",
        className ?? "hidden xl:grid",
      )}
    >
      {announcing ? (
        <span
          aria-hidden
          className="newsletter-nav-pulse pointer-events-none absolute inset-0 rounded-full"
        />
      ) : null}
      <Mail
        aria-hidden
        className={cn(
          "size-[17px] shrink-0",
          announcing && "newsletter-nav-flash",
        )}
      />
    </button>
  );
}
