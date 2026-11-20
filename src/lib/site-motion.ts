import manifest from '@/data/site-motion.json';

const components: Record<string, { documentUrl: string; previewUrl: string; viewportPlayback?: boolean }> = manifest.components;

export function siteMotionUrl(slug: string, preview = false): string {
  const item = components[slug];
  return (preview ? item?.previewUrl : item?.documentUrl) ?? `/motion/${slug}.html`;
}

export function usesViewportMotionPlayback(slug: string): boolean {
  return components[slug]?.viewportPlayback === true;
}
