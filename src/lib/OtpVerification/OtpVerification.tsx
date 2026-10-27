"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import gsap from "gsap";
import { Check, LoaderCircle, LockKeyhole } from "lucide-react";
import { OTP_MOTION as M, OTP_REPLAY } from "./otp-motion";
import "./otp-verification.css";

type Phase = "idle" | "input" | "verifying" | "error" | "success";
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => false;

/** Local UI demonstration. This does not authenticate users or send a code. */
export function OtpVerification({ autoPlay = false, onReplayComplete }: {
  autoPlay?: boolean;
  onReplayComplete?: () => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const success = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const context = useRef<gsap.Context | null>(null);
  const callback = useRef(onReplayComplete);
  const replay = useRef(autoPlay);
  const replayAttempt = useRef(0);
  const replayStarted = useRef(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const reduce = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const editing = phase === "input";

  useLayoutEffect(() => { callback.current = onReplayComplete; replay.current = autoPlay; });
  useLayoutEffect(() => {
    context.current = gsap.context(() => {}, root);
    return () => { context.current?.revert(); };
  }, []);

  useLayoutEffect(() => {
    let timeline: gsap.core.Timeline;
    context.current?.add(() => {
      const q = gsap.utils.selector(root);
      const labels = q(".otp-label");
      const cells = q(".otp-cell");
      const digits = q(".otp-number");
      const ring = q(".otp-focus");
      const duration = (seconds: number) => reduce ? 0 : seconds;
      timeline = gsap.timeline();
      timeline.set(q(".otp-spinner"), { rotation: 0 });

      if (phase === "idle") {
        timeline.set(shell.current, { width: M.compactWidth, x: 0, scale: 1 })
          .set(labels, { autoAlpha: 0, filter: "blur(0px)", scale: 1 })
          .set(q(".otp-idle"), { autoAlpha: 1 })
          .set(q(".otp-cells"), { autoAlpha: 0 })
          .set(q(".otp-fill"), { backgroundColor: "#ecebe4", opacity: 1 })
          .set(ring, { autoAlpha: 0 })
          .call(() => {
            if (restoreFocus.current) {
              restoreFocus.current = false;
              trigger.current?.focus({ preventScroll: true });
            }
          });
      } else if (phase === "input") {
        timeline.to(labels, { autoAlpha: 0, filter: "blur(5px)", scale: 0.84, duration: duration(0.16) }, 0)
          .to(shell.current, { width: M.expandedWidth, x: 0, scale: 1, duration: duration(M.openDuration), ease: M.ease }, 0)
          .to(q(".otp-fill"), { backgroundColor: "#ecebe4", opacity: 0, duration: duration(0.15) }, 0)
          .set(cells, { backgroundColor: "#ecebe4", color: "#22221d" }, 0)
          .set(digits, { opacity: 1, y: 0, filter: "blur(0px)" }, 0)
          .fromTo(q(".otp-cells"), { autoAlpha: 0, scaleX: 0.76, filter: "blur(5px)" },
            { autoAlpha: 1, scaleX: 1, filter: "blur(0px)", duration: duration(0.32), ease: "power3.out" }, duration(0.1))
          .set(ring, { autoAlpha: 1 }, duration(0.18))
          .call(() => { if (!replay.current) field.current?.focus({ preventScroll: true }); }, [], duration(0.18));
      } else if (phase === "verifying") {
        timeline.set(ring, { autoAlpha: 0 })
          .to(digits, { y: -6, opacity: 0, filter: "blur(5px)", duration: duration(0.16), stagger: duration(0.012) }, 0)
          .to(q(".otp-cells"), { autoAlpha: 0, scaleX: 0.45, filter: "blur(7px)", duration: duration(0.26), ease: "power2.inOut" }, 0.04)
          .to(shell.current, { width: 116, duration: duration(0.22), ease: "power2.in" }, 0)
          .to(shell.current, { width: M.compactWidth, duration: duration(M.collapseDuration), ease: M.ease }, duration(0.2))
          .to(q(".otp-fill"), { opacity: 1, duration: duration(0.15) }, duration(0.22))
          .fromTo(q(".otp-verifying"), { autoAlpha: 0, scale: 0.8, filter: "blur(5px)" },
            { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: duration(0.22) }, duration(0.32));
        if (!reduce) timeline.to(q(".otp-spinner"), { rotation: 360, duration: 0.75, ease: "none", repeat: -1 }, 0.3);
      } else if (phase === "error") {
        timeline.to(labels, { autoAlpha: 0, duration: duration(0.1) }, 0)
          .set(cells, { backgroundColor: "#fae3e4", color: "#d32e4d" }, 0)
          .to(q(".otp-fill"), { opacity: 0, duration: duration(0.15) }, 0)
          .set(digits, { y: 0, opacity: 1, filter: "blur(0px)" }, 0)
          .to(shell.current, { width: M.expandedWidth, duration: duration(0.38), ease: M.ease }, 0)
          .to(q(".otp-cells"), { autoAlpha: 1, scaleX: 1, filter: "blur(0px)", duration: duration(0.24) }, duration(0.06));
        if (!reduce) timeline.to(shell.current, { keyframes: [{ x: -8 }, { x: 8 }, { x: -5 }, { x: 3 }, { x: 0 }], duration: 0.3, ease: "power1.inOut" }, 0.15);
        timeline.to(digits, { opacity: 0, y: 6, filter: "blur(3px)", duration: duration(0.18), stagger: duration(0.02) }, duration(0.38))
          .call(() => { setCode(""); setActive(0); setPhase("input"); }, [], M.errorDuration / 1000);
      } else {
        timeline.to(q(".otp-verifying"), { autoAlpha: 0, filter: "blur(4px)", scale: 0.9, duration: duration(0.14) }, 0)
          .to(shell.current, { width: M.verifiedWidth, duration: duration(0.42), ease: M.ease }, 0)
          .to(q(".otp-fill"), { backgroundColor: "#26bc4e", duration: duration(0.25) }, 0)
          .fromTo(q(".otp-success"), { autoAlpha: 0, filter: "blur(4px)", scale: 0.9 },
            { autoAlpha: 1, filter: "blur(0px)", scale: 1, duration: duration(0.25) }, duration(0.08))
          .call(() => { if (!replay.current) success.current?.focus({ preventScroll: true }); });
      }
    });
    return () => { timeline?.kill(); };
  }, [phase, reduce]);

  // The validation timer is independent of animation and motion preferences.
  useEffect(() => {
    if (phase !== "verifying") return;
    const timer = window.setTimeout(() => setPhase(code === "123456" ? "success" : "error"), M.verifyDelay);
    return () => window.clearTimeout(timer);
  }, [phase, code]);
  useEffect(() => {
    if (!autoPlay) return;
    replayAttempt.current = 0;
    replayStarted.current = performance.now();
    const timer = window.setTimeout(() => setPhase("input"), 250);
    return () => window.clearTimeout(timer);
  }, [autoPlay]);
  useEffect(() => {
    if (!autoPlay || phase !== "input") return;
    const attempt = replayAttempt.current++;
    const sequence = attempt === 0 ? OTP_REPLAY.slice(0, 6) : OTP_REPLAY.slice(6);
    const lead = attempt === 0 ? 750 : 370;
    // Start the second attempt only after error feedback has actually finished.
    const timers = sequence.map(([time, value]) => window.setTimeout(() => {
      setCode(value); setActive(Math.min(value.length, 5));
      if (value.length === 6) setPhase("verifying");
    }, lead + time - sequence[0][0]));
    return () => timers.forEach(window.clearTimeout);
  }, [autoPlay, phase]);
  useEffect(() => {
    if (!autoPlay || phase !== "success") return;
    const timer = window.setTimeout(() => callback.current?.(), Math.max(0, 8883 - (performance.now() - replayStarted.current)));
    return () => window.clearTimeout(timer);
  }, [autoPlay, phase]);

  useLayoutEffect(() => {
    let tween: gsap.core.Tween | undefined;
    context.current?.add(() => {
      const ring = root.current?.querySelector(".otp-focus");
      if (!ring) return;
      tween = gsap.to(ring, {
        x: active * 61, borderRadius: active === 0 ? "29px 17px 17px 29px" : active === 5 ? "17px 29px 29px 17px" : "17px",
        duration: reduce ? 0 : M.focusDuration, ease: "power3.out", overwrite: true,
      });
    });
    return () => { tween?.kill(); };
  }, [active, reduce]);

  useLayoutEffect(() => {
    if (!editing || !code) return;
    let tween: gsap.core.Tween | undefined;
    context.current?.add(() => {
      const digit = root.current?.querySelectorAll(".otp-number")[Math.max(0, code.length - 1)];
      if (!digit) return;
      tween = gsap.fromTo(digit, { y: 7, opacity: 0, filter: "blur(3px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: reduce ? 0 : 0.18, overwrite: true });
    });
    return () => { tween?.kill(); };
  }, [code, editing, reduce]);

  function reset() {
    restoreFocus.current = true;
    setCode(""); setActive(0); setFocused(false); setPhase("idle");
  }
  function changeCode(raw: string) {
    const next = raw.replace(/\D/g, "").slice(0, 6);
    setCode(next); setActive(Math.min(next.length, 5));
    if (next.length === 6) { setFocused(false); setPhase("verifying"); }
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { event.preventDefault(); reset(); }
  }
  const announcement = phase === "verifying" ? "Verifying code" : phase === "error"
    ? "Incorrect code. Please try again. Demo code: 123456." : phase === "success" ? "Code verified" : "";

  return (
    <div ref={root} className="leibox-otp otp-stage notranslate" translate="no" lang="en" data-state={phase} data-replay={autoPlay || undefined}>
      <div className="otp-scale">
        <div ref={shell} className="otp-shell">
          <div className="otp-fill" />
          <button ref={trigger} className="otp-label otp-idle" type="button" disabled={autoPlay}
            tabIndex={phase === "idle" ? 0 : -1} inert={phase !== "idle"}
            onClick={() => setPhase("input")} aria-label="Enter verification code">
            <LockKeyhole aria-hidden /><span>Enter code</span>
          </button>
          <div className="otp-cells" role="group" aria-label="Six digit verification code" inert={!editing || autoPlay}>
            {Array.from({ length: 6 }, (_, index) => (
              <div className="otp-cell" key={index} aria-hidden="true">
                <span className="otp-number">{code[index] || ""}</span>
              </div>
            ))}
            <div className="otp-focus" aria-hidden="true">
              <span className="otp-caret" style={{ visibility: (focused || autoPlay) && !code[active] && editing ? "visible" : "hidden" }} />
            </div>
            <input ref={field} className="otp-native" type="text" inputMode="numeric" pattern="[0-9]*"
              autoComplete="one-time-code" aria-label="Six digit verification code" aria-describedby={id}
              aria-invalid={phase === "error"} readOnly={!editing || autoPlay} tabIndex={editing && !autoPlay ? 0 : -1}
              value={code} onChange={(event) => changeCode(event.target.value)} onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onSelect={(event) => setActive(Math.min(event.currentTarget.selectionStart ?? code.length, 5))}
              onPointerUp={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const index = Math.min(Math.floor((event.clientX - rect.left) / (rect.width / 6)), code.length, 5);
                event.currentTarget.setSelectionRange(index, Math.min(index + 1, code.length));
                setActive(index);
              }}
              onPaste={(event) => {
                event.preventDefault();
                changeCode(event.clipboardData.getData("text"));
              }} />
          </div>
          <div className="otp-label otp-verifying" aria-hidden="true"><LoaderCircle className="otp-spinner" /><span>Verifying</span></div>
          <button ref={success} className="otp-label otp-success" type="button" disabled={autoPlay} inert={phase !== "success"}
            tabIndex={phase === "success" ? 0 : -1} onClick={reset} aria-label="Verified. Start again">
            <Check aria-hidden /><span>Verified</span>
          </button>
        </div>
      </div>
      <span id={id} className="otp-sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  );
}
