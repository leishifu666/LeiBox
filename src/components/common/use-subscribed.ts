"use client";

import { usePreference } from "@/hooks/use-preference";

export const SUBSCRIBED_VALUES = ["no", "yes"] as const;

export type SubscribedValue = (typeof SUBSCRIBED_VALUES)[number];

export function useSubscribed() {
  return usePreference<SubscribedValue>(
    "newsletter-subscribed",
    "no",
    SUBSCRIBED_VALUES,
  );
}
