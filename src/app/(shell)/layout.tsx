import Image from "next/image";
import Link from "next/link";

import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav";
import { GitHubStars } from "@/components/common/github-stars";
import { NewsletterGate } from "@/components/common/newsletter-gate";
import { NewsletterNavButton } from "@/components/common/newsletter-nav-button";
import { NewsletterPanel } from "@/components/common/newsletter-panel";
import { NewsletterSignup } from "@/components/common/newsletter-signup";
import { SearchButton, SearchDialog } from "@/components/common/site-search";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageToggle } from "@/components/common/language-toggle";

export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col">
      <DocsSidebar />

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/40 bg-background/70 pt-5 pb-4 pl-5 pr-[calc(1.25rem+var(--demo-sbw,0px))] backdrop-blur-xl backdrop-saturate-150 [view-transition-name:docs-mobile-header] lg:hidden">
        <Link href="/" aria-label="Canvas UI home">
          <Image
            src="/logo.svg"
            alt="Canvas UI"
            width={104}
            height={21}
            priority
            className="invert dark:invert-0"
          />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageToggle />
          <NewsletterNavButton mode="scroll" className="grid" />
          <SearchButton />
          <ThemeToggle />
          <GitHubStars />
          <DocsMobileNav />
        </div>
      </div>

      <div className="fixed top-4 right-[calc(1rem+var(--demo-sbw,0px))] z-40 hidden items-center gap-2 rounded-full border border-border/60 bg-background/70 p-1.5 backdrop-blur-xl backdrop-saturate-150 [view-transition-name:docs-controls] lg:flex">
        <LanguageToggle />
        <NewsletterNavButton mode="scroll" className="grid xl:hidden" />
        <NewsletterNavButton />
        <SearchButton />
        <ThemeToggle />
        <GitHubStars />
      </div>

      <SearchDialog />

      <main className="flex-1 px-5 py-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72">
        {children}

        <NewsletterGate>
          <div
            id="newsletter"
            className="mx-auto mt-24 w-full max-w-3xl border-t border-border/60 pt-10 pb-4 xl:hidden"
          >
            <NewsletterSignup />
          </div>
        </NewsletterGate>
      </main>

      <NewsletterPanel />
    </div>
  );
}
