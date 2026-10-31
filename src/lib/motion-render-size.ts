/** Sandboxed previews cannot inspect their embedding page's CSS transform. */
export function sendMotionRenderSize(frame: HTMLIFrameElement | null, slug: string) {
  if (!frame || slug !== "gradient-ring-cards") return;
  const { width, height } = frame.getBoundingClientRect();
  frame.contentWindow?.postMessage({ type: "leibox-render-size", slug, width, height }, "*");
}
