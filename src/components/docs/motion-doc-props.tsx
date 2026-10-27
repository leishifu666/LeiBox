import { INTERACTION_COMPONENTS } from "@/data/interaction-components";
import { getDocAssets } from "@/lib/doc-assets";
import { MotionCodeTabs, MotionInstallTabs, MotionUsage } from "@/components/docs/motion-framework-tabs";
import type { ComponentDocProps } from "@/components/docs/component-doc";

/** Feed local packages into the site's existing document component. */
export async function getMotionDocProps(slug: string): Promise<Pick<ComponentDocProps, "variants" | "copyContent" | "motionPackages" | "installation" | "code" | "afterCode">> {
  const packages = getDocAssets().motion[slug];
  const first = packages[0];
  return {
    variants: [],
    copyContent: { href: INTERACTION_COMPONENTS.find(entry => entry.slug === slug)!.href, prompt: first.prompt, code: "", codeLabel: "Copy full code bundle", markdown: "", bundleUrl: first.bundleUrl },
    motionPackages: packages,
    installation: <MotionInstallTabs packages={packages} />,
    code: <MotionCodeTabs packages={packages} />,
    afterCode: <MotionUsage packages={packages} />,
  };
}
