"use client";

import { T as TranslatedText, useLanguage } from "@/components/common/language-provider";


import { play } from "cuelume";
import { useState } from "react";

import { effectPortalContainer } from "@/components/common/effect-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ChoiceOption<T extends string = string> {
  id: T;
  label: string;
}

export function ChoiceSelect<T extends string>({
  label,
  options,
  value,
  onValueChange,
  align,
  className,
  variant = "select",
}: {
  /** Accessible name for the control, e.g. "Framework". */
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Which trigger edge the popup hangs from. `"end"` for a right-flush row. */
  align?: "start" | "end";
  className?: string;
  /** `"tabs"` shows a tablist on `sm`+ (for short lists); select otherwise. */
  variant?: "select" | "tabs";
}) {
  // The trigger remounts when an effect wrapper flips between its native and
  // fallback DOM, so resolving from the current element stays accurate.
  const { t } = useLanguage();
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const container = effectPortalContainer(trigger);

  const select = (next: T) => {
    onValueChange(next);
    play("bloom");
  };

  return (
    <>
      {variant === "tabs" ? (
        <div
          role="tablist"
          aria-label={t(label)}
          className={cn("hidden items-center sm:flex", className)}
        >
          {options.map((option) => {
            const selected = option.id === value;
            return (
              <button
                key={option.id}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => select(option.id)}
                className={cn(
                  "relative shrink-0 px-3 py-2.5 text-[13px] transition-colors duration-150",
                  selected
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TranslatedText>{option.label}</TranslatedText>
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-px bg-foreground transition-opacity duration-150",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <Select<T>
        value={value}
        onValueChange={(next) => {
          if (next === null) return;
          select(next);
        }}
      >
        <SelectTrigger
          ref={setTrigger}
          aria-label={t(label)}
          className={cn(
            "my-1.5 min-w-0",
            variant === "tabs" && "sm:hidden",
            className,
          )}
        >
          <SelectValue className="truncate">
            {(current: T | null) =>
              t(options.find((option) => option.id === current)?.label ?? label)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent align={align} container={container}>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <TranslatedText>{option.label}</TranslatedText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
