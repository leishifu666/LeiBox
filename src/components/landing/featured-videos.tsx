"use client";

import { T, useLanguage } from "@/components/common/language-provider";

import { Dialog } from "@base-ui/react/dialog";
import { Play, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { CommunityQuotes } from "@/components/landing/community-quotes";
import { Reveal } from "@/components/landing/reveal";
import { Stitches } from "@/components/landing/stitches";

const VIDEOS = [
  {
    id: "37wy90RnATM",
    title: "New browser update let's you set things on FIRE",
    creator: "Hyperplexed",
    description: (
      <>
        <strong><T>Hyperplexed</T></strong>{" "}<T>tests Canvas UI in an interactive music
        player packed with HTML-in-Canvas effects.
      </T></>
    ),
  },
  {
    id: "JZf_m_BVDaQ",
    title: "This component library is mind-blowing",
    creator: "Better Stack",
    description: (
      <>
        <strong><T>Better Stack</T></strong>{" "}<T>showcases Canvas UI&apos;s GPU-powered
        live DOM effects and creative video workflows.
      </T></>
    ),
  },
  {
    id: "aVgR5YHk4QA",
    title: "The Biggest Web UI Breakthrough in Years",
    creator: "OrcDev",
    description: (
      <>
        <strong><T>OrcDev</T></strong>{" "}<T>explores Canvas UI and why HTML-in-Canvas
        could reshape modern web experiences.
      </T></>
    ),
  },
] as const;

export function FeaturedVideos() {
  const { locale, t } = useLanguage();
  const [activeVideo, setActiveVideo] =
    useState<(typeof VIDEOS)[number] | null>(null);

  return (
    <Dialog.Root
      onOpenChangeComplete={(open) => {
        if (!open) setActiveVideo(null);
      }}
    >
      <section
        aria-labelledby="featured-videos-heading"
        className="relative border-t border-dashed border-border/60"
      >
        <Stitches />
        <div className="w-full px-5 py-24 sm:px-8 sm:py-32">
          <Reveal>
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase"><T>
              Community
            </T></p>
            <h2
              id="featured-videos-heading"
              className="mt-3 text-3xl font-medium tracking-tighter text-balance sm:text-4xl"
            ><T>
              Featured on YouTube
            </T></h2>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground"><T>
              See Canvas UI in action in these awesome videos.
            </T></p>
          </Reveal>

          <ul className="mt-12 flex flex-col gap-4">
            {VIDEOS.map((video, index) => (
              <Reveal key={video.id} as="li" delay={80 + index * 60}>
                <Dialog.Trigger
                  type="button"
                  onClick={() => setActiveVideo(video)}
                  className="featured-video-card group grid w-full cursor-pointer rounded-2xl border border-border/60 p-2 text-left md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:items-center"
                  aria-label={locale === "zh" ? `播放 ${video.creator} 的《${t(video.title)}》` : `Play ${video.title} by ${video.creator}`}
                >
                  <span className="relative aspect-2/1 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                    <Image
                      src={`/assets/youtube/${video.id}.jpg`}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="featured-video-thumbnail size-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-11 place-items-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-sm transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none">
                        <Play
                          aria-hidden
                          className="ml-0.5 size-4 fill-current"
                          strokeWidth={1.75}
                        />
                      </span>
                    </span>
                  </span>

                  <span className="flex px-3 py-6 sm:px-5 md:px-8 lg:px-10">
                    <span className="max-w-xl text-xl leading-8 tracking-tight text-muted-foreground text-balance sm:text-2xl sm:leading-9 [&_strong]:font-medium [&_strong]:text-foreground">
                      <T>{video.description}</T>
                    </span>
                  </span>
                </Dialog.Trigger>
              </Reveal>
            ))}
          </ul>

          <CommunityQuotes />
        </div>
      </section>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-100 bg-black/75 opacity-100 backdrop-blur-md transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-100 grid place-items-center overflow-y-auto p-4 sm:p-8">
          <Dialog.Popup className="featured-video-dialog relative w-full max-w-6xl overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl shadow-black/60">
            <Dialog.Title className="sr-only">
              <T>{activeVideo?.title ?? "YouTube video"}</T>
            </Dialog.Title>
            <Dialog.Close
              aria-label={t("Close video")}
              className="absolute top-3 right-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-md transition-[background-color,transform] duration-200 hover:scale-105 hover:bg-black/85 focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none md:hidden"
            >
              <X aria-hidden className="size-4" strokeWidth={2} />
            </Dialog.Close>
            <div className="aspect-video w-full">
              {activeVideo && (
                <iframe
                  className="size-full"
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                  title={locale === "zh" ? `${activeVideo.creator}：《${t(activeVideo.title)}》` : `${activeVideo.title} by ${activeVideo.creator}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
