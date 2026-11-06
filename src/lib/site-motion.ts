import manifest from '@/data/site-motion.json';

export function siteMotionUrl(slug: string, preview = false): string {
  const item = (manifest.components as Record<string, { documentUrl: string; previewUrl: string }>)[slug];
  return (preview ? item?.previewUrl : item?.documentUrl) ?? `/motion/${slug}.html`;
}
