"use client";

import { useState } from "react";
import { Play, RotateCcw, Square } from "lucide-react";
import { T } from "@/components/common/language-provider";
import { OtpVerification } from "@/lib/OtpVerification/OtpVerification";

export function OtpVerificationDemo() {
  const [version, setVersion] = useState(0);
  const [playing, setPlaying] = useState(false);
  const button = "inline-flex items-center gap-1.5 rounded px-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <span className="text-xs text-muted-foreground"><T>Interactive preview</T></span>
        <div className="flex flex-wrap gap-2">
          <button className={button} data-otp-action="replay" type="button" onClick={() => { setPlaying(!playing); setVersion(value => value + 1); }}>
            {playing ? <Square className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}<T>{playing ? "Stop playback" : "Play reference sequence"}</T>
          </button>
          <button className={button} data-otp-action="reset" type="button" onClick={() => { setPlaying(false); setVersion(value => value + 1); }}>
            <RotateCcw className="size-3.5" aria-hidden /><T>Reset demo</T>
          </button>
        </div>
      </div>
      <OtpVerification key={version} autoPlay={playing} onReplayComplete={() => setPlaying(false)} />
      <p className="border-t border-border/60 px-4 py-3 text-xs leading-5 text-muted-foreground"><T>Click Enter code and type 123456 to succeed. Any other six digits show the error animation. This is local demo validation.</T></p>
    </div>
  );
}
