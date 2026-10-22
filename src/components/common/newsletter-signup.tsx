"use client";

import { T } from "@/components/common/language-provider";


import { useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import { useSubscribed } from "@/components/common/use-subscribed";
import { turnstileEnabled, useTurnstile } from "@/hooks/use-turnstile";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export const NEWSLETTER_TITLE = "See how Canvas UI evolves";
export const NEWSLETTER_DESCRIPTION =
  "Sign up to our newsletter for updates and exclusive goodies. No spam. No noise.";

export function NewsletterSignup({
  className,
  variant = "default",
  layout = "row",
  showHeader = true,
  label,
  title = NEWSLETTER_TITLE,
  description = NEWSLETTER_DESCRIPTION,
  action,
  onSuccess,
}: {
  className?: string;
  variant?: "default" | "onDark";
  layout?: "row" | "stack";
  showHeader?: boolean;
  label?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  onSuccess?: () => void;
}) {
  const inputId = useId();
  const statusId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [, setSubscribed] = useSubscribed();
  const {
    containerRef: turnstileRef,
    getToken: getTurnstileToken,
    reset: resetTurnstile,
  } = useTurnstile();
  const [message, setMessage] = useState("");

  const onDark = variant === "onDark";
  const isLoading = status === "loading";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || status === "success") return;

    const data = new FormData(event.currentTarget);

    const note = String(data.get("subscribe_note") ?? "");

    const email = String(data.get("email") ?? "").trim();
    if (!email) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const token = await getTurnstileToken();

    if (turnstileEnabled && !token) {
      resetTurnstile();
      setStatus("error");
      setMessage("Could not verify your browser. Please try again.");
      return;
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, token, note }),
      });

      const payload = await response
        .json()
        .catch(() => ({}) as { error?: string });

      resetTurnstile();

      if (!response.ok) {
        setStatus("error");
        setMessage(
          typeof payload.error === "string" ? payload.error : GENERIC_ERROR,
        );
        return;
      }

      setStatus("success");
      setMessage("You're on the list. Talk soon!");
      formRef.current?.reset();
      onSuccess?.();
      window.setTimeout(() => setSubscribed("yes"), 4000);
    } catch {
      resetTurnstile();
      setStatus("error");
      setMessage(GENERIC_ERROR);
    }
  }

  return (
    <div className={cn("w-full", action && "relative", className)}>
      {action ? (
        <div className="absolute -top-1 -right-1 z-10">{action}</div>
      ) : null}
      {showHeader ? (
        <>
          <h2
            className={cn(
              "text-lg font-medium tracking-tight text-balance",
              onDark ? "text-white" : "text-foreground",
              action && "pr-7",
            )}
          >
            <T>{title}</T>
          </h2>
          <p
            className={cn(
              "mt-1.5 text-[13px] leading-6",
              onDark ? "text-white/60" : "text-muted-foreground",
            )}
          >
            <T>{description}</T>
          </p>
        </>
      ) : null}

      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-[13px] font-medium",
            onDark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          <T>{label}</T>
        </label>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className={cn(
          "flex flex-col gap-2",
          showHeader ? "mt-4" : label && "mt-2.5",
          layout === "row" && "sm:flex-row",
        )}
      >
        {label ? null : (
          <label htmlFor={inputId} className="sr-only"><T>
            Email address
          </T></label>
        )}

        <div aria-hidden className="hidden">
          <label htmlFor={`${inputId}-note`}><T>Leave this field empty</T></label>
          <input
            id={`${inputId}-note`}
            name="subscribe_note"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <input
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={isLoading || status === "success"}
          placeholder="you@example.com"
          aria-describedby={message ? statusId : undefined}
          aria-invalid={status === "error" || undefined}
          onChange={() => {
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          className={cn(
            "h-10 w-full min-w-0 shrink-0 rounded-lg border px-3.5 text-[15px] outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
            layout === "row" && "sm:flex-1",
            onDark
              ? "border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
              : "border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            status === "error" &&
              !onDark &&
              "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            status === "error" && onDark && "border-red-400/60",
          )}
        />

        <button
          type="submit"
          disabled={isLoading || status === "success"}
          className={cn(
            "group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-medium tracking-[-0.01em] transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
            onDark
              ? "bg-white text-black hover:opacity-85"
              : "bg-primary text-primary-foreground hover:opacity-85",
          )}
        >
          {isLoading ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" /><T>
              Signing up
            </T></>
          ) : status === "success" ? (
            <>
              <Check aria-hidden strokeWidth={2.25} className="size-4" /><T>
              Signed up
            </T></>
          ) : (
            <><T>
              Sign up
              </T><ArrowRight
                aria-hidden
                strokeWidth={2.25}
                className="-mr-1 size-[15px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </>
          )}
        </button>
      </form>

      <div
        ref={turnstileRef}
        className={cn(turnstileEnabled ? "turnstile-slot" : "hidden")}
      />

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={cn(
          !message && "sr-only",
          message && "mt-2 text-[13px] leading-5",
          message &&
            (status === "error"
              ? onDark
                ? "text-red-300"
                : "text-destructive"
              : onDark
                ? "text-white/60"
                : "text-muted-foreground"),
        )}
      >
        <T>{message}</T>
      </p>

      <p
        className={cn(
          "mt-2.5 text-center text-xs leading-5",
          onDark ? "text-white/50" : "text-muted-foreground",
        )}
      >
        <Link
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "underline underline-offset-4 transition-colors duration-150",
            onDark
              ? "decoration-white/25 hover:decoration-white/60"
              : "decoration-border hover:decoration-foreground",
          )}
        ><T>
          Privacy policy
        </T></Link>
      </p>
    </div>
  );
}
