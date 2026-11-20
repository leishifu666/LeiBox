import { RangeControl, SegmentedChoice } from "./demo-controls";
import React, { memo, useMemo, useState } from "react";
import { Liquid } from "liquid-gooey";
import { useDemoOption } from "./use-demo-option";

const modes = {
  morph: ["Morph", "融合变形"],
  move: ["Move", "液体拖尾"],
  melt: ["Melt", "图像熔融"],
  bend: ["Bend", "柔性弯曲"],
};

const groupStyle = { width: "min(256px, 100%)", height: 132, margin: "0 auto" };
const clearChrome = { color: "#201744", border: 0, background: "transparent" };
const ink = "#171717";
const staticTransition = { duration: 0, ease: "linear" };

function MorphMenu({ open, setOpen, fill, setFill, reducedMotion, zh }) {
  const swatches = [[ink, "Ink", "墨黑"], ["#ffcadb", "Rose", "玫瑰"]];
  const choiceStyle = {
    ...clearChrome, width: 52, height: 52, borderRadius: 26, cursor: "pointer",
    display: "grid", placeItems: "center", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
  };
  const center = { position: "absolute", top: 57, left: "calc(50% - 26px)" };
  return (
    <Liquid fill={fill} blur={9} contrast={20} style={groupStyle}>
      {swatches.map(([color, en, cn], i) => (
        <Liquid.Item key={color} style={center} x={open ? (i === 0 ? -53 : 53) : 0} y={open ? -32 : 0} transition={reducedMotion ? staticTransition : "bouncy"} delay={reducedMotion ? 0 : i * 40}>
          <button type="button" style={choiceStyle} tabIndex={open ? 0 : -1} aria-hidden={!open} aria-label={zh ? cn : en} aria-pressed={fill === color} onClick={() => setFill(color)}>
            <span aria-hidden="true" style={{ width: 15, height: 15, borderRadius: "50%", background: i === 0 ? "#e9e9ed" : "#b83e73", boxShadow: `0 0 0 2px ${fill === color ? "#37255b" : "#ffffff80"}` }} />
          </button>
        </Liquid.Item>
      ))}
      <Liquid.Item style={{ position: "absolute", top: 51, left: "calc(50% - 32px)" }}>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? (zh ? "收起色板" : "Collapse palette") : (zh ? "展开色板" : "Expand palette")}
          style={{ ...clearChrome, color: fill === ink ? "#fff" : "#201744", width: 64, height: 64, borderRadius: 32, display: "grid", placeItems: "center", font: "28px/1 system-ui", cursor: "pointer" }}
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </Liquid.Item>
    </Liquid>
  );
}

function MovingLiquid({ mode, x, fill, reducedMotion, zh }) {
  return (
    <Liquid fill={fill} blur={9} contrast={20} style={groupStyle}>
      <Liquid.Item
        effect={reducedMotion ? "morph" : mode}
        observe
        move={{ springiness: 0.34, stretch: 0.7, trail: 0.67 }}
        bend={{ vertical: 0.65, horizontal: 0.8 }}
      >
        <div aria-hidden="true" style={{ ...clearChrome, color: fill === ink ? "#fff" : "#201744", position: "absolute", top: 35, left: "50%", transform: `translateX(calc(-50% + ${x}px))`, transition: reducedMotion ? "none" : "transform .29s cubic-bezier(.2,.8,.2,1)", width: mode === "bend" ? 103 : 75, height: 58, borderRadius: 29, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 650 }}>
          {modes[mode][Number(zh)]}
        </div>
      </Liquid.Item>
    </Liquid>
  );
}

// Generate two small color fields locally so the melt demo also works offline.
function createMeltTexture(cool) {
  const width = 112;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = width;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, width);
  const base = cool ? [29, 22, 84] : [117, 22, 85];
  const highlight = cool ? [167, 230, 255] : [255, 209, 116];
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / width;
      const wave = Math.sin(14 * v + 3.5 * Math.sin(4 * u + (cool ? 0 : 1.6)) + 1.2 * Math.cos(5 * v - 8 * u));
      const light = Math.pow((1 + wave) / 2, 1.45);
      const i = 4 * (y * width + x);
      for (let c = 0; c < 3; c++) image.data[i + c] = base[c] + (highlight[c] - base[c]) * light;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

const MeltPiece = memo(function MeltPiece({ src, side, reducedMotion }) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width="100" height="100" draggable="false" style={{ position: "absolute", top: 16, left: "calc(50% - 50px)", transform: `translateX(calc(var(--gooey-shift) * ${side}))`, transition: reducedMotion ? "none" : "transform .32s cubic-bezier(.2,.8,.2,1)", borderRadius: 24 }} />
  );
  return reducedMotion ? image : <Liquid.Item effect="melt" melt={{ warp: 13, mix: 0.8, blur: 9 }}>{image}</Liquid.Item>;
});

function MeltingImages({ distance, reducedMotion }) {
  const textures = useMemo(() => [createMeltTexture(true), createMeltTexture(false)], []);
  return (
    <Liquid style={{ ...groupStyle, "--gooey-shift": `${29 + distance * 0.32}px` }}>
      {textures.map((src, i) => <MeltPiece key={i} src={src} side={i === 0 ? -1 : 1} reducedMotion={reducedMotion} />)}
    </Liquid>
  );
}

export default function LiquidGooeyDemo({ reducedMotion, locale, options = {} }) {
  const zh = locale === "zh";
  const { mode: initialMode, open: initialOpen, fill: initialFill } = options;
  const [mode, setMode] = useDemoOption(initialMode, "morph");
  const [open, setOpen] = useDemoOption(initialOpen, true);
  const [fill, setFill] = useDemoOption(initialFill, ink);
  const [position, setPosition] = useState(50);

  const morph = mode === "morph";
  const melt = mode === "melt";
  return (
    <>
      <div className="library-visual">
        <div style={{ textAlign: "center", width: "min(306px, 100%)", boxSizing: "border-box", padding: "10px 8px" }}>
          {morph ? <MorphMenu open={open} setOpen={setOpen} fill={fill} setFill={setFill} reducedMotion={reducedMotion} zh={zh} /> :
            melt ? <MeltingImages distance={position} reducedMotion={reducedMotion} /> :
              <MovingLiquid mode={mode} x={(position - 50) * 1.24} fill={fill} reducedMotion={reducedMotion} zh={zh} />}

        </div>
      </div>
      <div className="library-controls">
        <SegmentedChoice label={zh ? "液态效果" : "Liquid effect"} value={mode} onChange={setMode} items={Object.entries(modes).map(([key, labels]) => [key, labels[Number(zh)]])} />
        {!morph && <RangeControl label={melt ? (zh ? "图像间距" : "Image spacing") : (zh ? "位置" : "Position")} value={position} onChange={setPosition} />}
      </div>
    </>
  );
}
