"use client";

import { gsap } from "gsap";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

import { InteractionPreview } from "@/components/common/interaction-preview";
import { T, useLanguage } from "@/components/common/language-provider";
import { PreviewVideo } from "@/components/common/preview-video";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SiteLogo } from "@/components/common/site-logo";
import styles from "./not-found-experiments.module.css";

export type NotFoundPreviewItem = {
  slug: string;
  href: string;
  name: string;
  poster?: string;
  source?: string;
  width?: number;
  height?: number;
  video?: string;
};

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

export function NotFoundExperiments({ items }: { items: NotFoundPreviewItem[] }) {
  const searchParams = useSearchParams();
  const design = searchParams.get("design") === "brand" ? "brand" : "orbit";
  const typography = searchParams.get("font") === "site" ? "site" : "reference";
  return <NotFoundDesign key={design} design={design} typography={typography} items={items} />;
}

export function OrbitNotFound({ items }: { items: NotFoundPreviewItem[] }) {
  return <NotFoundDesign design="orbit" typography="reference" items={items} />;
}

function NotFoundDesign({ design, typography, items }: { design: "brand" | "orbit"; typography: "reference" | "site"; items: NotFoundPreviewItem[] }) {
  const { locale, t } = useLanguage();
  const zh = locale === "zh";
  const orbit = design === "orbit";
  const root = useRef<HTMLDivElement>(null);
  const rotation = useRef<gsap.core.Tween | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const active = hovered ?? focused;
  const stopped = active !== null || reducedMotion;

  useEffect(() => {
    if (!root.current || reducedMotion) return;
    const context = gsap.context(() => {
      gsap.from("[data-arrive]", { opacity: 0, y: 12, duration: .7, stagger: .07, ease: "power2.out" });
      if (orbit) {
        rotation.current = gsap.to("[data-orbit-ring]", { rotation: 360, duration: 120, repeat: -1, ease: "none", paused: true });
        gsap.from("[data-orbit-card]", { opacity: 0, duration: 1, stagger: .045, ease: "power2.out" });
      } else {
        gsap.from("[data-brand-mark]", { rotation: -16, scale: .86, duration: 1.1, ease: "power3.out" });
      }
    }, root);
    return () => { context.revert(); rotation.current = null; };
  }, [orbit, reducedMotion]);

  useEffect(() => {
    const update = () => rotation.current?.paused(stopped || document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [stopped, reducedMotion]);

  return (
    <div ref={root} className={`${styles.page} ${orbit ? styles.orbit : styles.brand}`} data-404-design={design} data-404-font={typography}>
      <header className={styles.header}>
        <Link href="/" aria-label={zh ? "LeiBox 首页" : "LeiBox home"} className={styles.logoLink}>
          <SiteLogo navigation className={styles.wordmark} />
        </Link>
        {!orbit && <nav aria-label={zh ? "404 设计对比" : "404 design comparison"} className={styles.switcher}>
          <Link href="/404-preview?design=brand" replace prefetch={false} aria-current={!orbit ? "page" : undefined}>
            <span className={styles.optionNumber}>01</span>{zh ? "品牌图标" : "Brand mark"}
          </Link>
          <Link href="/404-preview?design=orbit" replace prefetch={false} aria-current={orbit ? "page" : undefined}>
            <span className={styles.optionNumber}>02</span>{zh ? "组件环游" : "Component orbit"}
          </Link>
        </nav>}
        {orbit ? <div className={styles.themeControls}>
          <span className={styles.headerNote}>ERROR 404</span>
          <ThemeToggle />
        </div> : <span className={styles.headerNote}>404 EXPLORATIONS</span>}
      </header>

      {orbit ? (
        <main className={styles.orbitMain}>
          <h1 className={styles.srOnly}>404 · <T>Nothing here yet.</T></h1>
          <div className={styles.orbitComposition}>
            <span aria-hidden="true" className={`${styles.expressiveFour} ${styles.leftFour}`} data-arrive>4</span>
            <span aria-hidden="true" className={`${styles.expressiveFour} ${styles.rightFour}`} data-arrive>4</span>
            <div className={styles.orbitStage}>
              <div className={styles.orbitRing} data-orbit-ring data-paused={stopped}>
                {items.map((item, index) => (
                  <div key={item.slug} className={styles.orbitPosition} style={{ "--angle": `${index * 360 / items.length}deg` } as CSSProperties}>
                    <Link
                      href={item.href} prefetch={false} data-preview-card data-orbit-card
                      aria-label={`${t(item.name)} · ${zh ? "查看组件" : "View component"}`}
                      className={styles.componentCard} data-active={active === index}
                      onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(index); }}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={() => setFocused(index)} onBlur={() => setFocused(null)}
                    >
                      {item.video ? <PreviewVideo src={item.video} className={styles.video} /> : (
                        <InteractionPreview slug={item.slug} poster={item.poster!} source={item.source} width={item.width} height={item.height} active={active === index} />
                      )}
                      <span className={styles.cardArrow}><ArrowUpRight size={14} aria-hidden="true" /></span>
                    </Link>
                  </div>
                ))}
              </div>
              <div className={styles.orbitCenter} data-arrive>
                <p className={styles.eyebrow}>ERROR 404</p>
                <p className={styles.orbitTitle}>{zh ? "这一页，走丢了" : "Page not found"}</p>
                <Link href="/" className={styles.orbitHome}><T>Back home</T><ArrowUpRight size={14} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className={styles.brandMain}>
          <p className={styles.brandIntro} data-arrive><T>The page you are looking for does not exist or has moved.</T></p>
          <h1 className={styles.srOnly}>404 · <T>Nothing here yet.</T></h1>
          <div className={styles.brandComposition} aria-hidden="true" data-arrive>
            <span className={styles.solidFour}>4</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-brand-mark src="/leibox-mark.svg" alt="" width={512} height={512} className={styles.brandMark} />
            <span className={styles.solidFour}>4</span>
          </div>
          <div className={styles.brandActions} data-arrive>
            <Link href="/" className={styles.homeButton}><T>Back home</T><ArrowUpRight size={16} aria-hidden="true" /></Link>
            <Link href="/components" className={styles.browseLink}><T>Browse components</T></Link>
          </div>
        </main>
      )}

      {!orbit && <footer className={styles.footer}>
        <span>© LEIBOX</span>
        <span className={styles.footerCenter}>EVERY GOOD IDEA STARTS SOMEWHERE</span>
        <span className={styles.footerIndex}>01 <span>/</span> 02 <ArrowDownRight size={14} aria-hidden="true" /></span>
      </footer>}
    </div>
  );
}
