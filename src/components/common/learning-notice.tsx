import Link from "next/link";
import { T } from "./language-provider";
import { cn } from "@/lib/utils";

export function LearningNotice({ className }: { className?: string }) {
  return <aside data-learning-notice className={cn("text-xs leading-6 text-muted-foreground", className)}>
    <p><strong className="font-medium text-foreground"><T>For learning use only.</T></strong>{" "}<T>Third-party designs, code and media remain subject to their owners' rights and licenses.</T></p>
    <Link href="/copyright" className="underline underline-offset-4 transition-colors hover:text-foreground"><T>Sources and permissions</T></Link>
  </aside>;
}
