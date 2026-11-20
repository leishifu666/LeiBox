"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { T, useLanguage } from "@/components/common/language-provider";
import { MotionDemoFrame } from "@/components/docs/component-doc-chrome";
import { motionDocuments } from "@/lib/motion-document";
import { sendMotionRenderSize } from "@/lib/motion-render-size";
import { optimizedImage } from "@/lib/optimized-image";
import { siteMotionUrl, usesViewportMotionPlayback } from "@/lib/site-motion";

export function MotionPreview({ slug, name, width, height, responsive = false, poster }: {
  slug: string; name: string; width: number; height: number; responsive?: boolean; poster?: string;
}) {
  const { t, locale } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const viewportPlayback = usesViewportMotionPlayback(slug);
  const [available, setAvailable] = useState(width);
  const [version, setVersion] = useState(0);
  const [started, setStarted] = useState(!viewportPlayback && !poster);
  const [loadedKey, setLoadedKey] = useState("");
  const [content, setContent] = useState({ key: "", html: "", failed: false });
  const url = siteMotionUrl(slug);
  const key = `${url}:${version}`;
  const html = started && content.key === key ? content.html : "";
  const library = html.includes("data-leibox-library");
  const failed = started && content.key === key && content.failed;
  useEffect(() => {
    if (!started) return;
    let current = true;
    const lease = motionDocuments.acquire(url);
    lease.promise.then(
      source => { if (current) setContent({ key, html: source, failed: false }); },
      () => { if (current) setContent({ key, html: "", failed: true }); },
    );
    return () => { current = false; lease.release(); };
  }, [started, url, key]);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setAvailable(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (viewportPlayback || started || !ref.current) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      frame = requestAnimationFrame(() => setStarted(true));
    });
    observer.observe(ref.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [viewportPlayback, started]);
  useEffect(() => {
    if (!viewportPlayback || !ref.current) return;
    let visible = false;
    const update = () => {
      const shouldPlay = visible && !document.hidden;
      setStarted(shouldPlay);
      if (!shouldPlay) setLoadedKey("");
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [viewportPlayback]);
  const scale = responsive ? 1 : Math.min(1, available / width);
  useEffect(() => sendMotionRenderSize(iframe.current, slug), [available, version, slug]);
  useEffect(() => {
    if (library) iframe.current?.contentWindow?.postMessage({ type: "leibox-library-locale", locale }, "*");
  }, [library, locale, version]);
  useEffect(() => {
    if (!library || !poster) return;
    const receive = (event: MessageEvent) => {
      if (event.source === iframe.current?.contentWindow && event.data?.type === "leibox-preview-ready" && event.data?.slug === slug) {
        setLoadedKey(key);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [library, poster, slug, key]);
  return (
    <div>
      <MotionDemoFrame width={width} height={height} responsive={responsive} viewportRef={ref} borderless={viewportPlayback}>
        {poster && (!started || loadedKey !== key) && !failed && (
          // Use the card's image sizes to reuse its decoded cover through the handoff.
          // eslint-disable-next-line @next/next/no-img-element
          <img {...optimizedImage(poster)} alt="" data-component-demo-poster className="pointer-events-none absolute inset-0 z-10 size-full object-cover" />
        )}
        {html ? (
          <iframe
            ref={iframe}
            key={key}
            srcDoc={html}
            onLoad={() => {
              sendMotionRenderSize(iframe.current, slug);
              if (library) iframe.current?.contentWindow?.postMessage({ type: "leibox-library-locale", locale }, "*");
              if (poster && !library) setLoadedKey(key);
            }}
            title={t(name)}
            sandbox={slug === "spider-music-player" ? "allow-scripts allow-popups allow-popups-to-escape-sandbox" : "allow-scripts"}
            allow="clipboard-write"
            style={{ width: responsive ? "100%" : Math.max(width, available), height, border: 0, display: "block", transform: `scale(${scale})`, transformOrigin: "top left" }}
          />
        ) : (started || !viewportPlayback) && (
          <p role="status" className={poster && !failed ? "sr-only" : "grid h-full place-items-center text-sm text-muted-foreground"}>
            {failed ? t("Preview unavailable") : t("Loading preview")}
          </p>
        )}
      </MotionDemoFrame>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <button type="button" onClick={() => setVersion((current) => current + 1)} className="inline-flex items-center gap-1.5 rounded px-1 py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><RotateCcw aria-hidden className="size-3.5" /><T>Reset demo</T></button>
          <a href={viewportPlayback ? `${url}?lang=${locale}` : url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded px-1 py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><ExternalLink aria-hidden className="size-3.5" /><T>Open full preview</T></a>
      </div>
    </div>
  );
}
