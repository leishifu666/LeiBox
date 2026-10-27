"use client";

import { gsap } from "gsap";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { GrowingPanel } from "@/components/common/growing-panel";
import { ClassicSubmitButton, type SubmissionButtonState } from "@/components/common/classic-submit-button";
import { getContactTrigger, setContactOpen, useContactOpen } from "@/components/common/contact-button";
import { useLanguage } from "@/components/common/language-provider";

const RECIPIENT = "leir0491@gmail.com";
type Status = "idle" | "loading" | "success" | "error";
type Delivery = "checking" | "ready" | "unconfigured" | "unavailable";
type Fields = { name: string; email: string; topic: "message" | "submission"; message: string; url: string; website: string };
type FieldErrors = Partial<Record<"message" | "email" | "url", string>>;
const EMPTY_FIELDS: Fields = { name: "", email: "", topic: "message", message: "", url: "", website: "" };
const INPUT_CLASS = "w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm leading-[21px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground hover:border-foreground/35 focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-60 dark:border-white/35 dark:bg-white/[0.045] dark:hover:border-white/40 dark:focus:border-foreground aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:focus:ring-destructive dark:aria-invalid:border-destructive max-[500px]:text-base motion-reduce:transition-none";
const FIELD_CLASS = "flex items-baseline justify-between gap-2 text-[13px] leading-5 font-medium";
const GROUP_CLASS = "mb-5 flex flex-col gap-2 last:mb-0";

function errorCopy(status: number, error: unknown) {
  if (status === 503) return "Email is unavailable. Please use email instead.";
  if (status === 429) return "Too many messages. Try again later.";
  if (status === 413) return "Message is too long.";
  if (error === "invalid_email") return "Enter a valid email.";
  if (error === "invalid_url") return "Enter a valid http or https link.";
  if (error === "submission_url_required") return "Add a component link.";
  if (error === "invalid_message") return "Use 10–6,000 characters.";
  if (error === "invalid_name") return "Use a name of 80 characters or fewer.";
  return "Could not send. Please try again.";
}

export function ContactPanel() {
  const { t } = useLanguage();
  const open = useContactOpen();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const topicTrackRef = useRef<HTMLFieldSetElement>(null);
  const topicIndicatorRef = useRef<HTMLSpanElement>(null);
  const animateTopicRef = useRef(() => {});
  const closeRef = useRef(() => setContactOpen(false));
  const id = useId();
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [status, setStatus] = useState<Status>("idle");
  const [delivery, setDelivery] = useState<Delivery>("checking");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [validationAttempt, setValidationAttempt] = useState(0);
  const busy = status === "loading";
  const submitState: SubmissionButtonState = delivery === "checking" ? "checking" : delivery !== "ready" ? "unavailable"
    : busy ? "loading" : status === "success" ? "success" : Object.keys(fieldErrors).length ? "invalid" : status;
  const submitLabel = submitState === "checking" ? "Checking…" : busy ? "Sending…" : status === "success" ? "Submitted"
    : submitState === "invalid" ? "Check fields" : status === "error" ? "Retry" : "Submit";

  useEffect(() => {
    if (!open || delivery !== "checking") return;
    const controller = new AbortController();
    let disposed = false;
    const timer = window.setTimeout(() => controller.abort(), 5000);
    void (async () => {
      try {
        const response = await fetch("/api/contact", { cache: "no-store", signal: controller.signal });
        const payload: { available?: unknown } = await response.json();
        if (disposed) return;
        setDelivery(response.ok && typeof payload.available === "boolean" ? payload.available ? "ready" : "unconfigured" : "unavailable");
      } catch {
        if (!disposed) setDelivery("unavailable");
      } finally {
        window.clearTimeout(timer);
      }
    })();
    return () => { disposed = true; window.clearTimeout(timer); controller.abort(); };
  }, [open, delivery]);

  useEffect(() => {
    const track = topicTrackRef.current;
    const indicator = topicIndicatorRef.current;
    if (!open || !track || !indicator) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const context = gsap.context(() => {}, track);
    let timeline: gsap.core.Timeline | undefined;

    const position = (animate: boolean) => {
      const label = track.querySelector<HTMLInputElement>("input:checked")?.parentElement;
      if (!label) return;
      const x = label.offsetLeft - indicator.offsetLeft;
      const width = label.offsetWidth;
      timeline?.kill();
      context.add(() => {
        if (!animate || motion.matches) {
          gsap.set(indicator, { x, width, scaleX: 1, scaleY: 1 });
          return;
        }
        // 保留中途的位移和形变，反向点击时直接接续当前画面。
        timeline = gsap.timeline()
          .to(indicator, { scaleY: 0.85, scaleX: 0.95, duration: 0.15, ease: "power1.out" })
          .to(indicator, { x, width, duration: 0.25, ease: "power2.inOut" }, 0)
          .to(indicator, { scaleY: 1, scaleX: 1, duration: 0.22, ease: "back.out(1.5)" }, 0.15);
      });
    };
    const settle = () => position(false);
    position(false);
    animateTopicRef.current = () => position(true);
    const resize = new ResizeObserver(settle);
    resize.observe(track);
    motion.addEventListener("change", settle);

    return () => {
      animateTopicRef.current = () => {};
      resize.disconnect();
      motion.removeEventListener("change", settle);
      timeline?.kill();
      context.revert();
    };
  }, [open]);

  useEffect(() => {
    animateTopicRef.current();
  }, [fields.topic]);

  const update = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (key === "message") delete next.message;
      if (key === "email") delete next.email;
      if (key === "url" || key === "topic") delete next.url;
      return next;
    });
    if (status === "error" || status === "success") { setStatus("idle"); setError(""); }
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || status === "success" || delivery !== "ready") return;
    const next: FieldErrors = {};
    const message = fields.message.trim();
    const email = fields.email.trim();
    const url = fields.url.trim();
    if (message.length < 10 || message.length > 6000) next.message = message ? "Use 10–6,000 characters." : "Write a message.";
    if (fields.topic === "submission" && !url) next.url = "Add a component link.";
    if (url) {
      try {
        const parsed = new URL(url);
        if (!/^https?:\/\//i.test(url) || !["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
      } catch { next.url = "Enter a valid http or https link."; }
    }
    if (!email || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) next.email = email ? "Enter a valid email." : "Enter your email.";
    setFieldErrors(next);
    if (Object.keys(next).length) {
      setValidationAttempt(current => current + 1);
      if (next.message) messageRef.current?.focus();
      else if (next.url) urlRef.current?.focus();
      else emailRef.current?.focus();
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fields),
      });
      const payload: { ok?: boolean; error?: unknown } = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) {
        setError(errorCopy(response.status, payload.error));
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Could not send. Please try again.");
      setStatus("error");
    }
  }

  const subject = fields.topic === "submission" ? "UI component submission" : "Website message";
  const mailBody = [fields.name && `Name: ${fields.name}`, fields.email && `Reply to: ${fields.email}`, fields.url && `Link: ${fields.url}`, "", fields.message].join("\n");
  const mailto = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;

  return (
    <GrowingPanel
      open={open}
      onOpenChange={setContactOpen}
      trigger={getContactTrigger()}
      triggerSelector='[data-contact-trigger="header"]'
      closeRef={closeRef}
      focusRef={titleRef}
      kind="contact"
      labelledBy={id + "-title"}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-6 py-[18px] dark:border-white/12">
        <h2 ref={titleRef} id={`${id}-title`} tabIndex={-1} className="text-base leading-5 font-semibold outline-none">{t("Contact and submissions")}</h2>
        <button type="button" onClick={() => closeRef.current()} aria-label={t("Close contact form")}
          className="-m-2 grid size-9 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none">
          <X aria-hidden className="size-5" strokeWidth={1.75} />
        </button>
      </header>

      <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          <fieldset ref={topicTrackRef} className="relative isolate mb-6 flex gap-1 rounded-lg bg-muted/80 p-1 dark:bg-white/[0.055]">
            <legend className="sr-only">{t("Message type")}</legend>
            <span ref={topicIndicatorRef} aria-hidden="true" className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-[6px] bg-background/90 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] dark:bg-white/[0.16] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_4px_rgba(0,0,0,0.25)]" />
            {([ ["message", "Message"], ["submission", "Recommend"] ] as const).map(([value, label]) => (
              <label key={value} className="relative z-10 flex-1 cursor-pointer text-center">
                <input type="radio" name="topic" value={value} checked={fields.topic === value} disabled={busy} onChange={() => update("topic", value)} className="peer sr-only" />
                <span className="block rounded-[6px] py-1.5 text-[13.5px] leading-5 font-medium text-muted-foreground transition-colors peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground peer-disabled:opacity-60 motion-reduce:transition-none">{t(label)}</span>
              </label>
            ))}
          </fieldset>

          <div className={GROUP_CLASS}>
            <label htmlFor={`${id}-message`} className={FIELD_CLASS}>{t(fields.topic === "submission" ? "Recommendation" : "Your message")}</label>
            <textarea ref={messageRef} id={`${id}-message`} name="message" rows={3} required minLength={10} maxLength={6000} value={fields.message} disabled={busy} onChange={(event) => update("message", event.target.value)} aria-invalid={fieldErrors.message ? true : undefined} aria-describedby={fieldErrors.message ? `${id}-message-error` : undefined} className={`${INPUT_CLASS} scrollbar-none min-h-[100px] max-h-80 resize-y`} />
            {fieldErrors.message ? <p id={`${id}-message-error`} role="alert" className="text-xs leading-5 text-destructive">{t(fieldErrors.message)}</p> : null}
          </div>

          <div className={GROUP_CLASS}>
            <label htmlFor={`${id}-url`} className={FIELD_CLASS}>
              <span>{t(fields.topic === "submission" ? "Component link" : "Reference link")}</span>
              {fields.topic === "message" ? <span className="text-xs font-normal text-muted-foreground">{t("Optional")}</span> : null}
            </label>
            <input ref={urlRef} id={`${id}-url`} name="url" type="url" inputMode="url" required={fields.topic === "submission"} placeholder="https://" maxLength={2048} value={fields.url} disabled={busy} onChange={(event) => update("url", event.target.value)} aria-invalid={fieldErrors.url ? true : undefined} aria-describedby={fieldErrors.url ? `${id}-url-error` : undefined} className={INPUT_CLASS} />
            {fieldErrors.url ? <p id={`${id}-url-error`} role="alert" className="text-xs leading-5 text-destructive">{t(fieldErrors.url)}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4 max-[500px]:grid-cols-1 max-[500px]:gap-0">
            <div className={GROUP_CLASS}>
              <label htmlFor={`${id}-email`} className={FIELD_CLASS}>{t("Your email")}</label>
              <input ref={emailRef} id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} placeholder="name@example.com" value={fields.email} disabled={busy} onChange={(event) => update("email", event.target.value)} aria-invalid={fieldErrors.email ? true : undefined} aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined} className={INPUT_CLASS} />
              {fieldErrors.email ? <p id={`${id}-email-error`} role="alert" className="text-xs leading-5 text-destructive">{t(fieldErrors.email)}</p> : null}
            </div>
            <div className={GROUP_CLASS}>
              <label htmlFor={`${id}-name`} className={FIELD_CLASS}><span>{t("Your name")}</span><span className="text-xs font-normal text-muted-foreground">{t("Optional")}</span></label>
              <input id={`${id}-name`} name="name" autoComplete="name" maxLength={80} value={fields.name} disabled={busy} onChange={(event) => update("name", event.target.value)} className={INPUT_CLASS} />
            </div>
          </div>

          <div hidden aria-hidden="true">
            <label htmlFor={`${id}-website`}>Website</label>
            <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(event) => update("website", event.target.value)} />
          </div>
          {error ? <p role="alert" className="mt-3 text-xs leading-5 text-destructive">{t(error)}</p> : null}
          {delivery === "unconfigured" ? <p role="status" className="mt-3 text-xs leading-5 text-muted-foreground">{t("Contact email is not configured yet. Please use the email link below.")}</p> : null}
          {delivery === "unavailable" ? <p role="status" className="mt-3 text-xs leading-5 text-muted-foreground">{t("Email is unavailable. Please use email instead.")}</p> : null}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-background/20 px-6 py-4 dark:border-white/12 dark:bg-white/[0.025] max-[500px]:pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <a href={mailto} className="rounded-lg text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none">{t("Use email")}</a>
          <span role="status" aria-live="polite" className="sr-only">{busy ? t("Sending…") : status === "success" ? t("Message submitted") : ""}</span>
          <ClassicSubmitButton type="submit" state={submitState} feedbackVersion={validationAttempt} active={open}
            disabled={busy || status === "success" || delivery !== "ready"}>{t(submitLabel)}</ClassicSubmitButton>
        </footer>
      </form>
    </GrowingPanel>
  );
}
