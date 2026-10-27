import type { Metadata } from "next";
import { T } from "@/components/common/language-provider";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = { title: "LeiBox 隐私政策", description: "雷师傅的 LeiBox 网站如何处理留言与投稿、浏览器偏好、组件演示和第三方服务。", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <><Navbar /><main className="page-enter flex flex-1 flex-col">
    <article className="mx-auto w-full max-w-2xl px-5 pt-28 pb-24 text-[15px] leading-7 text-muted-foreground sm:px-8 sm:pt-36">
      <h1 className="text-3xl font-medium tracking-tighter text-foreground sm:text-4xl"><T>Privacy policy</T></h1>
      <p className="mt-4 text-sm"><T>Last updated: October 22, 2026</T></p>
      <p className="mt-4"><T>LeiBox is a personal website maintained by Lei Shifu to collect UI inspiration, components, and interaction examples. This policy applies to LeiBox; linked websites have their own privacy policies.</T></p>
      <h2 className="mt-10 text-lg font-medium text-foreground"><T>Messages and component submissions</T></h2>
      <p className="mt-3"><T>When you contact me, you choose to provide a reply email, optional name, message, and reference link. I use them to read your submission, evaluate the suggested component, and reply. Sending a message does not subscribe you to a mailing list.</T></p>
      <p className="mt-3"><T>If email delivery is configured, Resend forwards your message to my inbox. If delivery is unavailable, the page reports the failure and offers an email-app link. LeiBox does not save contact messages in a site database; messages may remain in my mailbox and the email provider’s records.</T></p>
      <h2 className="mt-10 text-lg font-medium text-foreground"><T>Browser preferences and component previews</T></h2>
      <p className="mt-3"><T>Language, theme, code-file selection, framework, and similar display preferences are saved in your browser. Clearing this website’s data in your browser resets these choices.</T></p>
      <p className="mt-3"><T>Emails and members entered in the Share & Invite preview stay in the current page. The preview does not send invitation emails or change real permissions. Reloading or resetting it clears that demo state.</T></p>
      <h2 className="mt-10 text-lg font-medium text-foreground"><T>Copy buttons and external services</T></h2>
      <p className="mt-3"><T>A copy button writes the selected prompt, code, or link to your clipboard. LeiBox does not read other clipboard contents. If your browser blocks access, the page reports the failure.</T></p>
      <p className="mt-3"><T>Source links, GitHub, ChatGPT, and Claude open the relevant external service. AI shortcuts open the prompt you selected; LeiBox does not call an AI API to send messages for you. External images, fonts, and videos may contact their providers when loaded; those providers apply their own privacy policies.</T></p>
      <h2 className="mt-10 text-lg font-medium text-foreground"><T>Website operation</T></h2>
      <p className="mt-3"><T>Your browser sends ordinary connection information, including its IP address and request details, to the hosting server. Hosting providers may process it to serve pages, prevent abuse, and diagnose faults. Contact requests use temporary request counters to limit repeated submissions. The current website includes no advertising trackers or user-profiling scripts.</T></p>
      <h2 className="mt-10 text-lg font-medium text-foreground"><T>Your choices and contact</T></h2>
      <p className="mt-3"><T>You can browse without submitting a message. To ask about information you sent, request a correction, or ask me to remove a message from my mailbox, contact the address below. I will check the request and handle information within my control; third-party providers may retain records under their own policies.</T></p>
      <p className="mt-3"><T>I will update this page when the website’s information-handling features change. The date above identifies the current version.</T></p>
      <p className="mt-3"><a className="text-foreground underline underline-offset-4" href="mailto:leir0491@gmail.com">leir0491@gmail.com</a></p>
    </article><Footer /></main></>;
}
