"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/components/common/language-provider";
import { loadDocAsset } from "@/lib/load-doc-asset";
import type { CodeContent } from "@/lib/doc-asset-types";
import { CopyButton } from "./copy-button";

export function DeferredCode({ url, fileName }: { url: string; fileName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [result, setResult] = useState<{ url: string; data?: CodeContent; failed?: boolean }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    loadDocAsset<CodeContent>(url).then(data => {
      if (!cancelled) setResult({ url, data });
    }).catch(() => { if (!cancelled) setResult({ url, failed: true }); });
    return () => { cancelled = true; };
  }, [url, near, attempt]);
  const current = result?.url === url ? result : undefined;
  return <div ref={ref}>
    {fileName ? <div className="flex items-center justify-between border-b border-border/40 py-1 pr-1.5 pl-4"><span className="text-[12px] text-muted-foreground">{fileName}</span><CopyButton sourceUrl={url} /></div> : null}
    {current?.data ? current.data.html
      ? <div className="docs-code max-h-[480px] overflow-auto text-[13px] leading-6" dangerouslySetInnerHTML={{ __html: current.data.html }} />
      : <pre translate="no" className="max-h-[480px] overflow-auto p-4 font-mono text-[13px] leading-6"><code>{current.data.source}</code></pre>
      : <div className="min-h-24 p-4 text-[13px] text-muted-foreground" aria-live="polite">
        <T>{current?.failed ? "Code could not be loaded." : "Loading code…"}</T>
        {current?.failed ? <button className="ml-3 rounded underline underline-offset-4 focus-visible:outline-2" onClick={() => setAttempt(value => value + 1)}><T>Retry</T></button> : null}
      </div>}
  </div>;
}
