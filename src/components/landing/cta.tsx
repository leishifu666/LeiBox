"use client";

import { T } from "@/components/common/language-provider";

import Link from "next/link";
import { Mail } from "lucide-react";
import { setContactOpen } from "@/components/common/contact-button";

import { Footer } from "@/components/landing/footer";
import { Reveal } from "@/components/landing/reveal";
import { AmbientParticles } from "./ambient-particles";

export function Cta() {
  return (
    <section aria-labelledby="cta-heading" className="px-2.5 pb-2.5">
      <Reveal>
        <div className="dark relative mx-auto min-h-[72rem] w-full overflow-hidden rounded-2xl bg-[#0a0a0a] sm:min-h-[52rem]">
          <div className="absolute inset-0">
            <AmbientParticles />
            <div className="relative flex min-h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-20 text-center sm:pt-36 sm:pb-24">
                <h2
                  id="cta-heading"
                  className="max-w-2xl text-3xl font-medium tracking-tighter text-balance text-white sm:text-5xl"
                ><T>
                  Keep good ideas within reach.
                </T></h2>
                <p className="mt-4 max-w-md text-base leading-7 text-white/60 sm:text-balance"><T>
                  Save the details that make an interface work. Explore the
                  collection, trace the source, and share your next good find.
                </T></p>
                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(event) => setContactOpen(true, event.currentTarget)}
                    className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium tracking-[-0.01em] text-black transition-[opacity,transform] duration-150 ease-out hover:opacity-85 active:scale-[0.98]"
                  ><T>
                    Suggest a component
                    </T><Mail
                      aria-hidden
                      strokeWidth={2.25}
                      className="-mr-1.5 size-[15px]"
                    />
                  </button>
                  <Link
                    href="/components"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98]"
                  ><T>
                    Browse components
                  </T></Link>
                </div>
              </div>

              <Footer />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
