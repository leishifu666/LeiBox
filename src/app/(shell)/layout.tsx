import Link from "next/link";

import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav";
import { GitHubStars } from "@/components/common/github-stars";
import { ContactCard } from "@/components/common/contact-card";
import { ContactButton } from "@/components/common/contact-button";
import { ContactPanel } from "@/components/common/contact-panel";
import { SiteLogo } from "@/components/common/site-logo";
import { SearchButton, SearchDialog } from "@/components/common/site-search";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageToggle } from "@/components/common/language-toggle";
import { ScrollHideHeader } from "@/components/common/scroll-hide-header";

export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col">
      <DocsSidebar />

      <ScrollHideHeader className="sticky top-0 z-40 flex items-center justify-between border-b border-border/40 bg-background/70 pt-5 pb-4 pl-5 pr-[calc(1.25rem+var(--demo-sbw,0px))] backdrop-blur-xl backdrop-saturate-150 [view-transition-name:docs-mobile-header] lg:hidden">
        <Link href="/" aria-label="LeiBox home">
          <SiteLogo navigation />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageToggle />
          <ContactButton />
          <SearchButton />
          <ThemeToggle />
          <GitHubStars />
          <DocsMobileNav />
        </div>
      </ScrollHideHeader>

      <ScrollHideHeader className="fixed top-4 right-[calc(1rem+var(--demo-sbw,0px))] z-40 hidden items-center gap-2 rounded-full border border-border/60 bg-background/70 p-1.5 backdrop-blur-xl backdrop-saturate-150 [view-transition-name:docs-controls] lg:flex">
        <LanguageToggle />
        <ContactButton />
        <SearchButton />
        <ThemeToggle />
        <GitHubStars />
      </ScrollHideHeader>

      <SearchDialog />

      <main data-component-entry-state="idle" className="flex-1 px-5 py-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72">
        {children}

          <div
            id="contact"
            className="mx-auto mt-24 w-full max-w-3xl border-t border-border/60 pt-10 pb-4 xl:hidden"
          >
            <ContactCard />
          </div>
      </main>

      <ContactPanel />
    </div>
  );
}
