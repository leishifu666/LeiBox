import type { gsap } from 'gsap';

export type TitleLayout = {
  rect: { x: number; y: number; width: number; height: number };
  text: string;
  glyphs: { text: string; x: number; y: number }[];
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
};
export function captureTitleLayout(node: HTMLElement): TitleLayout;
export function mountTitleLayout(node: HTMLElement, layout: TitleLayout, engine: typeof gsap): void;
export function tweenTitleLayout(timeline: gsap.core.Timeline, node: HTMLElement, from: TitleLayout, to: TitleLayout, duration?: number, at?: number): gsap.core.Timeline;
