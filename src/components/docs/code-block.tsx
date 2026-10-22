import { CopyButton } from "@/components/docs/copy-button";

export function CodeBlock({
  html,
  source,
  fileName,
}: {
  /** Pre-highlighted HTML produced on the server. Omit for a single-line command row. */
  html?: string;
  /** Raw source, used for the copy button. */
  source: string;
  /** File name shown in the header of a multi-line block. */
  fileName?: string;
}) {
  if (!html) {
    return (
      <div className="not-typeset flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-border/60 py-1.5 pr-1.5 pl-4">
        <code className="font-mono text-[13px] break-all whitespace-pre-wrap text-foreground/90">
          {source}
        </code>
        <CopyButton text={source} />
      </div>
    );
  }

  return (
    <div className="not-typeset overflow-hidden rounded-xl border border-border/60">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 py-1 pr-1.5 pl-4">
        <span className="text-[12px] text-muted-foreground">
          {fileName ?? ""}
        </span>
        <CopyButton text={source} />
      </div>
      <div
        className="docs-code max-h-[480px] overflow-y-auto text-[13px] leading-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
