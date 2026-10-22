import Link from "next/link";

import { GitHubStars } from "@/components/common/github-stars";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { SearchButton, SearchDialog } from "@/components/common/site-search";
import { SiteLogo } from "@/components/common/site-logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageToggle } from "@/components/common/language-toggle";
import { T } from "@/components/common/language-provider";

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/components", label: "Components" },
  { href: "/playground", label: "Playground" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <nav
        aria-label="Main"
        className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8"
      >
        <Link
          href="/"
          aria-label="Canvas UI home"
          className="col-start-1 justify-self-start transition-opacity duration-150 hover:opacity-70"
        >
          <SiteLogo />
        </Link>

        <ul className="col-start-2 hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                <T>{link.label}</T>
              </Link>
            </li>
          ))}
        </ul>

        <div className="col-start-3 flex items-center gap-2 justify-self-end">
          <LanguageToggle />
          <SearchButton />
          <ThemeToggle />
          <GitHubStars />
          <MobileMenu />
        </div>
      </nav>

      <SearchDialog />
    </header>
  );
}
