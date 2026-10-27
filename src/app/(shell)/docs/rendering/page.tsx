import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/common/language-provider";
import { Footer } from "@/components/landing/footer";
import { LearningNotice } from "@/components/common/learning-notice";
import { CopyButton } from "@/components/docs/copy-button";
export const metadata: Metadata = { title: "Rendering and previews", description: "LeiBox UI studies, source packages and learning-use permissions." };
export default function Page() { return <article className="page-enter mx-auto w-full max-w-3xl">
  <div className="typeset typeset-docs"><h1><T>Rendering and previews</T></h1><p><T>The collection uses ordinary DOM and SVG, Canvas 2D, and WebGL according to the example. Read the selected component page for its actual requirements.</T></p>
<h2><T>Live preview and source</T></h2><p><T>Preview cards load their interactive example when needed. A thumbnail is a preview of an example; it is not proof that every state or integration is supported.</T></p>
<h2><T>Reduced motion</T></h2><p><T>The website respects the operating system reduced-motion preference. Individual examples may also offer pause, replay or reset controls.</T></p>
<p><Link href="/components"><T>Browse all</T></Link></p></div>
  <LearningNotice className="mt-10 border-t border-border/60 pt-5" /><div className="mt-16"><Footer variant="docs" /></div>
</article>; }
