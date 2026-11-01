/** Sandboxed previews cannot inspect their embedding page's CSS transform. */
export function sendMotionRenderSize(frame: HTMLIFrameElement | null, slug: string) {
  if (!frame || !["gradient-ring-cards", "matcha-powder-reveal"].includes(slug)) return;
  const { width, height } = frame.getBoundingClientRect();
  frame.contentWindow?.postMessage({ type: "leibox-render-size", slug, width, height }, "*");
}
