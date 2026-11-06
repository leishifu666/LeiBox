"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { T, useLanguage } from "@/components/common/language-provider";
import { sendMotionRenderSize } from "@/lib/motion-render-size";
import { motionDocuments } from "@/lib/motion-document";
import { siteMotionUrl } from "@/lib/site-motion";

export function MotionPreview({ slug, name, width, height, responsive = false }: {
  slug: string; name: string; width: number; height: number; responsive?: boolean;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState(width);
  const [version, setVersion] = useState(0);
  const [content, setContent] = useState({ key: "", html: "", failed: false });
  const url = siteMotionUrl(slug);
  const key = `${url}:${version}`;
  const html = content.key === key ? content.html : "";
  const failed = content.key === key && content.failed;
  useEffect(() => {
    let current = true;
    const lease = motionDocuments.acquire(url);
    lease.promise.then(source => { if (current) setContent({ key, html: source, failed: false }); }, () => { if (current) setContent({ key, html: "", failed: true }); });
    return () => { current = false; lease.release(); };
  }, [url, key]);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const scale = responsive ? 1 : Math.min(1, available / width);
  useEffect(() => sendMotionRenderSize(iframe.current, slug), [available, version, slug]);
  return (
    <div>
      <div data-component-demo-panel className="overflow-hidden rounded-xl border border-border/60">
        <div ref={ref} className="overflow-hidden bg-white" style={{ height: height * scale }}>
          {html ? <iframe ref={iframe} key={version} srcDoc={html} onLoad={() => sendMotionRenderSize(iframe.current, slug)} title={t(name)} sandbox={slug === "spider-music-player" ? "allow-scripts allow-popups allow-popups-to-escape-sandbox" : "allow-scripts"} allow="clipboard-write" style={{ width: responsive ? "100%" : Math.max(width, available), height, border: 0, display: "block", transform: `scale(${scale})`, transformOrigin: "top left" }} /> : <p role="status" className="grid h-full place-items-center text-sm text-muted-foreground">{failed ? t("Preview unavailable") : t("Loading preview")}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <button type="button" onClick={() => setVersion((current) => current + 1)} className="inline-flex items-center gap-1.5 rounded px-1 py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><RotateCcw aria-hidden className="size-3.5" /><T>Reset demo</T></button>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded px-1 py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><ExternalLink aria-hidden className="size-3.5" /><T>Open full preview</T></a>
      </div>
    </div>
  );
}
