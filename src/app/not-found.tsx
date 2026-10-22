import { T } from "@/components/common/language-provider";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl"><T>
        Nothing here yet.
      </T></h1>
      <p className="mt-4 max-w-md text-base leading-7 text-balance text-muted-foreground"><T>
        The page you are looking for does not exist or has moved.
      </T></p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        ><T>
          Back home
        </T></Link>
        <Link
          href="/components"
          className="inline-flex h-10 items-center rounded-full border border-border/60 px-5 text-sm font-medium transition-colors hover:bg-muted/50"
        ><T>
          Browse components
        </T></Link>
      </div>
    </main>
  );
}
