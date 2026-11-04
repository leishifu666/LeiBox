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
        <div className="mt-3"><MotionPreview slug={slug} name={entry.name} width={entry.canvasWidth!} height={entry.canvasHeight!} responsive={slug === "stacked-metadata" || slug === "shader-flood" || slug === "ascii-sharks" || slug === "reasoning-effort-slider" || slug === "deep-agent-composer"}/></div>
      </section>}
      afterCode={<>{doc.afterCode}<div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <a href={"/motion/"+slug+".html"} download={entry.sourceFile} className="inline-flex items-center gap-1.5 rounded py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><Download aria-hidden className="size-3.5"/><T>{entry.recreatedHtml?"Download standalone HTML":"Download original HTML"}</T></a>
        {slug === "deep-agent-composer" || slug === "reasoning-effort-slider" ? <a href="/motion/deep-agent-original-source.txt" download="DeepAgent-原版源码.txt" className="inline-flex items-center gap-1.5 rounded py-1 underline underline-offset-4"><Download aria-hidden className="size-3.5"/><T>Download original Deep Agent source</T></a> : null}
        {entry.suppliedSource?<a href={entry.suppliedSource} download="GlassFolder.tsx" className="inline-flex items-center gap-1.5 rounded py-1 underline underline-offset-4"><Download aria-hidden className="size-3.5"/><T>Download supplied React source</T></a>:null}
        {entry.referenceUrl?<a className="rounded py-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={entry.referenceAuthorUrl??entry.referenceUrl} target="_blank" rel="noreferrer"><T>Author</T> · {entry.referenceAuthor}</a>:entry.referenceAuthor?<span><T>Reference</T> · <T>{entry.referenceAuthor}</T></span>:null}
      </div></>}
      apiReference={[
        ...(slug === "stacked-metadata" ? [
          {name:"options.heading",type:"string",defaultValue:'"In Progress"',description:"List heading."},
          {name:"options.items",type:'{ title: string; priority: string; date: string; assignee: string; team?: boolean }[]',description:"One to twelve local task rows; an empty list restores the defaults."},
          {name:"options.theme",type:'"dark" | "light"',defaultValue:'"dark"',description:"Dark original presentation or light preview surfaces."},
          {name:"options.expanded",type:"number",defaultValue:"-1",description:"Initially pinned or externally selected row; -1 collapses all rows."},
          {name:"options.onExpandChange",type:"(index: number) => void",description:"Called when user input changes the visible expanded row; external updates do not emit it."},
        ] : []),
        ...(slug === "transfer-glow" ? [
          {name:"options.open",type:"boolean",defaultValue:"true",description:"Open or close the local dialog; reopening resets the sequence."},
          {name:"options.amount",type:"string",defaultValue:'"100,000.00"',description:"Displayed transfer amount; no money is moved."},
          {name:"options.account",type:"string",defaultValue:'"Grain USD account"',description:"Source account label."},
          {name:"options.recipient",type:"string",defaultValue:'"Müller Logistik GmbH"',description:"Recipient name in the details and success message."},
          {name:"options.receivedAmount",type:"string",defaultValue:'"€92,000.00"',description:"Formatted recipient amount, without the EUR suffix."},
          {name:"options.duration",type:"number",defaultValue:"5200",description:"Local processing duration in milliseconds, from 1200 to 15000."},
          {name:"options.onComplete",type:"() => void",description:"Called once when a local processing sequence completes; cancelled runs do not emit it."},
          {name:"options.onOpenChange",type:"(open: boolean) => void",description:"Called when the user opens or closes the dialog."},
        ] : []),
        ...(slug === "shader-flood" ? [
          {name:"options.items",type:'{ title: string; description: string; icon?: string; colors?: [string, string, string] }[]',description:"Feature cards with an icon name and optional dark/mid/light palette. Omitted palettes cycle through five presets."},
          {name:"options.seed",type:"number",defaultValue:"0",description:"Reshape the liquid independently from the card colors."},
          {name:"options.speed",type:"number",defaultValue:"1",description:"Liquid speed from zero to three; zero freezes texture while preserving interaction."},
          {name:"options.theme",type:'"light" | "dark"',defaultValue:'"light"',description:"Light or dark card surfaces."},
          {name:"options.background",type:"string",description:"Optional hexadecimal scene background."},
        ] : []),
        ...(slug === "ascii-sharks" ? [
          {name:"options.theme",type:'"light" | "dark"',defaultValue:'"light"',description:"Light video-style presentation or the original dark rendering."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Pause the simulation while keeping keyboard and local controls usable."},
          {name:"options.speed",type:"number",defaultValue:"1",description:"Simulation speed multiplier from 0.25 to 2."},
          {name:"options.seed",type:"number",defaultValue:"7",description:"Independent deterministic seed; updating it restarts this ocean only."},
          {name:"options.fishCount",type:"number",description:"Override the area-based fish population, from 0 to 340."},
          {name:"options.sharks",type:'{ kind: "classic" | "hammerhead" | "zebra" | "tiger" | "greathammer" | "mako" | "thresher" | "nurse"; size: number }[]',description:"One to eight shark species and relative sizes. Defaults to a mixed group."},
          {name:"options.showComposer",type:"boolean",defaultValue:"true",description:"Show the local composer, haze and history layer."},
          {name:"options.onSubmit",type:"(message: { text: string; attachments: File[] }) => void",description:"Receives local text and selected File objects; nothing uploads automatically."},
          {name:"options.onVoiceInput",type:"() => void",description:"Enable the microphone button with your own voice handler."},
        ] : []),
        ...(slug === "ink-spread-carousel" ? [
          {name:"options.index",type:"number",defaultValue:"0",description:"Initial or updated photo index; indices wrap around the collection."},
          {name:"options.duration",type:"number",defaultValue:"900",description:"Image transition duration in milliseconds, from 250 to 2400."},
          {name:"options.roughness",type:"number",defaultValue:"0.6",description:"Irregularity of the ink edge, from 0 to 1."},
          {name:"options.images",type:"(string | { src: string; alt?: string })[]",description:"Two to twelve image URLs or objects with src and alt. The default generated artwork is embedded."},
          {name:"options.onIndexChange",type:"(index: number) => void",description:"Called once when the user's final image transition completes; external updates do not emit it."},
        ] : []),
        ...(slug === "particle-texture-trio" ? [
          {name:"options.speed",type:"number",defaultValue:"1",description:"Playback speed multiplier, from 0 to 3; zero stops rendering."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Pause or resume all three particle fields."},
          {name:"options.background",type:'"#000" | "#f4f4f4"',defaultValue:'"#000"',description:"Scene background; use black for the original composition or light grey for previews."},
        ] : []),
        ...(slug === "matcha-powder-reveal" ? [
          {name:"options.progress",type:"number",description:"Initial or updated animation progress, from 0 to 1."},
          {name:"options.playing",type:"boolean",defaultValue:"true",description:"Play or pause the animation."},
          {name:"options.autoTear",type:"boolean",defaultValue:"false",description:"Automatically tear without input. Disabled by default."},
          {name:"options.loop",type:"boolean",defaultValue:"false",description:"Repeat after the final message."},
          {name:"options.speed",type:"number",defaultValue:"1",description:"Playback speed multiplier, from 0.25 to 2."},
          {name:"options.onProgress",type:"(progress: number) => void",description:"Called when the user seeks; controlled updates do not emit it."},
        ] : []),
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
        ...((slug === "brand-poster-cards" || slug === "ai-brand-cover-cards") ? [
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
