"use client";

import { gsap } from "gsap";
import { ArrowLeft, Check, CircleAlert, RotateCcw } from "lucide-react";
import Link from "next/link";
import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { animateSubmission } from "./submission-motion";
import styles from "./submit-state-preview.module.css";

type State = "idle" | "loading" | "success" | "error" | "invalid";
type Outcome = "success" | "error" | "invalid";
type Scheme = {
  id: number; name: string; summary: string; motionKey: string; loading: string;
  success: string; error: string; validation: string; cycleMs: number;
  transitionMs: number; ease: string; widthPx: number; radiusPx: number;
  bestFor: string; tradeoff: string;
};
type Proposals = { schemes: Scheme[]; recommended: number[]; recommendation: string };
type CardHandle = { play: (outcome: Outcome) => void; reset: () => void };
const example = "你好，我想推荐一个有趣的 UI 组件，供你参考。";
const labels: Record<State, string> = { idle: "提交", loading: "发送中", success: "已提交", error: "重试", invalid: "请检查" };
const feedback: Record<State, string> = {
  idle: "点击提交，体验发送与成功反馈",
  loading: "正在发送，请稍候",
  success: "留言已提交",
  error: "发送失败，内容已保留，点击重试",
  invalid: "请填写至少 10 个字符的留言",
};
const query = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (listener: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
const readMotion = () => window.matchMedia(query).matches;
const serverMotion = () => true;

function SubmissionButton({ scheme, state, slow, reduced, onClick }: {
  scheme: Scheme; state: State; slow: boolean; reduced: boolean; onClick: () => void;
}) {
  const root = useRef<HTMLButtonElement>(null);
  const context = useRef<gsap.Context | null>(null);

  useLayoutEffect(() => {
    context.current = gsap.context(() => {}, root);
    return () => { context.current?.revert(); context.current = null; };
  }, []);

  useLayoutEffect(() => {
    let timeline: gsap.core.Timeline | null = null;
    context.current?.add(() => {
      if (!root.current) return;
      timeline = animateSubmission({ id: scheme.id, state, root: root.current, gsap, reduced });
      timeline?.timeScale(slow ? 0.5 : 1);
    });
    // Preserve the current pose between states so a fast response can interrupt the motion.
    return () => { timeline?.kill(); };
  }, [scheme.id, state, slow, reduced]);

  return <button ref={root} type="button" className={styles.submit} data-submit-button data-variant={scheme.id} data-state={state}
    disabled={state === "loading" || state === "success"} aria-busy={state === "loading"} aria-label={labels[state]} onClick={onClick}>
    <span data-submit-fill aria-hidden />
    <span data-submit-label>{labels[state]}</span>
    <span data-submit-loader aria-hidden>
      <span data-submit-ring />
      <span data-submit-dot /><span data-submit-dot /><span data-submit-dot />
    </span>
    <Check data-submit-success aria-hidden strokeWidth={2} />
    <CircleAlert data-submit-error aria-hidden strokeWidth={1.8} />
  </button>;
}

const SubmissionCard = forwardRef<CardHandle, { scheme: Scheme; recommended: boolean; slow: boolean; reduced: boolean }>(function SubmissionCard({ scheme, recommended, slow, reduced }, ref) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState(example);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const send = (outcome: Outcome) => {
    stop();
    setState("loading");
    timer.current = setTimeout(() => { setState(outcome); timer.current = null; }, slow ? 4800 : 2400);
  };
  const play = (outcome: Outcome, focus = false) => {
    stop();
    if (outcome === "invalid") {
      setMessage(""); setState("invalid");
      if (focus) requestAnimationFrame(() => field.current?.focus({ preventScroll: true }));
      return;
    }
    if (message.trim().length < 10) setMessage(example);
    send(outcome);
  };
  const reset = () => { stop(); setState("idle"); setMessage(example); };
  useImperativeHandle(ref, () => ({ play, reset }));

  const submit = () => {
    if (state === "loading" || state === "success") return;
    if (message.trim().length < 10) { setState("invalid"); field.current?.focus(); return; }
    send("success");
  };

  return <article className={styles.card} data-submit-card={scheme.id} data-status={state}>
    <header className={styles.cardHeader}>
      <span className={styles.number}>{String(scheme.id).padStart(2, "0")}</span>
      <h2>{scheme.name}</h2>
      {(scheme.id === 1 || recommended) && <span className={styles.recommended}>{scheme.id === 1 ? "已采用" : "Gemini 推荐"}</span>}
    </header>
    <p className={styles.summary}>{scheme.summary}</p>
    <div className={styles.formPreview}>
      <div className={styles.formHeader}>联系与投稿<span>留言</span></div>
      <div className={styles.fieldGroup}>
        <label htmlFor={id + "-message"}>留言内容</label>
        <textarea ref={field} id={id + "-message"} rows={2} value={message} maxLength={6000} disabled={state === "loading"}
          aria-invalid={state === "invalid"} aria-describedby={id + "-feedback"}
          placeholder="写下你的留言…" onChange={event => {
            setMessage(event.target.value);
            if (state !== "idle") { stop(); setState("idle"); }
          }} />
      </div>
      <footer className={styles.formFooter}>
        <span className={styles.emailHint}>改用邮件</span>
        <div className={styles.buttonSlot}>
          <SubmissionButton scheme={scheme} state={state} slow={slow} reduced={reduced} onClick={submit} />
        </div>
      </footer>
    </div>
    <p id={id + "-feedback"} role={state === "error" || state === "invalid" ? "alert" : "status"} aria-live="polite"
      className={styles.feedback} data-feedback={state}>{feedback[state]}</p>
    <div className={styles.cardControls}>
      <div className={styles.outcomes} aria-label={scheme.name + "演示场景"}>
        <button type="button" onClick={() => play("success")}>看成功</button>
        <button type="button" onClick={() => play("error")}>看失败</button>
        <button type="button" onClick={() => play("invalid", true)}>看校验</button>
      </div>
      <button type="button" className={styles.reset} onClick={reset} aria-label={"重置" + scheme.name}><RotateCcw size={14} aria-hidden /></button>
    </div>
    <details className={styles.details}>
      <summary>动效细节与取舍</summary>
      <p><strong>发送中</strong>{scheme.loading}</p><p><strong>成功</strong>{scheme.success}</p><p><strong>失败</strong>{scheme.error}</p>
      <p>{scheme.bestFor}</p><p>{scheme.tradeoff}</p>
    </details>
  </article>;
});

export function SubmitStatePreview({ proposals }: { proposals: Proposals }) {
  const cards = useRef<(CardHandle | null)[]>([]);
  const [outcome, setOutcome] = useState<Outcome>("success");
  const [slow, setSlow] = useState(false);
  const [staticPreview, setStaticPreview] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, serverMotion) || staticPreview;

  return <div className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.homeLink}><ArrowLeft size={14} aria-hidden />返回网站</Link>
      <span className={styles.provenance}>Gemini 3.1 Pro · High</span>
      <ThemeToggle />
    </header>
    <main className={styles.main}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>CONTACT / SUBMIT STATES</p>
        <h1>提交之后，也有回应</h1>
        <p className={styles.description}>六种动效，放进同一张表单里比较。点击提交，或选择下面的场景。</p>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.scenarios} aria-label="同时演示的场景">
          {([{ id: "success", label: "发送成功" }, { id: "error", label: "发送失败" }, { id: "invalid", label: "校验未通过" }] as const).map(item =>
            <button key={item.id} type="button" aria-pressed={outcome === item.id} onClick={() => setOutcome(item.id)}>{item.label}</button>)}
        </div>
        <div className={styles.playback}>
          <Button variant="outline" onClick={() => cards.current.forEach(card => card?.reset())}>重置</Button>
          <Button onClick={() => cards.current.forEach(card => card?.play(outcome))}>同时演示六版</Button>
        </div>
      </div>
      <div className={styles.options}>
        <p>模拟演示，不会发送留言</p>
        <div><label><input type="checkbox" checked={slow} onChange={event => setSlow(event.target.checked)} />半速观看</label>
          <label><input type="checkbox" checked={staticPreview} onChange={event => setStaticPreview(event.target.checked)} />静态反馈</label></div>
      </div>
      <div className={styles.grid}>
        {proposals.schemes.map((scheme, index) => <SubmissionCard key={scheme.id} ref={card => { cards.current[index] = card; }}
          scheme={scheme} recommended={proposals.recommended.includes(scheme.id)} slow={slow} reduced={reduced} />)}
      </div>
      <aside className={styles.verdict}><strong>Gemini 的建议</strong><p>{proposals.recommendation}</p></aside>
    </main>
  </div>;
}
