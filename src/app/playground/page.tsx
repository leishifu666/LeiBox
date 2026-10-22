import type { Metadata } from "next";

import { GitHubStars } from "@/components/common/github-stars";
import { NewsletterNavButton } from "@/components/common/newsletter-nav-button";
import { NewsletterPanel } from "@/components/common/newsletter-panel";
import { SearchButton, SearchDialog } from "@/components/common/site-search";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { PlaygroundClient } from "@/components/playground/playground-client";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Try every Canvas UI component on a real landing page. Pick an effect, tune its controls, switch between WebGL and WebGPU, and watch it run over live HTML.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return (
    <>
      <div className="fixed top-4 right-[calc(1rem+var(--demo-sbw,0px))] z-40 hidden items-center gap-2 rounded-full border border-border/60 bg-background/70 p-1.5 backdrop-blur-xl backdrop-saturate-150 [view-transition-name:docs-controls] lg:flex">
        <NewsletterNavButton />
        <SearchButton />
        <ThemeToggle />
        <GitHubStars />
      </div>

      <SearchDialog />

      <PlaygroundClient />

      <NewsletterPanel />
    </>
  );
}
