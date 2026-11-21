"use client";

import { Bookmark, MessageCircle, Plus, Share2 } from "lucide-react";
import {
  useEffect, useId, useRef, useState,
  type CSSProperties, type FocusEvent, type PointerEvent,
} from "react";

const actions = [
  { id: "message", x: -63, y: -38, en: "Message", zh: "消息", Icon: MessageCircle },
  { id: "bookmark", x: 0, y: -68, en: "Bookmark", zh: "收藏", Icon: Bookmark },
  { id: "share", x: 63, y: -38, en: "Share", zh: "分享", Icon: Share2 },
] as const;

type Action = (typeof actions)[number]["id"];

export type MetaballMenuProps = {
  autoplay?: boolean;
  defaultOpen?: boolean;
  reducedMotion?: boolean;
  locale?: "en" | "zh";
  onAction?: (action: Action) => void;
  className?: string;
};

const styles = `
.metaball-menu {
  position: relative;
  flex: none;
  width: 220px;
  height: 144px;
  isolation: isolate;
  --metaball-duration: 550ms;
}
.metaball-menu[data-reduced-motion="true"] { --metaball-duration: 0ms; }
@media (prefers-reduced-motion: reduce) {
  .metaball-menu { --metaball-duration: 0ms; }
}
.mb-shapes { position: absolute; inset: 0; display: block; pointer-events: none; }
.mb-flood { flood-color: var(--metaball-fill, #181818); }
.metaball-menu .mb-move {
  transform: translate(0, 0);
  transition: transform var(--metaball-duration) cubic-bezier(.25, .8, .25, 1);
}
.metaball-menu[data-open="true"] .mb-move { transform: translate(var(--mb-x), var(--mb-y)); }
.metaball-menu .mb-button {
  position: absolute;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--metaball-ink, #fff);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.metaball-menu .mb-button:focus-visible { outline: 2px solid var(--metaball-fill, #181818); outline-offset: 5px; }
.metaball-menu .mb-action { z-index: 1; width: 44px; height: 44px; left: 88px; top: 82px; }
.metaball-menu .mb-trigger { z-index: 2; width: 54px; height: 54px; left: 83px; top: 77px; }
.metaball-menu .mb-action[disabled] { visibility: hidden; pointer-events: none; }
.metaball-menu .mb-plus { transition: transform var(--metaball-duration) cubic-bezier(.25, .8, .25, 1); }
.metaball-menu[data-open="true"] .mb-plus { transform: rotate(45deg); }
`;

const offset = ({ x, y }: (typeof actions)[number]) => ({
  "--mb-x": `${x}px`,
  "--mb-y": `${y}px`,
}) as CSSProperties;

export function MetaballMenu({
  autoplay = true, defaultOpen = false, reducedMotion, locale = "en", onAction, className,
}: MetaballMenuProps) {
  const filterId = useId();
  const host = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [visible, setVisible] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const zh = locale === "zh";
  const reduce = systemReduced || reducedMotion === true;

  useEffect(() => {
    const element = host.current!;
    const document = element.ownerDocument;
    const preference = document.defaultView!.matchMedia("(prefers-reduced-motion: reduce)");
    let intersecting = false;
    const updateVisibility = () => setVisible(intersecting && !document.hidden);
    const readPreference = () => setSystemReduced(preference.matches);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      updateVisibility();
    }, { threshold: 0.25 });
    observer.observe(element);
    readPreference();
    preference.addEventListener("change", readPreference);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", readPreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!autoplay || !visible || pointerInside || focusInside || reduce) return;
    const timer = window.setTimeout(() => setOpen(!open), open ? 1800 : 1250);
    return () => window.clearTimeout(timer);
  }, [autoplay, visible, pointerInside, focusInside, reduce, open]);

  function close() {
    if (host.current?.matches(":focus-within")) trigger.current?.focus();
    setOpen(false);
  }

  function enter(event: PointerEvent<HTMLDivElement>) {
    setPointerInside(true);
    if (event.pointerType === "mouse") close();
  }

  function blur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
  }

  return (
    <div
      ref={host}
      className={className ? `metaball-menu ${className}` : "metaball-menu"}
      data-open={open}
      data-reduced-motion={reduce}
      onPointerEnter={enter}
      onPointerLeave={() => setPointerInside(false)}
      onFocus={() => setFocusInside(true)}
      onBlur={blur}
      onKeyDown={event => {
        if (open && event.key === "Escape") {
          event.stopPropagation();
          close();
        }
      }}
    >
      <style>{styles}</style>
      <svg className="mb-shapes" width="220" height="144" viewBox="-110 -104 220 144" aria-hidden="true">
        <defs>
          <filter id={filterId} filterUnits="userSpaceOnUse" x="-110" y="-104" width="220" height="144">
            <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="blurred" />
            <feColorMatrix in="blurred" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -11" result="silhouette" />
            <feFlood className="mb-flood" result="ink" />
            <feComposite in="ink" in2="silhouette" operator="in" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <circle r="27" />
          {actions.map(action => <circle key={action.id} className="mb-move" style={offset(action)} r="22" />)}
        </g>
      </svg>
      <button
        ref={trigger}
        type="button"
        className="mb-button mb-trigger"
        aria-label={open ? (zh ? "收起快捷操作" : "Close quick actions") : (zh ? "展开快捷操作" : "Open quick actions")}
        aria-controls={`${filterId}-actions`}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <Plus className="mb-plus" size={23} strokeWidth={2} aria-hidden="true" />
      </button>
      <div id={`${filterId}-actions`} role="group" aria-label={zh ? "快捷操作" : "Quick actions"} aria-hidden={!open}>
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            className="mb-button mb-move mb-action"
            style={offset(action)}
            aria-label={zh ? action.zh : action.en}
            disabled={!open}
            onClick={() => {
              close();
              onAction?.(action.id);
            }}
          >
            <action.Icon size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
