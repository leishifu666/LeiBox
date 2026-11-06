"use client";

import { useLanguage } from "@/components/common/language-provider";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { copyText } from "@/lib/copy-text";
import { loadDocAsset } from "@/lib/load-doc-asset";

const feedbackLabels = {
  idle: "",
  copying: "Copying",
  copied: "Copied",
  failed: "Copy failed, try again",
};

export function CopyButton({
  text,
  sourceUrl,
  label,
  className,
}: {
  text?: string;
  sourceUrl?: string;
  label?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<keyof typeof feedbackLabels>("idle");
  const copyInFlight = useRef(false);

  useEffect(() => {
    if (status !== "copied" && status !== "failed") return;
    const timeout = setTimeout(() => setStatus("idle"), 1600);
    return () => clearTimeout(timeout);
  }, [status]);

  const copy = async () => {
    if (copyInFlight.current) return;
    copyInFlight.current = true;
    setStatus("copying");
    try {
      const content = sourceUrl
        ? loadDocAsset<{ source: string }>(sourceUrl).then(data => data.source)
        : text ?? "";
      await copyText(content);
      setStatus("copied");
    } catch {
      setStatus("failed");
    } finally {
      copyInFlight.current = false;
    }
  };

  const copying = status === "copying";
  const copied = status === "copied";
  const feedback = t(feedbackLabels[status]);
  const idleLabel = t(label ?? "Copy to clipboard");

  return (
    <>
      <button
        type="button"
        aria-label={feedback || idleLabel}
        aria-disabled={copying || undefined}
        onClick={copy}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 aria-disabled:cursor-progress motion-reduce:transition-none",
          className,
        )}
      >
        <span className="grid size-[15px] shrink-0">
          <Copy
            aria-hidden
            className={cn(
              "col-start-1 row-start-1 size-[15px] transition-[opacity,filter] duration-200 ease-out motion-reduce:transition-none",
              copied ? "opacity-0 blur-[3px]" : "opacity-100 blur-none",
              copying && "invisible",
            )}
          />
          <Check
            aria-hidden
            className={cn(
              "col-start-1 row-start-1 size-[15px] transition-[opacity,filter] duration-200 ease-out motion-reduce:transition-none",
              copied ? "opacity-100 blur-none" : "opacity-0 blur-[3px]",
              copying && "invisible",
            )}
          />
          {copying && (
            <LoaderCircle aria-hidden className="col-start-1 row-start-1 size-[15px] motion-safe:animate-spin" />
          )}
        </span>
        {label ? (
          <span className="grid min-w-[4em]">
            <span aria-hidden className="invisible col-start-1 row-start-1">{idleLabel}</span>
            <span className="col-start-1 row-start-1">{feedback || idleLabel}</span>
          </span>
        ) : status === "failed" ? <span>{feedback}</span> : null}
      </button>
      <span role="status" className="sr-only">{feedback}</span>
    </>
  );
}
