import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { T } from "@/components/common/language-provider";
import { ComponentDoc } from "@/components/docs/component-doc";
import { getMotionDocProps } from "@/components/docs/motion-doc-props";
import { MotionPreview } from "@/components/docs/motion-preview";
import { Footer } from "@/components/landing/footer";
import { INTERACTION_COMPONENTS } from "@/data/interaction-components";
import { interactionTranslations } from "@/lib/i18n/interactions";
import { DEEP_AGENT_API, DEEP_AGENT_COMPOSER_API } from "@/data/deep-agent.mjs";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return INTERACTION_COMPONENTS.filter(entry=>entry.sourceFile&&entry.href.startsWith("/docs/animations/")).map(({slug})=>({slug})); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {slug}=await params;
  const entry=INTERACTION_COMPONENTS.find(item=>item.slug===slug&&item.sourceFile);
  return entry?{title:interactionTranslations[entry.name]??entry.name,description:entry.description,alternates:{canonical:entry.href}}:{};
}
export default async function MotionPage({params}:Props){
  const {slug}=await params;
  const entry=INTERACTION_COMPONENTS.find(item=>item.slug===slug&&item.sourceFile);
  if(!entry)notFound();
  const doc=await getMotionDocProps(slug);
  return <div className="page-enter">
    <ComponentDoc {...doc} title={entry.name} description={entry.description} installItem={slug} tags={[entry.category,"6 frameworks","TypeScript"]}
      beforeInstall={<section className="mt-8" aria-label="Demo">
        <h2 className="text-lg font-semibold tracking-[-0.01em]"><T>Demo</T></h2>
        <p className="mt-2 text-[13px] text-muted-foreground"><T>{entry.instructions!}</T></p>
        <div className="mt-3"><MotionPreview slug={slug} name={entry.name} width={entry.canvasWidth!} height={entry.canvasHeight!} responsive={slug === "reasoning-effort-slider" || slug === "deep-agent-composer"}/></div>
      </section>}
      afterCode={<>{doc.afterCode}<div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <a href={"/motion/"+slug+".html"} download={entry.sourceFile} className="inline-flex items-center gap-1.5 rounded py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><Download aria-hidden className="size-3.5"/><T>{entry.recreatedHtml?"Download standalone HTML":"Download original HTML"}</T></a>
        {slug === "deep-agent-composer" || slug === "reasoning-effort-slider" ? <a href="/motion/deep-agent-original-source.txt" download="DeepAgent-原版源码.txt" className="inline-flex items-center gap-1.5 rounded py-1 underline underline-offset-4"><Download aria-hidden className="size-3.5"/><T>Download original Deep Agent source</T></a> : null}
        {entry.suppliedSource?<a href={entry.suppliedSource} download="GlassFolder.tsx" className="inline-flex items-center gap-1.5 rounded py-1 underline underline-offset-4"><Download aria-hidden className="size-3.5"/><T>Download supplied React source</T></a>:null}
        {entry.referenceUrl?<a className="rounded py-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={entry.referenceAuthorUrl??entry.referenceUrl} target="_blank" rel="noreferrer"><T>Author</T> · {entry.referenceAuthor}</a>:entry.referenceAuthor?<span><T>Reference</T> · <T>{entry.referenceAuthor}</T></span>:null}
      </div></>}
      apiReference={[
        ...(slug === "folded-emoji-scroll" ? [
          {name:"options.query",type:"string",defaultValue:'""',description:"Initial or updated emoji query."},
          {name:"options.value",type:"string",description:"Selected emoji character. User selection calls onSelect."},
          {name:"options.foldSize",type:"number",defaultValue:"42",description:"Fold band width in design pixels, from 0 to 72."},
          {name:"options.onSelect",type:"(emoji: string) => void",description:"Called when the user selects an emoji."},
        ] : []),
        ...(slug === "gradient-ring-cards" ? [
          {name:"options.active",type:"number",defaultValue:"0",description:"Initial or updated card index, from 0 to 4."},
          {name:"options.autoRotate",type:"boolean",defaultValue:"true",description:"Automatically rotate the card ring."},
          {name:"options.speed",type:"number",defaultValue:"1",description:"Rotation speed multiplier, from 0 to 3."},
          {name:"options.distortion",type:"number",defaultValue:"1",description:"Chromatic separation strength, from 0 to 2."},
          {name:"options.onSelect",type:"(id: string) => void",description:"Called when the user selects a card; automatic rotation does not emit it."},
        ] : []),
        ...(slug === "fluid-tooltip" ? [
          {name:"options.active",type:'"today" | "tasks" | "calendar" | "focus" | "settings" | "profile"',defaultValue:'"today"',description:"Selected navigation item; hovering only changes the tooltip."},
          {name:"options.onSelect",type:"(id: string) => void",description:"Called when a different navigation item is selected."},
          {name:"options.profileLabel",type:"string",defaultValue:'"LeiBox"',description:"Profile tooltip text. Defaults to LeiBox."},
          {name:"options.logoSrc",type:"string",description:"Profile logo URL. The embedded LeiBox vector is the default and error fallback."},
        ] : []),
        ...(slug === "spider-music-player" ? [
          {name:"options.track",type:"number",defaultValue:"0",description:"Initial or updated song index in the local queue."},
          {name:"options.playing",type:"boolean",defaultValue:"true",description:"Control the local playback timer."},
          {name:"options.onTrackChange",type:"(index: number) => void",description:"Called once after the spider finishes switching to a new track."},
        ] : []),
        ...(slug === "collection-layout-morph" ? [
          {name:"options.view",type:'"list" | "card" | "pack"',defaultValue:'"list"',description:"Initial or updated collection layout; the three image nodes remain mounted."},
        ] : []),
        ...(slug === "brand-poster-cards" ? [
          {name:"options.images",type:"(string | { src: string; alt?: string; position?: string })[]",description:"Three image URLs or objects with src, alt and position. Default portraits are embedded."},
          {name:"options.description",type:"string",description:"Shared introduction shown at the bottom of all three posters."},
          {name:"options.logoSrc",type:"string",description:"Full centered wordmark image. The default uses the existing LeiBox vector artwork."},
          {name:"options.symbolSrc",type:"string",description:"Small symbol at the top-left corner. The default uses the LeiBox symbol."},
        ] : []),
        ...((slug === "reasoning-effort-slider" || slug === "deep-agent-composer") ? DEEP_AGENT_API : []),
        ...(slug === "deep-agent-composer" ? DEEP_AGENT_COMPOSER_API : []),
        {name:"options.height",type:"number",defaultValue:String(entry.canvasHeight),description:"Preferred scene height. The layout grows to fit content."},
        {name:"options.reducedMotion",type:"boolean",description:"Override the system reduced-motion preference without changing interaction states."},
      ]}
    />
    <div className="mx-auto mt-24 w-full max-w-3xl"><Footer variant="docs"/></div>
  </div>;
}
