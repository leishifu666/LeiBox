import type { Metadata } from "next";

import { LogoTransitionPreview } from "@/components/logo-transition-preview/logo-transition-preview";
import proposals from "@/data/logo-motion-proposals.json";

export const metadata: Metadata = {
  title: "Logo 过渡 · 六方案预览",
  robots: { index: false, follow: false },
};

export default function LogoTransitionPreviewPage() {
  return <LogoTransitionPreview proposals={proposals} />;
}
