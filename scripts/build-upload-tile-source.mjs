import sharp from "sharp";
import { bundleDissolveSource, readDissolveDemoStyles } from "./build-dissolve-source.mjs";

export async function buildUploadTileSource(entry) {
  const [css, thumbnail] = await Promise.all([
    readDissolveDemoStyles(),
    sharp("public/landing/agent-demo/alpine-lake.png").resize(176, 176, { fit: "cover" }).webp({ quality: 78 }).toBuffer(),
  ]);
  const source = `
import { createUploadTileDemo } from "./upload-tile-demo";
export { createUploadTile } from "./dissolve/upload-tile.core";
export { createUploadTray } from "./dissolve/upload-tray";
export function mountUploadTray(target, options = {}) {
  return createUploadTileDemo(target, options, ${JSON.stringify(css)}, "data:image/webp;base64,${thumbnail.toString("base64")}");
}
`;
  const demo = `
const preview = document.documentElement.hasAttribute("data-leibox-motion-preview");
const localeOf = lang => lang === "zh" ? "zh" : "en";
const height = () => Math.max(${entry.canvasHeight}, innerHeight);
const instance = mountUploadTray(document.querySelector("main"), {
  preview, height: height(), locale: localeOf(new URLSearchParams(location.search).get("lang"))
});
const resize = () => instance.update({ height: height() });
const localize = event => {
  if (event.source === parent && event.data?.type === "leibox-library-locale") instance.update({ locale: localeOf(event.data.locale) });
};
const ready = requestAnimationFrame(() => {
  document.body.dataset.motionReady = "true";
  if (parent !== window) parent.postMessage({ type: "leibox-preview-ready", slug: "upload-tile" }, "*");
});
addEventListener("resize", resize);
addEventListener("message", localize);
addEventListener("pagehide", event => {
  if (event.persisted) return;
  cancelAnimationFrame(ready);
  removeEventListener("resize", resize);
  removeEventListener("message", localize);
  instance.destroy();
});
`;
  return bundleDissolveSource(entry, "UploadTile / UploadTray", source, demo);
}

export const uploadTrayTypes = `
export type UploadFile = { id?: string; name: string; size: number; uri?: string };
export type UploadFn = (file: UploadFile, onProgress: (progress: number) => void, signal: AbortSignal) => Promise<void>;
export type RemoveReason = "rejected" | "cancelled" | "removed";
export type UploadTrayProps = UploadTrayOptions & Required<Pick<UploadTrayOptions, "files" | "upload">>;
export type UploadTileProps = Omit<UploadTrayProps, "files" | "gap" | "onAdd" | "height"> & { file: UploadFile; spacing?: number };
export function createUploadTile(host: HTMLElement, props: UploadTileProps): { update(props: Partial<UploadTileProps>): void; destroy(): void };
export function createUploadTray(host: HTMLElement, props: UploadTrayProps): { update(props: Partial<UploadTrayProps>): void; destroy(): void };
`;

export const uploadTrayReactSource = `"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { createUploadTile, createUploadTray, mountUploadTray, type UploadTileProps, type UploadTrayProps, type UploadTrayOptions } from "./UploadTrayEngine.js";

export type { UploadFile, UploadFn, RemoveReason, UploadTileProps, UploadTrayProps, UploadTrayOptions } from "./UploadTrayEngine.js";

type Appearance = { className?: string; style?: CSSProperties };

export function UploadTray({ className, style, ...props }: Appearance & (UploadTrayProps | { options?: UploadTrayOptions })) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<{ update(options: UploadTrayOptions): void; destroy(): void } | null>(null);
  const direct = "files" in props;
  const options = direct ? props : props.options;
  useEffect(() => {
    const instance = direct ? createUploadTray(host.current!, props) : mountUploadTray(host.current!, options);
    controller.current = instance;
    return () => { instance.destroy(); controller.current = null; };
    // Props update below while every existing file keeps its own upload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direct]);
  useEffect(() => controller.current?.update(options ?? {}), [options]);
  return <div ref={host} className={className} style={style} data-motion-component="upload-tile" />;
}

export function UploadTile({ className, style, ...props }: Appearance & UploadTileProps) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createUploadTile> | null>(null);
  const { id, name, size, uri } = props.file;
  useEffect(() => {
    const instance = createUploadTile(host.current!, props);
    controller.current = instance;
    return () => { instance.destroy(); controller.current = null; };
    // A different file owns a different upload. Callbacks update below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, name, size, uri]);
  useEffect(() => controller.current?.update(props), [props]);
  return <div ref={host} className={className} style={style} />;
}
`;
