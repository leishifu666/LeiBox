"use client";

import type { ReactNode } from "react";

import { useSubscribed } from "@/components/common/use-subscribed";

export function NewsletterGate({ children }: { children: ReactNode }) {
  const [subscribed] = useSubscribed();

  if (subscribed === "yes") return null;

  return <>{children}</>;
}
