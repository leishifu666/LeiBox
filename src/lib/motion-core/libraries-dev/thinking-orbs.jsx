import { SelectChoice } from "./select-choice";
import { SegmentedChoice } from "./demo-controls";
import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";

const states = {
  working: ["Working", "处理中", "#5040a2"],
  searching: ["Searching", "搜索中", "#1b7394"],
  solving: ["Solving", "推理中", "#9b6429"],
  listening: ["Listening", "聆听中", "#327e60"],
  connecting: ["Connecting", "连接中", "#216790"],
  weaving: ["Weaving", "编织中", "#8c3d98"],
  composing: ["Composing", "撰写中", "#a34175"],
  breathing: ["Breathing", "呼吸中", "#5159a2"],
  shaping: ["Shaping", "塑形中", "#376d92"],
};

const css = `
.orb-demo-panel {
  width: min(100%, 500px);
  min-height: 246px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 17px;
  padding: 18px;
}
.orb-demo-well { display: grid; place-items: center; width: 140px; height: 140px; }
.orb-demo-well canvas { transform: scale(2); }
.orb-demo-status { color: #5f5f5f; font-size: 14px; font-weight: 540; }
`;

export default function ThinkingOrbsScene({ reducedMotion, locale, options }) {
  const zh = locale === "zh";
  const [selectedState, setState] = useState("working");
  const [selectedSize, setSize] = useState(64);
  const [paused, setPaused] = useState(false);
  const state = options.state ?? selectedState;
  const size = options.size ?? selectedSize;
  const stateLabel = states[state][zh ? 1 : 0];

  return (
    <>
      <style>{css}</style>
      <div className="library-visual">
        <div className="orb-demo-panel">
          <div className="orb-demo-well">
            <ThinkingOrb aria-hidden="true" state={state} size={size} color={states[state][2]} theme="light" paused={reducedMotion || paused} speed={options.speed} />
          </div>
          <span className="orb-demo-status" role="status">{stateLabel}</span>
        </div>
      </div>
      <div className="library-controls">
        <SelectChoice label={zh ? "状态" : "State"} value={state} onChange={setState} disabled={options.state != null} items={Object.entries(states).map(([key, labels]) => [key, labels[zh ? 1 : 0]])} />
        <SegmentedChoice label={zh ? "大小" : "Size"} value={size} onChange={setSize} disabled={options.size != null} items={[64, 32, 20].map(value => [value, value + " px"])} />
        <button type="button" disabled={reducedMotion} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          {zh ? (paused ? "继续" : "暂停") : (paused ? "Resume" : "Pause")}
        </button>
      </div>
    </>
  );
}
