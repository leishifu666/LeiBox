import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";
import { getMotionPackages } from "@/lib/motion-packages";

import { AgentDemo } from "@/components/landing/agent-demo";
import { Agents } from "@/components/landing/agents";
import { Cta } from "@/components/landing/cta";
import { Faq } from "@/components/landing/faq";
import { Frameworks } from "@/components/landing/frameworks";
import { Gallery } from "@/components/landing/gallery";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { Newsletter } from "@/components/landing/newsletter";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LeiBox",
  description:
    "A personal collection of UI inspiration, creative components, and design references for people and AI assistants.",
  url: SITE_URL,
  author: {
    "@type": "Person",
    name: "雷师傅",
    url: "https://github.com/leishifu666",
  },
};

const htmlSafeJsonStringify = (obj: unknown): string =>
  JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

export default async function Home() {
  const packages = await getMotionPackages("glass-folder");
  const reactPackage = packages.find((entry) => entry.framework === "react")!;
  const demoCode = {
    component: reactPackage.component,
    bundle: reactPackage.bundle,
    entry: reactPackage.files[0].source,
    lineCount: reactPackage.bundle.trimEnd().split(/\r?\n/).length,
    files: reactPackage.files.map((file) => ({
      name: file.fileName,
      lines: file.source.trimEnd().split(/\r?\n/).length,
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: htmlSafeJsonStringify(JSON_LD) }}
      />
      <Navbar />
      <main data-component-entry-state="idle" className="page-enter flex flex-1 flex-col overflow-x-clip">
        <div className="relative mx-auto w-full max-w-6xl">
          <div aria-hidden className="landing-rail absolute inset-y-0 left-0" />
          <div
            aria-hidden
            className="landing-rail absolute inset-y-0 right-0"
          />
          <section className="landing-hero-demo">
            <Hero />
            <AgentDemo code={demoCode} />
          </section>
          <Gallery />
          <HowItWorks />
          <Frameworks />
          <Agents />
          <Faq />
          <Newsletter />
        </div>
        <Cta />
      </main>
    </>
  );
}
