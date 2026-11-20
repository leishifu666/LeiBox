"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { useLanguage } from "@/components/common/language-provider";
import { usePreference } from "@/hooks/use-preference";
import type { MotionPackageRef } from "@/lib/doc-asset-types";
import { createMotionPackageZip } from "@/lib/motion-package-zip";
import { cn } from "@/lib/utils";

const downloadLabels = {
  idle: "Download ZIP",
  downloading: "Downloading ZIP",
  failed: "Download failed, try again",
};
type DownloadStatus = keyof typeof downloadLabels;

const MotionPackageDownloadContext = createContext<{
  active: MotionPackageRef;
  status: DownloadStatus;
  download: () => Promise<void>;
} | null>(null);

export function useMotionPackageDownload() {
  return useContext(MotionPackageDownloadContext);
}

export function MotionPackageDownloadProvider({ packages, children }: {
  packages: MotionPackageRef[];
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const [framework] = usePreference("framework", "react", packages.map(pack => pack.framework));
  const active = packages.find(pack => pack.framework === framework) ?? packages[0];
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const inFlight = useRef<AbortController | null>(null);

  useLayoutEffect(() => () => {
    // Cancel the old framework's download before the new selection is painted.
    inFlight.current?.abort();
    inFlight.current = null;
    setStatus("idle");
  }, [active?.bundleUrl]);

  const download = async () => {
    if (!active || inFlight.current) return;
    const request = new AbortController();
    inFlight.current = request;
    setStatus("downloading");

    try {
      const archive = await createMotionPackageZip(active, request.signal);
      if (request.signal.aborted) return;
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leibox-${active.slug}-${active.framework}.zip`;
      try {
        link.click();
      } finally {
        // Let the browser open the object URL before releasing it.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setStatus("idle");
    } catch {
      if (!request.signal.aborted) setStatus("failed");
    } finally {
      if (inFlight.current === request) inFlight.current = null;
    }
  };

  return (
    <MotionPackageDownloadContext.Provider value={active ? { active, status, download } : null}>
      {children}
      <span role="status" className="sr-only">{status === "idle" ? "" : t(downloadLabels[status])}</span>
    </MotionPackageDownloadContext.Provider>
  );
}

export function MotionPackageDownloadButton({ menuItem = false }: { menuItem?: boolean }) {
  const { t } = useLanguage();
  const bundle = useMotionPackageDownload();
  if (!bundle) return null;
  const downloading = bundle.status === "downloading";
  const Icon = downloading ? LoaderCircle : Download;
  return (
    <button
      type="button"
      role={menuItem ? "menuitem" : undefined}
      aria-disabled={downloading || undefined}
      onClick={() => void bundle.download()}
      className={cn(
        "text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-muted-foreground aria-disabled:cursor-progress motion-reduce:transition-none",
        menuItem
          ? "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted/60"
          : "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5",
      )}
    >
      <Icon aria-hidden className={cn("size-4 shrink-0", downloading && "motion-safe:animate-spin")} />
      {t(downloadLabels[bundle.status])}
    </button>
  );
}
