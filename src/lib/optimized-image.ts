import media from "@/data/optimized-media.json";

export function optimizedImage(src: string, sizes = "(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw") {
  const image = (media.images as Record<string, { src: string; srcSet: string }>)[src];
  return image ? { ...image, sizes } : { src };
}
export const heroVideo = media.video;
export function previewPoster(src: string) {
  return (media.previews as Record<string, string>)[src];
}
