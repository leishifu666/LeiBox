import type { Metadata } from "next";
import { T } from "@/components/common/language-provider";
import { ComponentDoc } from "@/components/docs/component-doc";
import { getMotionDocProps } from "@/components/docs/motion-doc-props";
import { ShareInviteDemo } from "@/demos/share-invite-demo";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "分享邀请面板 · Share Invite Panel",
  description: "分享邀请面板，附 React、Vue、Svelte、Solid、Preact、Vanilla 六框架代码和详细复刻提示词。",
  alternates: { canonical: "/docs/components/share-invite" },
};
export default async function ShareInvitePage() {
  const doc = await getMotionDocProps("share-invite");
  return <div className="page-enter">
    <ComponentDoc {...doc} title="Share Invite Panel"
      description="An expandable sharing panel with email invitations, member roles, and a real copy-link action."
      installItem="share-invite" tags={["Panel morphing", "6 frameworks", "TypeScript", "GSAP"]}
      beforeInstall={<section className="mt-8" aria-label="Demo">
        <h2 className="text-lg font-semibold tracking-[-0.01em]"><T>Demo</T></h2>
        <p className="mt-2 text-[13px] text-muted-foreground"><T>Try closing the panel, adding an email, or changing a role. Invitations stay in this preview; no email is sent.</T></p>
        <div className="mt-3"><ShareInviteDemo /></div>
      </section>}
      afterCode={<>{doc.afterCode}<p className="mt-3 text-xs text-muted-foreground"><a className="rounded py-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href="https://x.com/sucodeee" target="_blank" rel="noreferrer"><T>Author</T> · sucodee</a></p></>}
      apiReference={[
        {name:"options.height",type:"number",defaultValue:"500",description:"Preferred scene height. The layout grows to fit content."},
        {name:"options.reducedMotion",type:"boolean",description:"Override the system reduced-motion preference without changing interaction states."},
        {name:"options.locale",type:'"en" | "zh"',defaultValue:'"en"',description:"Language of the sharing panel. Documentation language does not change the original preview."},
      ]}
    />
    <div className="mx-auto mt-24 w-full max-w-3xl"><Footer variant="docs" /></div>
  </div>;
}
