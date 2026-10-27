import type { Metadata } from "next";
import { T } from "@/components/common/language-provider";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = { title: "来源与使用说明", description: "LeiBox 的学习用途、第三方内容来源与许可、权利人联系说明。", alternates: { canonical: "/copyright" } };

const sections = [
  { heading: "Check each source", paragraphs: [
    "Component pages record available design references, code sources and license information. A public link, an attribution, free access or a rewritten implementation does not by itself prove permission to use protected material.",
    "Where permission is unclear, obtain authorization from the rights holder or use independently created, licensed replacements before publishing or redistributing the material.",
  ] },
  { heading: "Media and trademarks", paragraphs: [
    "A component's code license does not necessarily cover its photographs, album covers, fonts, illustrations, trademarks or reference designs. Replace these with material you own or are licensed to use; do not present third-party work as your own.",
    "Copyright and source notices are retained where applicable to existing code. This page does not relicense third-party work or promise that every use is permitted.",
  ] },
  { heading: "Rights-holder contact", paragraphs: [
    "If you are a rights holder, please send the affected page URL, your original work or proof of rights, the issue, and a way to contact you. I will review the request and, as appropriate, correct attribution, replace material or remove it.",
  ] },
];

export default function CopyrightPage() {
  return <><Navbar /><main className="page-enter flex flex-1 flex-col">
    <article className="mx-auto w-full max-w-2xl px-5 pt-28 pb-24 text-[15px] leading-7 text-muted-foreground sm:px-8 sm:pt-36">
      <h1 className="text-3xl font-medium tracking-tighter text-foreground sm:text-4xl"><T>Sources and permissions</T></h1>
      <p className="mt-4 text-sm"><T>Updated October 28, 2026</T></p>
      <p className="mt-8 font-medium text-foreground"><T>For learning use only.</T></p>
      <p className="mt-3"><T>LeiBox is a personal UI study and interaction experiment. It is not an official website of the referenced designers or projects, and does not imply their endorsement.</T></p>
      <p className="mt-3"><T>The learning notice describes this project's purpose. It does not replace a license, transfer copyright, or grant permission to copy, distribute or use third-party material commercially.</T></p>
      {sections.map(section => <section key={section.heading} className="mt-10"><h2 className="text-lg font-medium text-foreground"><T>{section.heading}</T></h2>{section.paragraphs.map(text => <p key={text} className="mt-3"><T>{text}</T></p>)}</section>)}
      <a href="mailto:leir0491@gmail.com" className="mt-3 inline-block text-foreground underline underline-offset-4">leir0491@gmail.com</a>
    </article><Footer /></main></>;
}
