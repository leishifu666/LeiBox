import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/common/language-provider";
import { Footer } from "@/components/landing/footer";
import { LearningNotice } from "@/components/common/learning-notice";
import { CopyButton } from "@/components/docs/copy-button";
export const metadata: Metadata = { title: "Introduction", description: "LeiBox UI studies, source packages and learning-use permissions." };
export default function Page() { return <article className="page-enter mx-auto w-full max-w-3xl">
  <div className="typeset typeset-docs"><h1><T>Introduction</T></h1><p><T>A personal collection of UI studies, interactive examples and design references.</T></p>
<h2><T>Explore interactive examples</T></h2><p><T>Browse the live examples, inspect the documented behavior, and check the recorded source and permissions before reusing code or media.</T></p>
<p><Link href="/components"><T>Browse all</T></Link> · <Link href="/docs/animations/glass-folder"><T>Glass Folder Cards</T></Link></p>
<h2><T>Installation and usage</T></h2><p><T>Use the LeiBox Skill to find an example and retrieve the framework package that the selected page actually provides.</T></p>
<p><Link href="/docs/installation"><T>Installation</T></Link> · <Link href="/docs/mcp"><T>AI integration</T></Link></p>
<h2><T>Learning use and permissions</T></h2><p><T>Use is subject to the original rights holder’s permissions. The learning notice is not a blanket license or a guarantee against claims.</T></p><p><Link href="/copyright"><T>Sources and permissions</T></Link></p></div>
  <LearningNotice className="mt-10 border-t border-border/60 pt-5" /><div className="mt-16"><Footer variant="docs" /></div>
</article>; }
