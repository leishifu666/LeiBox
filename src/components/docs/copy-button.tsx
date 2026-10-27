"use client";

import { T as TranslatedText, useLanguage } from "@/components/common/language-provider";


import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { copyText } from "@/lib/copy-text";
import { loadDocAsset } from "@/lib/load-doc-asset";

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
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async () => {
    try {
      await copyText(sourceUrl ? loadDocAsset<{ source: string }>(sourceUrl).then(data => data.source) : text ?? "");
      setCopied(true);
      setFailed(false);
    } catch {
      setCopied(false);
      setFailed(true);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => { setCopied(false); setFailed(false); }, 1600);
  };

  return (
    <button
      type="button"
      aria-label={t(failed ? "Copy failed, try again" : copied ? "Copied" : (label ?? "Copy to clipboard"))}
      aria-live="polite"
      onClick={copy}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 motion-reduce:transition-none",
        className,
      )}
    >
      <span className="grid size-[15px]">
        <Copy
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 size-[15px] transition-[opacity,filter] duration-200 ease-out motion-reduce:transition-none",
            copied ? "opacity-0 blur-[3px]" : "opacity-100 blur-none",
          )}
        />
        <Check
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 size-[15px] transition-[opacity,filter] duration-200 ease-out motion-reduce:transition-none",
            copied ? "opacity-100 blur-none" : "opacity-0 blur-[3px]",
          )}
        />
      </span>
      {label || failed ? <span><TranslatedText>{failed ? "Copy failed, try again" : copied ? "Copied" : label}</TranslatedText></span> : null}
    </button>
  );
}
