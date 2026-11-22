"use client";

import { useLanguage } from "@/components/common/language-provider";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SiteLogo } from "@/components/common/site-logo";
import { DocsNavList } from "@/components/docs/docs-sidebar";

export function DocsMobileNav() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const opener = trigger.current;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const links = [...(dialog.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? [])]
        .filter(element => !element.closest("[inert]") && element.getClientRects().length > 0);
      if (!links?.length) return;
      const first = links[0];
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.removeProperty("overflow");
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={trigger}
        type="button"
        aria-label={t("Open docs navigation")}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid size-8 place-items-center rounded-full border border-border/70 text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 motion-reduce:transition-none"
      >
        <Menu aria-hidden className="size-[17px]" />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={dialog}
                role="dialog"
                aria-modal="true"
                aria-label={t("Docs navigation")}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="fixed inset-0 z-60 flex flex-col bg-background lg:hidden"
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <SiteLogo />
                  <button
                    ref={closeButton}
                    type="button"
                    aria-label={t("Close docs navigation")}
                    onClick={() => setOpen(false)}
                    className="grid size-8 place-items-center rounded-full border border-border/70 text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 motion-reduce:transition-none"
                  >
                    <X aria-hidden className="size-[17px]" />
                  </button>
                </div>

                <nav
                  aria-label={t("Docs")}
                  className="flex-1 overflow-y-auto pr-4 pb-5 pl-3"
                >
                  <DocsNavList onNavigate={() => setOpen(false)} />
                </nav>

              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
