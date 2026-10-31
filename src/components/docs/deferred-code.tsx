"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/components/common/language-provider";
import { loadDocAsset } from "@/lib/load-doc-asset";
import type { CodeContent } from "@/lib/doc-asset-types";
import { CopyButton } from "./copy-button";

export function DeferredCode({ url, fileName, prose = false }: { url: string; fileName?: string; prose?: boolean }) {
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
    {current?.data ? prose
      ? <pre translate="no" className="max-h-64 overflow-y-auto p-4 font-sans text-[13px] leading-6 whitespace-pre-wrap">{current.data.source}</pre>
      : current.data.html
      ? <div className="docs-code max-h-[480px] overflow-auto text-[13px] leading-6" dangerouslySetInnerHTML={{ __html: current.data.html }} />
      : <pre translate="no" className="max-h-[480px] overflow-auto p-4 font-mono text-[13px] leading-6"><code>{current.data.source}</code></pre>
      : <div className="min-h-24 p-4 text-[13px] text-muted-foreground" aria-live="polite">
        <T>{current?.failed ? (prose ? "Prompt could not be loaded." : "Code could not be loaded.") : (prose ? "Loading prompt…" : "Loading code…")}</T>
        {current?.failed ? <button className="ml-3 rounded underline underline-offset-4 focus-visible:outline-2" onClick={() => setAttempt(value => value + 1)}><T>Retry</T></button> : null}
      </div>}
  </div>;
}
