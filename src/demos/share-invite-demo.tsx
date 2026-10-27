"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { T } from "@/components/common/language-provider";
import { ShareInvite } from "@/lib/ShareInvite/ShareInvite";

export function ShareInviteDemo() {
  const [version, setVersion] = useState(0);
  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-border/60"><ShareInvite key={version} /></div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => setVersion((value) => value + 1)} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2">
          <RotateCcw aria-hidden className="size-3.5" /><T>Reset demo</T>
        </button>
      </div>
    </div>
  );
}
