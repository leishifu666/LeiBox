"use client";

import { T, useLanguage } from "@/components/common/language-provider";


import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/components", label: "Components" },
];

export function MobileMenu() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t(open ? "Close menu" : "Open menu")}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="grid size-8 place-items-center rounded-full border border-border/70 text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 motion-reduce:transition-none"
      >
        <Menu
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 size-[18px] transition-[opacity,filter] duration-200 ease-out motion-reduce:transition-none",
            open ? "opacity-0 blur-[3px]" : "opacity-100 blur-none",
          )}
        />
        <X
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 size-[18px] transition-[opacity,filter] duration-200 ease-out motion-reduce:transition-none",
            open ? "opacity-100 blur-none" : "opacity-0 blur-[3px]",
          )}
        />
      </button>

      <div
        inert={!open}
        aria-hidden={!open}
        className={cn(
          "absolute inset-x-0 top-full border-b border-border/60 bg-background shadow-lg shadow-black/5 transition-[opacity,transform] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:shadow-black/20",
          open
            ? "translate-y-0 opacity-100 duration-300"
            : "pointer-events-none -translate-y-1.5 opacity-0 duration-150",
        )}
      >
        <ul className="flex flex-col px-3 py-3">
          {links.map((link, i) => (
            <li
              key={link.href}
              style={{ transitionDelay: open ? `${40 + i * 35}ms` : "0ms" }}
              className={cn(
                "transition-[opacity,transform] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                open
                  ? "translate-y-0 opacity-100 duration-250"
                  : "-translate-y-1 opacity-0 duration-150",
              )}
            >
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <T>{link.label}</T>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
