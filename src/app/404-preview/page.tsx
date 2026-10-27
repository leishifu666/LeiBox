import type { Metadata } from "next";
import { Suspense } from "react";

import { NotFoundExperiments } from "@/components/not-found-experiments/not-found-experiments";
import { getNotFoundItems } from "@/lib/not-found-items";

export const metadata: Metadata = {
  title: "404 design previews",
  robots: { index: false, follow: false },
};

export default function NotFoundPreviewPage() {
  return <Suspense><NotFoundExperiments items={getNotFoundItems()} /></Suspense>;
}
