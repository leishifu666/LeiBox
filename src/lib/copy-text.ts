/** Start the clipboard operation during the click, even if a source file is loading. */
export async function copyText(value: string | Promise<string>) {
  if (typeof value !== "string" && typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
    await navigator.clipboard.write([new ClipboardItem({
      "text/plain": value.then(text => new Blob([text], { type: "text/plain" })),
    })]);
  } else {
    await navigator.clipboard.writeText(await value);
  }
}
