import { SelectChoice } from "./select-choice";
import { RangeControl } from "./demo-controls";
import { useLayoutEffect, useRef } from "react";
import { BorderBeam } from "border-beam";
import { useDemoOption } from "./use-demo-option";

const sizes = {
  md: ["Traveling", "环绕"],
  sm: ["Compact", "紧凑"],
  line: ["Bottom line", "底部扫光"],
  "pulse-inner": ["Inner pulse", "内侧呼吸"],
  "pulse-outside": ["Outer pulse", "外溢呼吸"],
};

const palettes = {
  colorful: ["Rainbow", "彩虹", "#b696fd"],
  mono: ["Mono", "单色", "#a5a9b9"],
  ocean: ["Ocean", "海洋", "#7797ff"],
  sunset: ["Sunset", "落日", "#ee8d58"],
  forest: ["Forest", "森林", "#55ca99"],
  candy: ["Candy", "糖果", "#e773cb"],
  ice: ["Ice", "冰蓝", "#72d3e4"],
  gold: ["Gold", "金色", "#d4a650"],
};

function InterpolatedBeam(props) {
  const beam = useRef(null);

  useLayoutEffect(() => {
    const target = beam.current;
    const document = target.ownerDocument;
    if (target.getRootNode() === document) return;
    const upstreamStyle = target.previousElementSibling;
    if (upstreamStyle?.tagName !== "STYLE") return;
    const registration = document.createElement("style");
    // Chromium ignores @property registrations inside a shadow stylesheet.
    // Keep effect selectors scoped and register only the animatable values.
    const sync = () => {
      registration.textContent = [...(upstreamStyle.sheet?.cssRules ?? [])]
        .filter(rule => rule.cssText.startsWith("@property "))
        .map(rule => rule.cssText)
        .join("\n");
    };
    sync();
    document.head.append(registration);
    const observer = new MutationObserver(sync);
    observer.observe(upstreamStyle, { childList: true, characterData: true, subtree: true });
    return () => { observer.disconnect(); registration.remove(); };
  }, []);

  return <BorderBeam {...props} ref={beam} />;
}

export default function BorderBeamDemo({ reducedMotion, locale, options = {} }) {
  const zh = locale === "zh";
  const { size: initialSize, colorVariant: initialPalette, strength: initialStrength, active: initialActive, theme = "light" } = options;
  const [size, setSize] = useDemoOption(initialSize, "md");
  const [palette, setPalette] = useDemoOption(initialPalette, "colorful");
  const [strength, setStrength] = useDemoOption(initialStrength, 0.9);
  const [active, setActive] = useDemoOption(initialActive, true);

  const dark = theme !== "light";
  const [, , accent] = palettes[palette];
  const fg = dark ? "#f0eef6" : "#201c2b";
  const muted = dark ? "#a29eaf" : "#595269";
  const rule = dark ? "#312c3b" : "#e5e5e5";

  function wrap(child, radius, style) {
    const steady = reducedMotion && active && strength > 0;
    return (
      <InterpolatedBeam
        key={reducedMotion ? "steady" : "moving"}
        size={size}
        colorVariant={palette}
        borderRadius={radius}
        theme={theme}
        active={active && !reducedMotion}
        strength={strength}
        style={{
          ...style,
          ...(steady ? { borderRadius: radius, outline: `1px solid ${accent}`, boxShadow: `0 0 ${10 * strength}px ${accent}` } : {}),
        }}
      >
        {child}
      </InterpolatedBeam>
    );
  }

  const toggle = (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => setActive(!active)}
      style={{ padding: "0 16px", minHeight: 41, color: fg, borderRadius: 13, border: 0, background: dark ? "#282332" : "#f4f4f4", font: "inherit", fontSize: 13, fontWeight: 650, cursor: "pointer" }}
    >
      {active ? (zh ? "暂停流光" : "Pause beam") : (zh ? "开启流光" : "Start beam")}
    </button>
  );

  const panel = (
    <section
      aria-label={zh ? "描边演示" : "Border beam demo"}
      style={{ borderRadius: 23, color: fg, background: dark ? "#1a1721" : "#fff", padding: "20px 19px 18px", border: `1px solid ${rule}` }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <span aria-hidden="true" style={{ position: "relative", display: "grid", placeItems: "center", width: 43, height: 43, flex: "0 0 43px", borderRadius: 14, background: dark ? "#352747" : "#efe1fc", boxShadow: "inset 0 1px #ffffff25" }}>
          <span style={{ width: 14, height: 14, border: `2px solid ${dark ? "#d7bbfb" : "#6d3a93"}`, borderRadius: 4, transform: "rotate(45deg)" }} />
        </span>
        <div style={{ minWidth: 0, textAlign: "start", display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 15, fontWeight: 700 }}>{zh ? "边缘光效" : "Edge lighting"}</strong>
          <span aria-live="polite" style={{ color: muted, fontSize: 12 }}>{active ? (zh ? "运行中" : "Active") : (zh ? "已暂停" : "Paused")}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "end", marginTop: 15 }}>
        {size === "sm" ? wrap(toggle, 13) : toggle}
      </div>
    </section>
  );

  return (
    <>
      <div className="library-visual">
        <div style={{ width: "min(300px, 100%)", margin: "auto" }}>
          {size === "sm" ? panel : wrap(panel, 23, { width: "100%" })}
        </div>
      </div>
      <div className="library-controls">
        <SelectChoice label={zh ? "光效" : "Effect"} value={size} onChange={setSize} items={Object.entries(sizes).map(([key, labels]) => [key, labels[Number(zh)]])} />
        <SelectChoice label={zh ? "色板" : "Palette"} value={palette} onChange={setPalette} items={Object.entries(palettes).map(([key, labels]) => [key, labels[Number(zh)]])} />
        <RangeControl label={zh ? "强度" : "Intensity"} min={0} max={1} step={0.05} value={strength} display={Math.round(strength * 100) + "%"} onChange={setStrength} />
      </div>
    </>
  );
}
