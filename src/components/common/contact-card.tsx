"use client";

import { Mail } from "lucide-react";

import { setContactOpen } from "@/components/common/contact-button";
import { T } from "@/components/common/language-provider";

export function ContactCard() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium tracking-tight"><T>A good find belongs here.</T></h3>
      <p className="text-sm leading-6 text-muted-foreground"><T>Send a UI reference, a component link, or an idea for the collection. Include the original source so its creator gets the credit.</T></p>
      <button type="button" onClick={(event) => setContactOpen(true, event.currentTarget)} aria-haspopup="dialog"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <Mail aria-hidden className="size-4" /><T>Contact or submit a find</T>
      </button>
      <p className="text-[12px] leading-5 text-muted-foreground"><T>Submissions are reviewed before they are added.</T></p>
    </div>
  );
}
