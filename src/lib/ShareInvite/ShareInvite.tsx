"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { Check, ChevronsUpDown, Link, LoaderCircle, Mail, Send, Share, X } from "lucide-react";
import { SHARE_MOTION, springEase } from "./share-motion";
import { Select } from "@base-ui/react/select";
import "./share-invite.css";

type InviteRole = "Editor" | "Viewer";
type Person = { name: string; initials: string; role: InviteRole | "Owner"; email?: string; tone: string };
type Recipient = { email: string; role: InviteRole };
type SendState = "idle" | "sending" | "sent";

const INITIAL_PEOPLE: Person[] = [
  { name: "Ava Chen", initials: "AC", role: "Owner", tone: "sand" },
  { name: "Marco Rossi", initials: "MR", role: "Editor", tone: "sage" },
  { name: "Lena Park", initials: "LP", role: "Viewer", tone: "lilac" },
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

function personFromRecipient({ email, role }: Recipient): Person {
  const localName = email.split("@")[0];
  const words = localName.split(/[._+-]+/).filter(Boolean);
  const name = words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  const initials = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join("") : localName.slice(0, 2);
  return { name, initials: initials.toUpperCase(), role, email, tone: "wheat" };
}

export function ShareInvite({ locale = "en" }: { locale?: "zh" | "en" }) {
  const id = useId();
  const panelId = id + "-panel";
  const errorId = id + "-error";
  const peopleId = id + "-people";
  const t = (text: string) => locale === "zh" ? (COPY[text] ?? text) : text;
  const [stageWidth, setStageWidth] = useState(352);
  const stageRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shareRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | undefined>(undefined);
  const resizeTweenRef = useRef<gsap.core.Tween | undefined>(undefined);
  const previousOpenRef = useRef<boolean | undefined>(undefined);
  const previousWidthRef = useRef<number | undefined>(undefined);
  const transfersRef = useRef<{ email: string; element: HTMLElement }[]>([]);
  const transferTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sendingRef = useRef(false);
  const previousCount = useRef(INITIAL_PEOPLE.length);
  const previousRecipientCount = useRef(0);
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("Editor");
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const canSend = recipients.length > 0 || isEmail(email);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    const observer = new ResizeObserver(() => {
      if (stageRef.current) setStageWidth(stageRef.current.clientWidth);
    });
    if (stageRef.current) observer.observe(stageRef.current);
    query.addEventListener("change", update);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", update);
      timelineRef.current?.kill();
      resizeTweenRef.current?.kill();
      transferTimelineRef.current?.kill();
      transfersRef.current.forEach(({ element }) => element.remove());
      clearTimeout(copyTimerRef.current);
      clearTimeout(sendTimerRef.current);
    };
  }, []);

  // One sizing owner for both view changes and content changes. A second
  // layout tween used to overwrite the opening height's motion on every open.
  useLayoutEffect(() => {
    const shell = shellRef.current;
    const panel = panelRef.current;
    const compact = compactRef.current;
    if (!shell || !panel || !compact) return;
    const panelWidth = Math.max(240, Math.min(320, stageWidth - 12));
    const morph = {
      left: open ? 8 : 96, top: open ? 8 : 5,
      width: open ? panelWidth - 74 : 99, height: open ? 48 : 44,
      paddingLeft: open ? 16 : 15, gap: open ? 10 : 8,
      fontSize: open ? 16 : 14, fontWeight: open ? 600 : 500,
      color: open ? "#23231f" : "#ffffff", backgroundColor: open ? "#ecebe4" : "#20211d",
    };
    const widthChanged = previousWidthRef.current !== panelWidth;
    previousWidthRef.current = panelWidth;
    // offsetHeight measures layout; scrollHeight also includes the translated
    // entrance items and makes quick reversals accumulate extra card height.
    const targetHeight = open ? panel.offsetHeight + 2 : 56;
    const focusWasInside = shell.contains(document.activeElement);
    panel.toggleAttribute("inert", !open);
    compact.toggleAttribute("inert", open);
    const initialRender = previousOpenRef.current === undefined;
    const viewChanged = previousOpenRef.current !== open;
    previousOpenRef.current = open;

    if (initialRender || reduceMotion) {
      timelineRef.current?.kill();
      resizeTweenRef.current?.kill();
      gsap.set(shell, { width: open ? panelWidth : 200, height: targetHeight, borderRadius: open ? 32 : 30 });
      gsap.set(compact, { autoAlpha: open ? 0 : 1, scale: 1 });
      gsap.set(panel, { autoAlpha: open ? 1 : 0, filter: "blur(0px)" });
      gsap.set(panel.querySelectorAll("[data-reveal]"), { opacity: 1, y: 0, filter: "blur(0px)" });
      gsap.set(shareRef.current, morph);
      if (focusWasInside && viewChanged && !initialRender) (open ? closeRef : shareRef).current?.focus({ preventScroll: true });
      return;
    }

    if (!viewChanged) {
      if (widthChanged) {
        gsap.set(shell, { width: open ? panelWidth : 200 });
        gsap.set(shareRef.current, morph);
      }
      // Retarget only height during a content update. An in-flight opening's
      // width and reveal sequence keep running instead of being restarted.
      resizeTweenRef.current?.kill();
      gsap.killTweensOf(shell, "height");
      const { stiffness, damping, duration } = SHARE_MOTION.resize;
      resizeTweenRef.current = gsap.to(shell, {
        height: targetHeight, duration, ease: springEase(stiffness, damping, duration),
      });
      return;
    }

    resizeTweenRef.current?.kill();
    timelineRef.current?.kill();
    const timeline = gsap.timeline();
    timelineRef.current = timeline;
    const motion = open ? SHARE_MOTION.open : SHARE_MOTION.close;
    timeline.to(shell, {
      width: open ? panelWidth : 200,
      duration: motion.width.duration,
      ease: springEase(motion.width.stiffness, motion.width.damping, motion.width.duration),
      overwrite: "auto",
    }, motion.width.delay);
    timeline.to(shell, {
      height: targetHeight,
      duration: motion.height.duration,
      ease: springEase(motion.height.stiffness, motion.height.damping, motion.height.duration),
      overwrite: "auto",
    }, motion.height.delay);
    timeline.to(shell, { borderRadius: open ? 32 : 30, duration: 0.22, ease: "power2.out" }, 0);
    timeline.to(shareRef.current, {
      ...morph, duration: motion.width.duration,
      ease: springEase(motion.width.stiffness, motion.width.damping, motion.width.duration),
    }, motion.width.delay);
    timeline.to(compact, {
      autoAlpha: open ? 0 : 1,
      duration: 0.14,
      ease: "power2.out",
    }, open ? 0 : 0.35);
    if (!open) timeline.fromTo(compact, { scale: 0.95 }, {
      scale: 1, duration: 0.48, ease: springEase(300, 21, 0.48),
    }, 0.35);
    timeline.to(panel, {
      autoAlpha: open ? 1 : 0,
      filter: open ? "blur(0px)" : "blur(5px)",
      duration: open ? 0.24 : 0.18,
      ease: "power2.out",
    }, open ? 0.12 : 0);
    if (open) {
      timeline.fromTo(panel.querySelectorAll("[data-reveal]"),
        { opacity: 0, y: 10, filter: "blur(3px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5,
          stagger: 0.035, ease: springEase(280, 24, 0.5) }, 0.13);
    }
    if (focusWasInside) timeline.call(() => (open ? closeRef : shareRef).current?.focus({ preventScroll: true }), [], 0.36);
  }, [open, reduceMotion, recipients.length, people.length, error, stageWidth]);

  // Press feedback is confined to pointer-down/up; hover never moves a button.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduceMotion) return;
    let pressed: HTMLElement | null = null;
    const tweens = new Map<HTMLElement, gsap.core.Tween>();
    const release = () => {
      if (!pressed) return;
      const button = pressed;
      pressed = null;
      tweens.get(button)?.kill();
      tweens.set(button, gsap.to(button, { scale: 1, duration: 0.42, ease: springEase(420, 24, 0.42) }));
    };
    const press = (event: PointerEvent) => {
      const button = (event.target as Element).closest<HTMLElement>(".role-trigger");
      if (!button || button.matches(":disabled")) return;
      release();
      pressed = button;
      tweens.get(button)?.kill();
      tweens.set(button, gsap.to(button, { scale: 0.965, duration: 0.08, ease: "power2.out" }));
    };
    stage.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      stage.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      tweens.forEach((tween, button) => { tween.kill(); gsap.set(button, { clearProps: "transform" }); });
    };
  }, [reduceMotion]);

  // List entrances animate content only; shell sizing stays in the effect above.
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const newRows = [...panelRef.current.querySelectorAll(".person-row")].slice(previousCount.current);
    previousCount.current = people.length;
    const moving = transfersRef.current;
    transferTimelineRef.current?.kill();
    const transferTimeline = gsap.timeline({ onInterrupt: () => moving.forEach(({ element }) => element.remove()) });
    transferTimelineRef.current = transferTimeline;
    for (const { email: recipientEmail, element } of moving) {
      const row = newRows.find((item) => (item as HTMLElement).dataset.email === recipientEmail);
      if (!row || !stageRef.current || reduceMotion) { element.remove(); continue; }
      const target = row.querySelector(".avatar")!.getBoundingClientRect();
      const stage = stageRef.current.getBoundingClientRect();
      transferTimeline.to(element, { left: target.left - stage.left, top: target.top - stage.top,
        width: 32, height: 32, padding: 0, borderRadius: 16, duration: 0.6,
        ease: springEase(300, 24, 0.6), onComplete: () => element.remove() }, 0);
      transferTimeline.to(element.querySelectorAll(".chip-email, .chip-remove"), { opacity: 0, duration: 0.15 }, 0);
      transferTimeline.to(element.querySelector(".chip-avatar"), { width: 32, height: 32, fontSize: 11, duration: 0.4 }, 0);
    }
    transfersRef.current = [];
    const entrance = newRows.length ? gsap.fromTo(newRows,
      { opacity: 0, y: -10, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", delay: moving.length && !reduceMotion ? 0.2 : 0,
        duration: reduceMotion ? 0 : 0.54, stagger: 0.05, ease: springEase(300, 24, 0.54) }) : null;
    const newChips = [...panelRef.current.querySelectorAll(".recipient-chip")].slice(previousRecipientCount.current);
    previousRecipientCount.current = recipients.length;
    const chipEntrance = newChips.length ? gsap.fromTo(newChips,
      { opacity: 0, y: -5, scale: 0.96, filter: "blur(2px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: reduceMotion ? 0 : 0.42, stagger: 0.04, ease: springEase(360, 24, 0.42) }) : null;
    return () => { entrance?.kill(); chipEntrance?.kill(); };
  }, [recipients, people, error, open, reduceMotion]);

  useEffect(() => {
    if (sendState !== "sending" || !actionRef.current || reduceMotion) return;
    const spinner = actionRef.current.querySelector(".sending-spinner");
    const tween = gsap.to(spinner, { rotation: 360, duration: 0.8, repeat: -1, ease: "none" });
    return () => { tween.kill(); };
  }, [sendState, reduceMotion]);

  function stageRecipient(): boolean {
    const value = email.trim().toLowerCase();
    if (!value) return true;
    if (!isEmail(value)) { setError("Enter a valid email address"); return false; }
    if (people.some((person) => person.email === value) || recipients.some((recipient) => recipient.email === value)) {
      setError("This person already has access or is in your invite list"); return false;
    }
    setRecipients((current) => [...current, { email: value, role }]);
    setEmail("");
    setError("");
    return true;
  }

  function sendInvite() {
    if (!canSend || sendingRef.current) return;
    const currentEmail = email.trim().toLowerCase();
    if (currentEmail && !stageRecipient()) return;
    const invites = [...recipients, ...(currentEmail ? [{ email: currentEmail, role }] : [])];
    if (!invites.length) return;
    sendingRef.current = true;
    setSendState("sending");
    setError("");
    sendTimerRef.current = setTimeout(() => {
      if (stageRef.current && panelRef.current && !reduceMotion) {
        const stage = stageRef.current.getBoundingClientRect();
        transfersRef.current = [...panelRef.current.querySelectorAll<HTMLElement>(".recipient-chip")].map((chip) => {
          const rect = chip.getBoundingClientRect();
          const element = chip.cloneNode(true) as HTMLElement;
          element.classList.add("share-transfer");
          element.setAttribute("aria-hidden", "true");
          element.inert = true;
          Object.assign(element.style, { left: `${rect.left-stage.left}px`, top: `${rect.top-stage.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
          stageRef.current!.appendChild(element);
          return { email: chip.dataset.email!, element };
        });
      }
      setPeople((current) => [...current, ...invites.map(personFromRecipient)]);
      setRecipients([]);
      setSendState("sent");
      setAnnouncement("Invitations added to this preview");
      sendingRef.current = false;
      sendTimerRef.current = setTimeout(() => setSendState("idle"), 1400);
    }, reduceMotion ? 200 : 1050);
  }

  async function copyLink() {
    clearTimeout(copyTimerRef.current);
    try {
      const url = new URL(window.location.href);
      url.search = "";
      url.hash = "q4-plan";
      await navigator.clipboard.writeText(url.href);
      setCopyState("copied");
      setAnnouncement("Link copied to clipboard");
    } catch {
      setCopyState("error");
      setAnnouncement("Clipboard unavailable. Allow clipboard access and try again.");
    }
    copyTimerRef.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div translate="no" className="leibox-share notranslate share-stage" ref={stageRef} style={{ "--share-width": `${Math.max(240, Math.min(320, stageWidth - 12))}px` } as CSSProperties}>
      <div className="share-shell" ref={shellRef} data-open={open}>
        <div className="share-compact" ref={compactRef} aria-hidden={open}>
          <div className="avatar-stack" aria-label={`${people.length} people with access`}>
            {people.slice(0, 3).map((person) => <span key={person.name} className={`avatar avatar-${person.tone}`}>{person.initials}</span>)}
            {people.length > 3 && <span className="avatar avatar-extra">+{people.length - 3}</span>}
          </div>
        </div>

        <button type="button" className="title-pill share-morph" ref={shareRef} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={panelId}>
          <Share aria-hidden="true" /><span className="share-title">{t(open ? "Share “Q4 Plan”" : "Share")}</span>
        </button>

        <div className="share-panel" id={panelId} ref={panelRef} aria-hidden={!open}
          onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) setOpen(false); }}>
          <header className="share-header" data-reveal>
            <div className="title-slot" aria-hidden="true" />
            <button type="button" className="share-button close-button" ref={closeRef} aria-label={t("Close share panel")} onClick={() => setOpen(false)}><X aria-hidden="true" /></button>
          </header>

          <form className="invite-form" onSubmit={(event) => { event.preventDefault(); if (sendState !== "sending") stageRecipient(); }} noValidate>
            <div className="invite-field" data-reveal>
              <Mail className="mail-icon" aria-hidden="true" />
              <input ref={inputRef} className="email-input" type="email" aria-label={t("Add people by email")} placeholder={t("Add people by email")}
                value={email} disabled={sendState === "sending"} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
                autoComplete="off" spellCheck={false}
                onChange={(event) => { setEmail(event.target.value); setError(""); if (sendState === "sent") setSendState("idle"); }}
                onKeyDown={(event) => {
                  if (["Enter", ",", ";"].includes(event.key)) { event.preventDefault(); stageRecipient(); }
                  if (event.key === "Escape") { event.stopPropagation(); setOpen(false); }
                }}
                onPaste={(event) => {
                  const values = event.clipboardData.getData("text").split(/[\s,;]+/).filter(Boolean);
                  if (values.length < 2) return;
                  event.preventDefault();
                  if (!values.every(isEmail)) { setError("Enter valid email addresses separated by commas"); return; }
                  const existing = new Set([...people.map((person) => person.email), ...recipients.map((recipient) => recipient.email)]);
                  const unique = [...new Set(values.map((value) => value.toLowerCase()))].filter((value) => !existing.has(value));
                  setRecipients((current) => [...current, ...unique.map((value) => ({ email: value, role }))]);
                  setEmail(""); setError("");
                }} />
              <Select.Root value={role} onValueChange={(value) => { if (value) setRole(value); }}>
                <Select.Trigger className="role-trigger" aria-label={t("Invitation role")} disabled={sendState === "sending"}>
                  <Select.Value>{t(role)}</Select.Value><ChevronsUpDown aria-hidden="true" className="role-chevrons" />
                </Select.Trigger>
                <Select.Portal container={stageRef}><Select.Positioner className="role-positioner" align="end" sideOffset={6} alignItemWithTrigger={false}><Select.Popup className="role-menu"><Select.List>
                  <Select.Item className="role-option" value="Editor"><Select.ItemIndicator><Check aria-hidden="true" /></Select.ItemIndicator><Select.ItemText>{t("Editor")}</Select.ItemText></Select.Item>
                  <Select.Item className="role-option" value="Viewer"><Select.ItemIndicator><Check aria-hidden="true" /></Select.ItemIndicator><Select.ItemText>{t("Viewer")}</Select.ItemText></Select.Item>
                </Select.List></Select.Popup></Select.Positioner></Select.Portal>
              </Select.Root>
            </div>
            {recipients.length > 0 && <div className="recipient-chips" aria-label={t("Pending invitations")}>
              {recipients.map((recipient) => <div className="recipient-chip" key={recipient.email} data-email={recipient.email} title={`${recipient.email} · ${recipient.role}`}>
                <span className="avatar avatar-wheat chip-avatar">{`${recipient.email[0]}${recipient.email.split("@")[1][0]}`.toUpperCase()}</span>
                <span className="chip-email">{recipient.email}</span>
                <button type="button" className="share-button chip-remove" aria-label={`${t("Remove")} ${recipient.email}`} disabled={sendState === "sending"}
                  onClick={() => setRecipients((current) => current.filter((item) => item.email !== recipient.email))}><X aria-hidden="true" /></button>
              </div>)}
            </div>}
            {error && <p className="invite-error" id={errorId} role="alert">{t(error)}</p>}
          </form>

          <section className="people-section" aria-labelledby={peopleId} data-reveal>
            <h2 id={peopleId}>{t("People with access")}</h2>
            <ul className="people-list">
              {people.map((person) => <li className="person-row" key={person.email ?? person.name} data-email={person.email}>
                <span className={`avatar avatar-${person.tone}`} aria-hidden="true">{person.initials}</span>
                <span className="person-name" title={person.email}>{person.name}</span>
                <span className="person-role">{t(person.role)}</span>
              </li>)}
            </ul>
          </section>

          <footer className="share-actions" data-reveal>
            <button type="button" className={`share-button copy-button ${copyState === "copied" ? "is-copied" : ""}`} onClick={copyLink}>
              {copyState === "copied" ? <Check aria-hidden="true" /> : <Link aria-hidden="true" />}
              <span>{t(copyState === "copied" ? "Copied" : copyState === "error" ? "Try again" : "Copy link")}</span>
            </button>
            <button type="button" className="share-button send-button" ref={actionRef} disabled={!canSend || sendState !== "idle"} data-state={sendState} onClick={sendInvite}>
              {sendState === "sending" ? <LoaderCircle className="sending-spinner" aria-hidden="true" /> : sendState === "sent" ? <Check aria-hidden="true" /> : <Send aria-hidden="true" />}
              <span>{t(sendState === "sending" ? "Sending" : sendState === "sent" ? "Invite sent" : "Send invite")}</span>
            </button>
          </footer>
        </div>
      </div>
      <button type="button" className="demo-signature" onClick={() => setOpen((value) => !value)} aria-label={t(open ? "Collapse share panel" : "Expand share panel")}>
        <span>{t(open ? "close" : "open")}</span><span aria-hidden="true">⟶</span><span aria-hidden="true">{`{}`}</span>
      </button>
      <p className="sr-only" role="status" aria-live="polite">{t(announcement)}</p>
    </div>
  );
}

const COPY: Record<string, string> = {
  "Share “Q4 Plan”": "分享“第四季度计划”", "Share": "分享", "Close share panel": "关闭分享面板",
  "Add people by email": "输入邮箱邀请成员", "Invitation role": "邀请权限", "Editor": "可编辑", "Viewer": "仅查看", "Owner": "所有者",
  "People with access": "拥有访问权限的成员", "Pending invitations": "待邀请成员", "Remove": "移除",
  "Copy link": "复制链接", "Copied": "已复制", "Try again": "重试", "Send invite": "发送邀请", "Sending": "发送中", "Invite sent": "已添加",
  "Collapse share panel": "收起分享面板", "Expand share panel": "展开分享面板", "close": "收起", "open": "展开",
  "Enter a valid email address": "请输入有效的邮箱地址", "This person already has access or is in your invite list": "该成员已拥有权限或已在邀请列表中",
  "Enter valid email addresses separated by commas": "请输入有效邮箱，多个邮箱用逗号分隔",
  "Invitations added to this preview": "成员已添加到本地演示", "Link copied to clipboard": "链接已复制",
  "Clipboard unavailable. Allow clipboard access and try again.": "无法访问剪贴板，请允许访问后重试",
};
