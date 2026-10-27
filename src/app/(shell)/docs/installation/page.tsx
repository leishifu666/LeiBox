import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/common/language-provider";
import { Footer } from "@/components/landing/footer";
import { LearningNotice } from "@/components/common/learning-notice";
import { CopyButton } from "@/components/docs/copy-button";
export const metadata: Metadata = { title: "Installation and usage", description: "LeiBox UI studies, source packages and learning-use permissions." };
export default function Page() { return <article className="page-enter mx-auto w-full max-w-3xl">
  <div className="typeset typeset-docs"><h1><T>Installation and usage</T></h1><h2><T>Install the Skill</T></h2><pre>npx skills add https://leibox-ui.netlify.app --skill leibox</pre><CopyButton text="npx skills add https://leibox-ui.netlify.app --skill leibox" label="Copy" />
<p><T>Use the LeiBox Skill to find an example and retrieve the framework package that the selected page actually provides.</T></p>
<h2><T>Use a component package</T></h2><p><T>Open an example, choose your framework, review its source and license, then copy the complete files and install only the dependencies your project needs.</T></p>
<p><T>Downloading source does not install dependencies or prove that your final application works. Verify the rendered result, interaction, keyboard behavior and cleanup in your own project.</T></p>
<p><Link href="/components"><T>Browse all</T></Link></p></div>
  <LearningNotice className="mt-10 border-t border-border/60 pt-5" /><div className="mt-16"><Footer variant="docs" /></div>
</article>; }
