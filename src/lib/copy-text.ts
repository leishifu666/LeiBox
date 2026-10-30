/** Start the clipboard operation during the click, even if a source file is loading. */
export async function copyText(value: string | Promise<string>) {
  const clipboard = navigator.clipboard;
  if (typeof value !== "string" && typeof ClipboardItem !== "undefined" && clipboard?.write) {
    await clipboard.write([new ClipboardItem({
      "text/plain": value.then(text => new Blob([text], { type: "text/plain" })),
    })]);
    return;
  }
  if (clipboard?.writeText) {
    // Keep an available API's permission errors visible; the fallback is for
    // browsers/HTTP pages without the API, not a way around a denied permission.
    await clipboard.writeText(typeof value === "string" ? value : await value);
    return;
  }

  const text = typeof value === "string" ? value : await value;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = window.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.tabIndex = -1;
  field.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);
    if (!document.execCommand("copy")) throw new Error("Clipboard copy was rejected");
  } finally {
    field.remove();
    active?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach(range => selection.addRange(range));
    }
  }
}
