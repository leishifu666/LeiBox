"use client";

import { gsap } from "gsap";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from "react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import styles from "./logo-transition-preview.module.css";

type Route = "home" | "components" | "missing";
type Pose = { x: number; y: number; height: number };
type Frame = { at: number; progress: number; normal: number; scale: number; ease: string };
type Scheme = {
  id: number; name: string; summary: string; durationMs: number; character: string;
  bestFor: string; tradeoff: string; keyframes: Frame[]; implementation: string;
};
type Proposals = { schemes: Scheme[]; recommended: number[]; recommendation: string };
type CardHandle = { move: (route: Route) => void; replay: () => void };

const ROUTES: { id: Route; name: string }[] = [
  { id: "home", name: "首页" }, { id: "components", name: "组件页" }, { id: "missing", name: "404 页" },
];
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

function destination(route: Route, width: number): Pose {
  if (route === "components") return { x: 20, y: 76, height: 22 };
  if (route === "missing") return { x: 28, y: 23, height: 29 };
  return { x: width * .4, y: 23, height: 22 };
}

const MotionCard = forwardRef<CardHandle, { scheme: Scheme; recommended: boolean; slow: boolean }>(function MotionCard({ scheme, recommended, slow }, ref) {
  const stage = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const tween = useRef<gsap.core.Timeline | null>(null);
  const pose = useRef<Pose>({ x: 0, y: 23, height: 22 });
  const routeRef = useRef<Route>("home");
  const lastMove = useRef<{ from: Pose; route: Route } | null>(null);
  const [route, setRoute] = useState<Route>("home");
  const [fromName, setFromName] = useState("首页");
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);

  const paint = (next: Pose) => {
    pose.current = next;
    gsap.set(logo.current, { left: 0, top: 0, x: next.x, y: next.y, scale: next.height / 25 });
  };

  const move = (nextRoute: Route, replayFrom?: Pose) => {
    const element = stage.current;
    if (!element || !logo.current) return;
    if (!replayFrom && nextRoute === routeRef.current) return;
    tween.current?.kill();
    // A new click starts at the current painted position, even halfway through a move.
    const from = replayFrom ?? { ...pose.current };
    const to = destination(nextRoute, element.clientWidth);
    lastMove.current = { from: { ...from }, route: nextRoute };
    if (!replayFrom) setFromName(ROUTES.find((entry) => entry.id === routeRef.current)!.name);
    routeRef.current = nextRoute;
    setRoute(nextRoute);
    paint(from);
    if (reducedMotion) {
      paint(to);
      element.dataset.motionState = "static";
      return;
    }
    element.dataset.motionState = "playing";
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // Choose the perpendicular orientation so a negative normal bends upward in either direction.
    const sign = dx < 0 ? -1 : 1;
    const state = { progress: 0, normal: 0, scale: 1 };
    const duration = scheme.durationMs * (slow ? 2 : 1) / 1000;
    const update = () => paint({
      x: from.x + dx * state.progress - dy * sign * state.normal,
      y: from.y + dy * state.progress + dx * sign * state.normal,
      height: (from.height + (to.height - from.height) * state.progress) * state.scale,
    });
    const timeline = gsap.timeline({
      onUpdate: update,
      onComplete: () => { paint(to); element.dataset.motionState = "settled"; },
    });
    tween.current = timeline;
    scheme.keyframes.slice(1).forEach((frame, index) => {
      const previous = scheme.keyframes[index];
      timeline.to(state, {
        progress: frame.progress, normal: frame.normal, scale: frame.scale,
        duration: (frame.at - previous.at) * duration, ease: frame.ease,
      }, previous.at * duration);
    });
  };

  const replay = () => {
    const last = lastMove.current;
    if (last) move(last.route, last.from);
    else move("components");
  };

  useImperativeHandle(ref, () => ({ move, replay }));

  useEffect(() => {
    const element = stage.current;
    const image = logo.current;
    if (!element || !image) return;
    const resize = () => {
      tween.current?.kill();
      const next = destination(routeRef.current, element.clientWidth);
      pose.current = next;
      gsap.set(image, { left: 0, top: 0, x: next.x, y: next.y, scale: next.height / 25 });
      element.dataset.motionState = "settled";
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => { observer.disconnect(); tween.current?.kill(); };
  }, []);

  useEffect(() => {
    if (!reducedMotion || !stage.current || !logo.current) return;
    tween.current?.kill();
    const next = destination(routeRef.current, stage.current.clientWidth);
    pose.current = next;
    gsap.set(logo.current, { left: 0, top: 0, x: next.x, y: next.y, scale: next.height / 25 });
    stage.current.dataset.motionState = "static";
  }, [reducedMotion]);

  return (
    <article className={styles.card} data-scheme={scheme.id}>
      <div className={styles.cardHeading}>
        <div className={styles.cardTitle}><span className={styles.number}>{String(scheme.id).padStart(2, "0")}</span><h2>{scheme.name}</h2></div>
        <div className={styles.cardMeta}>{scheme.id === 1 && <span className={styles.recommendation}>已采用</span>}{recommended && <span className={styles.recommendation}>Gemini 推荐</span>}<span>{scheme.durationMs / 1000}s</span></div>
      </div>
      <div ref={stage} className={styles.stage} data-route={route} data-motion-stage>
        <div className={styles.mockHeader}><span /><span /><span /></div>
        <div className={styles.mockSidebar}><i /><i /><i /></div>
        <div className={styles.mockBody}><i /><i /><i /></div>
        <div className={styles.mock404} aria-hidden="true">404</div>
        <span className={styles.routeLabel}>{ROUTES.find((entry) => entry.id === route)!.name}</span>
        {/* Use the existing artwork without registering demo images as navigation Logos. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={logo} src="/leibox-logo.svg" width={604} height={208} alt="LeiBox" className={styles.movingLogo} />
        <span className={styles.pathLabel}>{fromName}<ArrowRight size={10} aria-hidden="true" />{ROUTES.find((entry) => entry.id === route)!.name}</span>
      </div>
      <p className={styles.summary}>{scheme.summary}</p>
      <div className={styles.cardControls}>
        <div className={styles.routes} aria-label={`${scheme.name}的页面切换`}>
          {ROUTES.map((entry) => <button type="button" key={entry.id} aria-pressed={route === entry.id} onClick={() => move(entry.id)}>{entry.name}</button>)}
        </div>
        <button type="button" className={styles.replay} onClick={replay} aria-label={`重播${scheme.name}`}><RotateCcw size={13} aria-hidden="true" /></button>
      </div>
      <details className={styles.details}><summary>适用与取舍</summary><p>{scheme.bestFor}</p><p>{scheme.tradeoff}</p></details>
    </article>
  );
});

export function LogoTransitionPreview({ proposals }: { proposals: Proposals }) {
  const cards = useRef<(CardHandle | null)[]>([]);
  const [route, setRoute] = useState<Route>("home");
  const [slow, setSlow] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.homeLink}><ArrowLeft size={14} aria-hidden="true" />返回网站</Link>
        <span className={styles.provenance}>GEMINI 3.1 PRO · MOTION STUDIES</span>
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>LEIBOX / 06 EXPLORATIONS</p>
          <h1>同一个 Logo，连着走</h1>
          <p className={styles.description}>切换三个页面，比较 Gemini 给出的六种行进方式</p>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.globalRoutes} aria-label="同时切换六个预览">
            {ROUTES.map((entry) => <Button key={entry.id} variant={route === entry.id ? "default" : "ghost"} onClick={() => { setRoute(entry.id); cards.current.forEach((card) => card?.move(entry.id)); }}>{entry.name}</Button>)}
          </div>
          <div className={styles.playback}>
            <Button variant="ghost" aria-pressed={slow} onClick={() => setSlow((value) => !value)}>{slow ? "0.5× 慢放" : "1× 原速"}</Button>
            <Button variant="outline" onClick={() => cards.current.forEach((card) => card?.replay())}><RotateCcw size={13} aria-hidden="true" />全部重播</Button>
          </div>
        </div>
        <p className={styles.note}>{reducedMotion ? "已遵循系统的减少动态效果偏好，当前切换直接到位" : "点击上方按钮同步比较，也可以在每张卡片里单独点播"}<span>布局为动效示意，位移适度放大</span></p>
        <div className={styles.grid}>
          {proposals.schemes.map((scheme, index) => <MotionCard key={scheme.id} ref={(card) => { cards.current[index] = card; }} scheme={scheme} recommended={proposals.recommended.includes(scheme.id)} slow={slow} />)}
        </div>
        <div className={styles.verdict}><span>Gemini 的建议</span><p>{proposals.recommendation}</p></div>
        <p className={styles.footer}>正式切页已选用 01「极简直达」，点击「返回网站」体验</p>
      </main>
    </div>
  );
}
