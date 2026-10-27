import type { Metadata } from "next";
import { T } from "@/components/common/language-provider";
import { ComponentDoc } from "@/components/docs/component-doc";
import { getMotionDocProps } from "@/components/docs/motion-doc-props";
import { OtpVerificationDemo } from "@/demos/otp-verification-demo";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "验证码输入验证 · OTP Input Verification",
  description: "六位验证码胶囊，保留输入、验证、错误摇动与成功反馈，附六框架源码和详细复刻提示词。",
  alternates: { canonical: "/docs/components/otp-verification" },
};
export default async function OtpVerificationPage() {
  const doc = await getMotionDocProps("otp-verification");
  return <div className="page-enter">
    <ComponentDoc {...doc} title="OTP Input Verification" installItem="otp-verification"
      description="A six-digit code unfolds from a pill, contracts to verify, and responds with an error shake or a green confirmation."
      tags={["Panel morphing", "6 frameworks", "TypeScript", "GSAP"]}
      beforeInstall={<section className="mt-8" aria-label="Demo">
        <h2 className="text-lg font-semibold tracking-[-0.01em]"><T>Demo</T></h2>
        <p className="mt-2 text-[13px] text-muted-foreground"><T>Click Enter code and type 123456 to succeed. Any other six digits show the error animation. This is local demo validation.</T></p>
        <div className="mt-3"><OtpVerificationDemo /></div>
      </section>}
      afterCode={<>{doc.afterCode}<p className="mt-3 text-[13px] leading-6 text-muted-foreground"><T>This is local demo validation. Replace it with your own server-side verification before using it for authentication.</T></p><p className="mt-3 text-xs text-muted-foreground"><a href="https://x.com/sucodeee" target="_blank" rel="noreferrer" className="rounded py-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"><T>Author</T> · sucodee</a></p></>}
      apiReference={[
        {name:"options.height",type:"number",defaultValue:"510",description:"Preferred scene height. The layout grows to fit content."},
        {name:"options.reducedMotion",type:"boolean",description:"Override the system reduced-motion preference without changing interaction states."},
        {name:"options.autoPlay",type:"boolean",defaultValue:"false",description:"Replay the incorrect-then-correct code sequence from the reference video."},
        {name:"options.onReplayComplete",type:"() => void",description:"Called when the reference sequence finishes."},
      ]}
    />
    <div className="mx-auto mt-24 w-full max-w-3xl"><Footer variant="docs" /></div>
  </div>;
}
