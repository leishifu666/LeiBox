"use client";

import { T, useLanguage } from "@/components/common/language-provider";
import Link from "next/link";
import { SiteLogo } from "@/components/common/site-logo";



const columns = [
  {
    title: "Navigate",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/components", label: "Components" },
      { href: "/docs/installation", label: "Installation" },
    ],
  },
];


export function Footer({
  variant = "landing",
}: {
  variant?: "landing" | "docs";
}) {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto">
      <div
        className={
          variant === "docs"
            ? "w-full"
            : "mx-auto w-full max-w-6xl px-5 sm:px-8"
        }
      >
        <div className="grid grid-cols-1 gap-12 pt-14 pb-16 sm:grid-cols-[1fr_auto] sm:gap-20">
          <div className="flex flex-col items-start">
            <Link
              href="/"
              aria-label={t("LeiBox home")}
              className="transition-opacity duration-150 hover:opacity-70"
            >
              <SiteLogo />
            </Link>
            <p className="mt-5 max-w-56 text-sm leading-6 text-muted-foreground"><T>
              A personal box of UI ideas, interaction details, and components
              worth keeping. Curated by Lei Shifu.
            </T></p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={t(column.title)}>
              <h3 className="text-sm font-medium text-foreground">
                <T>{column.title}</T>
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        <T>{link.label}</T>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        <T>{link.label}</T>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border/40 py-6">
          <p className="text-[13px] text-muted-foreground">
            © {new Date().getFullYear()}<T> LeiBox. Curated by</T>{" "}
            <a
              href="https://github.com/leishifu666"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4 decoration-border transition-colors duration-150 hover:decoration-foreground"
            ><T>Lei Shifu</T></a>
          </p>
          <Link
            href="/privacy"
            className="text-[13px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          ><T>
            Privacy
          </T></Link>
        </div>
      </div>
    </footer>
  );
}
