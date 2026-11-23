import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { T } from "@/components/common/language-provider";
import { ComponentDoc } from "@/components/docs/component-doc";
import { MotionDemoSection } from "@/components/docs/component-doc-chrome";
import { getMotionDocProps } from "@/components/docs/motion-doc-props";
import { MotionPreview } from "@/components/docs/motion-preview";
import { Footer } from "@/components/landing/footer";
import { INTERACTION_COMPONENTS } from "@/data/interaction-components";
import { LIBRARIES_DEV, libraryDemoApi } from "@/data/libraries-dev";
import { THINKING_ORB_API } from "@/data/thinking-orb";
import { UPLOAD_TILE_API } from "@/data/upload-tile";
import { METABALL_MENU_API } from "@/data/metaball-menu";
import { interactionTranslations } from "@/lib/i18n/interactions";
import { motionDocLayout } from "@/lib/motion-doc-layout";
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
  const {width,height,responsive,instructions,tags}=motionDocLayout(entry);
  const library = LIBRARIES_DEV[slug];
  const componentApi = slug === "metaball-menu" ? METABALL_MENU_API : slug === "upload-tile" ? UPLOAD_TILE_API : slug === "thinking-orb" ? THINKING_ORB_API : [];
  return <div className="page-enter">
    <ComponentDoc {...doc} title={entry.name} description={entry.description} installItem={slug} tags={tags}
      beforeInstall={<MotionDemoSection instructions={instructions}>
        <MotionPreview slug={slug} name={entry.name} width={width} height={height} poster={entry.preview} responsive={responsive} />
        {entry.referenceSourceUrl && entry.referenceUrl && (
          <p className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs leading-relaxed text-muted-foreground">
            <a className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={entry.referenceUrl} target="_blank" rel="noreferrer"><T>Reference</T> · {entry.referenceAuthor}</a>
            <a className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={entry.referenceSourceUrl} target="_blank" rel="noreferrer"><T>Upstream source</T></a>
            {entry.referencePackage && <span>{entry.referencePackage} · MIT</span>}
          </p>
        )}
        {entry.communitySubmission && entry.referenceAuthor && (
          <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
            <T>Community submission</T> · <T>{entry.referenceAuthor}</T>
          </p>
        )}
      </MotionDemoSection>}
      afterCode={<>{doc.afterCode}<div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <a href={entry.originalHtml??"/motion/"+slug+".html"} download={entry.sourceFile} className="inline-flex items-center gap-1.5 rounded py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><Download aria-hidden className="size-3.5"/><T>{entry.originalHtml?"Download original HTML":entry.recreatedHtml?"Download standalone HTML":"Download original HTML"}</T></a>
        {slug === "multi-cursor-builder" ? <a href="/motion/multi-cursor-builder.html" download="多光标页面搭建-独立演示.html" className="inline-flex items-center gap-1.5 rounded py-1 underline underline-offset-4"><Download aria-hidden className="size-3.5"/><T>Download standalone HTML</T></a> : null}
        {slug === "deep-agent-composer" || slug === "reasoning-effort-slider" ? <a href="/motion/deep-agent-original-source.txt" download="DeepAgent-原版源码.txt" className="inline-flex items-center gap-1.5 rounded py-1 underline underline-offset-4"><Download aria-hidden className="size-3.5"/><T>Download original Deep Agent source</T></a> : null}
        {entry.suppliedSource?<a href={entry.suppliedSource} download={slug === "card-swap" ? "CardSwap.tsx" : "GlassFolder.tsx"} className="inline-flex items-center gap-1.5 rounded py-1 underline underline-offset-4"><Download aria-hidden className="size-3.5"/><T>Download supplied React source</T></a>:null}
        {entry.original?<span><T>Original by LeiShiFu</T></span>:entry.referenceSourceUrl?null:entry.referenceUrl?<a className="rounded py-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={entry.referenceAuthorUrl??entry.referenceUrl} target="_blank" rel="noreferrer"><T>Author</T> · {entry.referenceAuthor}</a>:entry.referenceAuthor&&!entry.communitySubmission?<span><T>Reference</T> · <T>{entry.referenceAuthor}</T></span>:null}
      </div></>}
      apiReference={[
        ...(slug === "liquid-glass-navigation" ? [
          {"name":"options.menu","type":"\"product\" | \"resources\" | \"company\" | null","defaultValue":"\"product\"","description":"Open menu group. External updates do not emit onMenuChange."},
          {"name":"options.paused","type":"boolean","defaultValue":"false","description":"Pause landscape motion, ripples and menu springs."},
          {"name":"options.onMenuChange","type":"(menu: \"product\" | \"resources\" | \"company\" | null) => void","description":"Called when user input opens, switches or closes the menu."},
          {"name":"options.onAction","type":"(menu: \"product\" | \"resources\" | \"company\", label: string) => void","description":"Handle a local menu action; no navigation is performed automatically."},
        ] : []),
        ...(slug === "window-shade-theme" ? [
          {"name":"options.theme","type":"\"light\" | \"dark\"","defaultValue":"\"light\"","description":"Set the component theme without changing the host document."},
          {"name":"options.progress","type":"number","defaultValue":"0","description":"Place the shade at a progress from 0 to 1 without emitting a theme callback."},
          {"name":"options.paused","type":"boolean","defaultValue":"false","description":"Pause the clouds, shade spring and pending theme commit."},
          {"name":"options.onThemeChange","type":"(theme: \"light\" | \"dark\") => void","description":"Called after a user-driven theme change is committed."},
        ] : []),

        ...(slug === "optical-glass-cards" ? [
          {name:"options.open",type:'("ai" | "optical")[]',defaultValue:"[]",description:"Open detail overlays for ai, optical or both. External updates do not emit onOpenChange."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Pause both procedural 3D scenes at their current phase."},
          {name:"options.time",type:"number",defaultValue:"0",description:"Seek the animation to a nonnegative time in seconds; it continues unless paused."},
          {name:"options.onOpenChange",type:'(open: ("ai" | "optical")[]) => void',description:"Called when the user opens or closes a card detail overlay."},
        ] : []),
        ...(slug === "perforated-stamp-cards" ? [
          {name:"options.cards",type:"{ headline?: string; body?: string; imageSrc?: string; imageAlt?: string }[]",description:"Content overrides for the three fixed cards. Newlines preserve the original text layout."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Pause the card springs at their current pose."},
        ] : []),
        ...(slug === "elemental-card-carousel" ? [
          {name:"options.active",type:"number",defaultValue:"0",description:"Selected element index. External updates do not emit onActiveChange."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Pause the carousel, procedural effects and particle clock."},
          {name:"options.theme",type:'"dark" | "light"',defaultValue:'"dark"',description:"Dark presentation or a light background composite."},
          {name:"options.onActiveChange",type:"(index: number) => void",description:"Called when a user chooses a different element."},
        ] : []),
        ...(slug === "image-dust-disintegration" ? [
          {name:"options.phase",type:'"loading" | "ready" | "gone"',defaultValue:'"loading"',description:"Reset to loading, ready or gone without emitting a callback for the reset itself."},
          {name:"options.liked",type:"boolean",defaultValue:"false",description:"Local favorite state. External updates do not emit onLikeChange."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Freeze the current animation and loading shimmer."},
          {name:"options.onPhaseChange",type:'(phase: "loading" | "revealing" | "ready" | "dusting" | "gone") => void',description:"Called on natural or user-triggered phase changes."},
          {name:"options.onLikeChange",type:"(liked: boolean) => void",description:"Called when the user toggles the local favorite."},
          {name:"options.onDownload",type:"(src: string) => void",description:"Override the default embedded-portrait download."},
        ] : []),
        ...(slug === "glass-ripple-onboarding" ? [
          {name:"options.open",type:"boolean",defaultValue:"false",description:"Show or hide the local goal-selection sheet."},
          {name:"options.goal",type:'"spending" | "emergency" | "milestone"',defaultValue:'"spending"',description:"Selected local demo goal. External updates do not emit onGoalChange."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Pause both the glass waves and the starburst rotation."},
          {name:"options.onOpenChange",type:"(open: boolean) => void",description:"Called when the user opens or closes the goal sheet."},
          {name:"options.onGoalChange",type:'(goal: "spending" | "emergency" | "milestone") => void',description:"Called when the user chooses another goal."},
          {name:"options.onContinue",type:'(goal: "spending" | "emergency" | "milestone") => void',description:"Called with the chosen local demo goal; no account or plan is created."},
        ] : []),
        ...(slug === "liquid-call-cta" ? [
          {name:"options.label",type:"string",defaultValue:'"Book a call"',description:"Primary button text and accessible name."},
          {name:"options.disabled",type:"boolean",defaultValue:"false",description:"Disable all three actions and their pointer interactions."},
          {name:"options.onAction",type:'(action: "book" | "highlights" | "profile") => void',description:"Called with book, highlights or profile; no booking or navigation is performed automatically."},
        ] : []),
        ...(slug === "hanging-art-gallery" ? [
          {name:"options.active",type:"number",defaultValue:"2",description:"Selected artwork index from 0 to 4. External updates do not emit onActiveChange."},
          {name:"options.idleMotion",type:"boolean",defaultValue:"true",description:"Keep the subtle idle sway. Disable it to stop rendering after springs settle."},
          {name:"options.onActiveChange",type:"(index: number) => void",description:"Called when a user selects a different artwork."},
        ] : []),
        ...(slug === "account-burn" ? [
          {name:"options.state",type:'"delete" | "signin"',defaultValue:'"delete"',description:"Reset immediately to a local demo screen without emitting onStateChange."},
          {name:"options.holdDuration",type:"number",defaultValue:"2.2",description:"Required continuous hold in seconds; minimum 0.3."},
          {name:"options.onStateChange",type:'(state: "delete" | "signin") => void',description:"Called when a user-triggered burn or restore finishes; does not delete or restore an account."},
        ] : []),
        ...(slug === "genie-menu" ? [
          {name:"options.open",type:"boolean",defaultValue:"false",description:"Open or close the pull-out menu."},
          {name:"options.speed",type:"1 | 0.3",defaultValue:"1",description:"Normal speed or 0.3× slow motion."},
          {name:"options.onAction",type:"(action: string) => void",description:"Called with the selected menu action label."},
        ] : []),
        ...(slug === "status-picker" ? [
          {name:"options.status",type:'"online" | "focus" | "dnd"',defaultValue:'"online"',description:"Current profile status. Updating it does not emit onStatusChange."},
          {name:"options.open",type:"boolean",defaultValue:"false",description:"Expand or collapse the status choices."},
          {name:"options.onStatusChange",type:'(status: "online" | "focus" | "dnd") => void',description:"Called when the user selects a different status."},
        ] : []),
        ...(library ? [...library.api, ...libraryDemoApi].map(({ key, type, en }) => ({ name: `options.${key}`, type, description: en })) : []),
        ...componentApi.map(({ key, type, defaultValue, en }) => ({ name: slug === "upload-tile" ? key : `options.${key}`, type, defaultValue, description: en })),
        ...(slug === "distortion-waves" ? [
          {name:"options.type",type:'"vertical" | "center" | "horizontal"',defaultValue:'"vertical"',description:"Wave propagation shape: vertical from bottom button, center ring from badge, or horizontal from left rail."},
          {name:"options.palette",type:'"colorful" | "green" | "ocean" | "sunset" | "mono" | string',defaultValue:'"colorful"',description:"Preset palette name or a 6-digit hex colour such as #35ba00."},
          {name:"options.revealed",type:"boolean",defaultValue:"false",description:"Control whether the revealed view is shown; changing it runs or reverses the wave."},
          {name:"options.scrub",type:"number | null",defaultValue:"null",description:"Hold the wave at a normalized progress between 0 and 1 instead of auto-playing."},
          {name:"options.showControls",type:"boolean",defaultValue:"true",description:"Show the mode and palette controls underneath the card."},
          {name:"options.onRevealedChange",type:"(revealed: boolean) => void",description:"Called when the user clicks the card button to toggle views."},
          {name:"options.onFinish",type:"(revealed: boolean) => void",description:"Called when a wave or crossfade finishes, with the current revealed state."},
        ] : []),
        ...(slug === "focus-switch" ? [
          {name:"options.checked",type:"boolean",defaultValue:"false",description:"Set the focus switch on or off."},
          {name:"options.renderer",type:'"webgl2" | "canvas2d"',defaultValue:'"webgl2"',description:"Force the Canvas 2D renderer."},
          {name:"options.onCheckedChange",type:"(checked: boolean) => void",description:"Called when the user changes the switch."},
        ] : []),
        ...(slug === "blister-dropdown" ? [
          {name:"options.value",type:'"all" | "open" | "closed"',defaultValue:'"all"',description:"The selected status."},
          {name:"options.expanded",type:"boolean",defaultValue:"true",description:"Whether the dropdown is expanded."},
          {name:"options.autoClose",type:"boolean",defaultValue:"true",description:"Close the dropdown after the capsule lands."},
          {name:"options.sound",type:"boolean",defaultValue:"true",description:"Play sounds when opening, closing, or selecting."},
          {name:"options.counts",type:"{ all?: number; open?: number; closed?: number }",description:"Override the example counts shown next to each status."},
          {name:"options.onValueChange",type:'(value: "all" | "open" | "closed") => void',description:"Called when the user selects a different status."},
        ] : []),
        ...(slug === "pixel-toggle" ? [
          {name:"options.checked",type:"boolean",defaultValue:"false",description:"Set the switch to day mode."},
          {name:"options.sound",type:"boolean",defaultValue:"true",description:"Play a short sound on user changes."},
          {name:"options.onCheckedChange",type:"(checked: boolean) => void",description:"Called when the user changes the switch."},
        ] : []),
        ...(slug === "image-accordion" ? [
          {name:"options.open",type:"number",defaultValue:"50",description:"How wide the active photo opens, from 0 to 100."},
          {name:"options.reach",type:"number",defaultValue:"35",description:"How far the expansion spreads to neighboring photos, from 0 to 100."},
          {name:"options.bounce",type:"number",defaultValue:"10",description:"Spring rebound strength, from 0 to 100."},
          {name:"options.gap",type:"number",defaultValue:"8",description:"Gap in pixels, from 0 to 20. The corner radius follows the gap up to 12px."},
          {name:"options.images",type:"{ name: string; src: string }[]",description:"One to five photos with accessible names. The demo includes five embedded photos."},
        ] : []),
        ...(slug === "image-compare" ? [
          {name:"options.labels",type:"boolean",defaultValue:"true",description:"Show the Before and After labels."},
          {name:"options.corner",type:"number",defaultValue:"20",description:"Corner radius in pixels, from 0 to 28."},
          {name:"options.beforeSrc",type:"string",description:"Optional before image. By default the after image is shown in grayscale."},
          {name:"options.afterSrc",type:"string",description:"Optional after image. The default illustration is embedded."},
        ] : []),
        ...(slug === "card-swap" ? [
          {name:"options.auto",type:"boolean",defaultValue:"false",description:"Automatically cycle while the stack is visible and idle."},
          {name:"options.every",type:"number",defaultValue:"4",description:"Seconds between automatic swaps, with a minimum of 1.5."},
          {name:"options.cards",type:"{ title: string; src: string }[]",description:"Four photo cards with a title and image source. Defaults are embedded."},
        ] : []),
        ...(slug === "multi-cursor-builder" ? [
          {name:"options.playing",type:"boolean",defaultValue:"true",description:"Play or pause the local construction and cursor motion."},
          {name:"options.speed",type:"number",defaultValue:"1",description:"Construction speed multiplier, from 0.25 to 2."},
          {name:"options.skipIntro",type:"boolean",defaultValue:"false",description:"Start directly with page construction, skipping the orbit and frame intro."},
          {name:"options.showToolbar",type:"boolean",defaultValue:"true",description:"Show the tool status, scroll percentage, pause and replay controls."},
          {name:"options.onPhaseChange",type:'(phase: "intro" | "burst" | "board" | "build") => void',description:"Called when the animation changes between intro, burst, board and build."},
          {name:"options.onReplay",type:"() => void",description:"Called only when the user replays with the button or keyboard."},
        ] : []),
        ...(slug === "album-cover-tunnel" ? [
          {name:"options.images",type:'(string | { src: string; alt?: string })[]',description:"One to ninety-six image URLs or objects with src and alt. The default 55 covers are embedded."},
          {name:"options.paused",type:"boolean",defaultValue:"false",description:"Pause the simulation while keeping keyboard and local controls usable."},
          {name:"options.autoTravel",type:"boolean",defaultValue:"true",description:"Enable automatic travel after five seconds of inactivity."},
          {name:"options.active",type:"number",description:"Select an image by its zero-based index without emitting onSelect."},
          {name:"options.onSelect",type:"(index: number) => void",description:"Called with the image index when a user chooses a cover."},
        ] : []),
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
        ...(slug === "metaball-menu" ? [] : [{name:"options.reducedMotion",type:"boolean",description:"Override the system reduced-motion preference without changing interaction states."}]),
      ]}
    />
    <div className="mx-auto mt-24 w-full max-w-3xl"><Footer variant="docs"/></div>
  </div>;
}
