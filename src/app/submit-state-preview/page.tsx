import type { Metadata } from "next";

import { SubmitStatePreview } from "@/components/submit-state-preview/submit-state-preview";
import proposals from "@/data/submit-state-proposals.json";

export const metadata: Metadata = {
  title: "提交状态 · 六方案预览",
  robots: { index: false, follow: false },
};

export default function SubmitStatePreviewPage() {
  return <SubmitStatePreview proposals={proposals} />;
}
