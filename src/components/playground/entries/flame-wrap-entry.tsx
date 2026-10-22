"use client";

import { DemoControls } from "@/components/demos/demo-controls";
import { EntryPage } from "@/components/playground/entries/shared";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { FlameWrap } from "@/components/docs/live/FlameWrap";
import {
  FLAME_WRAP_CONTROLS,
  FlameProfileCard,
  hexToRgb,
} from "@/demos/flame-wrap-demo";

export function FlameWrapEntry() {
  const controls = useDemoControls(FLAME_WRAP_CONTROLS);
  const { flame, ...values } = controls.values;
  const rgb = hexToRgb(flame);

  return (
    <>
      <EntryPage>
        <div className="relative flex min-h-[calc(100svh-8rem)] items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background">
          <FlameWrap
            {...values}
            color={rgb}
            className="w-[300px] sm:w-[340px]"
            style={{ height: 340 }}
          >
            <FlameProfileCard radius={values.radius} />
          </FlameWrap>
        </div>
      </EntryPage>

      <DemoControls
        title="Flame Wrap controls"
        snippet={{
          component: "FlameWrap",
          props: { ...values, color: rgb },
        }}
        controls={controls}
      />
    </>
  );
}
