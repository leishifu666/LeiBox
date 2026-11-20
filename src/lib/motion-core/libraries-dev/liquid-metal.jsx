import { RangeControl, SegmentedChoice } from "./demo-controls";
import React, { memo, useMemo, useRef, useState } from "react";
import { isMetalFxSupported, MetalBadge, MetalFx, MetalText, useMetalBend } from "metal-fx";
import { useDemoOption } from "./use-demo-option";

const presets = {
  chromatic: ["Chromatic", "虹彩"],
  silver: ["Silver", "银色"],
  gold: ["Gold", "金色"],
};

const BendRing = memo(function BendRing({ target }) {
  useMetalBend(target);
  return null;
});

export default function LiquidMetalDemo({ reducedMotion, preview, locale, options = {} }) {
  const zh = locale === "zh";
  const { preset: initialPreset, variant: initialVariant, strength: initialStrength, paused: initialPaused, theme = "light" } = options;
  const [preset, setPreset] = useDemoOption(initialPreset, "chromatic");
  const [variant, setVariant] = useDemoOption(initialVariant, "circle");
  const [strength, setStrength] = useDemoOption(initialStrength, 1);
  const [paused, setPaused] = useDemoOption(initialPaused, false);
  const [armed, setArmed] = useState(false);

  const ring = useRef(null);
  const panel = useRef(null);
  const reflection = useMemo(() => [{ ref: panel, strength: 0.3 }], []);
  const halted = reducedMotion || paused;
  const dark = theme === "dark";
  const circle = variant === "circle";
  const supported = useMemo(() => isMetalFxSupported(), []);
  const title = zh ? "信号" : "Signal";
  const state = armed ? (zh ? "已启动" : "Armed") : (zh ? "待机" : "Idle");
  const toggleLabel = armed ? (zh ? "关闭信号" : "Disarm signal") : (zh ? "启动信号" : "Arm signal");
  const color = dark ? "#e0e1ec" : "#30333d";
  const surface = dark ? "#242734" : "#fff";
  const font = "650 38px/1.08 system-ui, sans-serif";

  return (
    <>
      <div className="library-visual" style={{ overflow: "clip" }}>
        <div ref={panel} style={{ width: "min(326px, 100%)", padding: "23px 20px 23px", borderRadius: 25, display: "grid", gap: 22, color, boxSizing: "border-box", background: dark ? "#252735" : "#f5f5f5" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 41 }}>
            {halted ? <span style={{ font }}>{title}</span> : <MetalText font={font} color={color} theme={theme} strength={strength}>{title}</MetalText>}
            <div aria-live="polite" style={{ lineHeight: 1 }}>
              {halted ? <span style={{ padding: "5px 9px", borderRadius: 999, background: dark ? "#404656" : "#d5dbe6", color, fontSize: 11 }}>{state}</span> :
                <MetalBadge theme={theme} strength={strength} scale={1.14}>{state}</MetalBadge>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 58, paddingTop: 8 }}>
            <div aria-hidden="true" style={{ display: "flex", height: 32, alignItems: "center", gap: 3, minWidth: 44 }}>
              {[12, 20, 29, 17, 11].map((height, i) => (
                <span key={i} style={{ display: "block", height: armed ? height : 5, width: 4, borderRadius: 4, background: armed ? (dark ? "#8ad2b6" : "#24775c") : (dark ? "#737c91" : "#7d8798"), transition: reducedMotion ? "none" : "height .16s ease-out" }} />
              ))}
            </div>
            <MetalFx ref={ring} preset={preset} variant={variant} theme={theme} paused={halted} strength={strength} normalizeHostStyles={false} reflectionTargets={reflection} innerShadow ringCssPx={circle ? 2.5 : 2} style={{ backgroundColor: surface }}>
              <button
                type="button"
                aria-label={toggleLabel}
                aria-pressed={armed}
                onClick={() => setArmed(!armed)}
                style={{ minWidth: circle ? 54 : 110, minHeight: 48, height: circle ? 54 : 48, padding: circle ? 0 : "0 13px", borderRadius: 30, border: supported ? 0 : `1px solid ${dark ? "#52586b" : "#a7afc1"}`, background: supported ? "transparent" : surface, color, font: "650 13px/1 system-ui, sans-serif", cursor: "pointer" }}
              >
                {circle ? <span aria-hidden="true" style={{ display: "inline-block", width: 11, height: 11, borderRadius: "50%", border: `2px solid ${armed ? (dark ? "#8ad2b6" : "#24775c") : (dark ? "#ced2e0" : "#758098")}`, background: armed ? (dark ? "#8ad2b6" : "#24775c") : "transparent" }} /> : toggleLabel}
              </button>
            </MetalFx>
            {supported && circle && !halted && !preview && <BendRing target={ring} />}
          </div>
        </div>
      </div>
      <div className="library-controls">
        <SegmentedChoice label={zh ? "金属材质" : "Finish"} value={preset} onChange={setPreset} items={Object.entries(presets).map(([key, labels]) => [key, labels[Number(zh)]])} />
        <SegmentedChoice label={zh ? "形状" : "Shape"} value={variant} onChange={setVariant} items={[["circle", zh ? "圆形" : "Circle"], ["button", zh ? "胶囊" : "Pill"]]} />
        <RangeControl label={zh ? "反光强度" : "Intensity"} min={0} max={1} step={0.05} value={strength} display={Math.round(strength * 100) + "%"} onChange={setStrength} />
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? (zh ? "恢复动效" : "Resume motion") : (zh ? "暂停动效" : "Pause motion")}
        </button>
      </div>
    </>
  );
}
