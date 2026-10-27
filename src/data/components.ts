export interface ComponentEntry {
  href: string;
  name: string;
  description: string;
  /** Looping preview video shown in the showcase cards. */
  video: string;
}

export const LIGHT_VIDEOS = new Set([
  "/assets/videos/ascii-object.webm",
  "/assets/videos/ascii-object-leibox.webm",
  "/assets/videos/frost.webm",
  "/assets/videos/glyph-rain.webm",
  "/assets/videos/liquid-object.webm",
  "/assets/videos/liquid-object-leibox.webm",
  "/assets/videos/particle-object-leibox-3d.webm",
]);

export const isLightVideo = (src: string) => LIGHT_VIDEOS.has(src);

export const COMPONENTS: ComponentEntry[] = [
  {
    href: "/docs/components/ascii-object",
    name: "ASCII Object",
    description:
      "Any GLB/glTF model, SVG, or image floating in a studio scene, redrawn as shape-matched ASCII characters.",
    video: "/assets/videos/ascii-object-leibox.webm",
  },
  {
    href: "/docs/components/asciify",
    name: "Asciify",
    description:
      "A soft lens that follows your cursor and redraws the live HTML beneath it as ascii characters.",
    video: "/assets/videos/asciify.webm",
  },
  {
    href: "/docs/components/frost",
    name: "Frost",
    description:
      "A frozen pane of ice over your live HTML that melts under the cursor and refreezes.",
    video: "/assets/videos/frost.webm",
  },
  {
    href: "/docs/components/glass",
    name: "Glass",
    description:
      "A cursor-following glass lens that refracts your live HTML and zooms in on targets like a crystal ball.",
    video: "/assets/videos/glass.webm",
  },
  {
    href: "/docs/components/glass-object",
    name: "Glass Object",
    description:
      "Turns any 3D model, SVG, or image into floating liquid glass with real refraction, dispersion, and frost.",
    video: "/assets/videos/glass-object-leibox.webm",
  },
  {
    href: "/docs/components/glyph-rain",
    name: "Glyph Rain",
    description:
      "Falling glyph streams that light up your live HTML, with drop heads that surge where your cursor cuts through.",
    video: "/assets/videos/glyph-rain.webm",
  },
  {
    href: "/docs/components/particle-object",
    name: "Particle Object",
    description:
      "Rebuilds any 3D model, SVG, or image as particles that scatter around the cursor and spring back into shape.",
    video: "/assets/videos/particle-object-leibox-3d.webm",
  },
  {
    href: "/docs/components/particle-scroll",
    name: "Particle Scroll",
    description:
      "Dissolves your live HTML below a chosen line into fine sand particles that reassemble on scroll.",
    video: "/assets/videos/particle-scroll.webm",
  },
  {
    href: "/docs/components/liquid-object",
    name: "Liquid Object",
    description:
      "Drags any 3D model, SVG, or image through invisible liquid that swirls under the cursor and splits the light into color.",
    video: "/assets/videos/liquid-object-leibox.webm",
  },
];
