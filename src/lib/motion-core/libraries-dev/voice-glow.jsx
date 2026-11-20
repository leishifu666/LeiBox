import { SelectChoice } from "./select-choice";
import { RangeControl, SegmentedChoice } from "./demo-controls";
import { useCallback, useState } from "react";
import { VoiceBeam } from "voice-glow";

const style = `
.voice-glow-scene {
  display:grid;
  place-items:center;
  width:min(100%,500px);
  min-height:236px;
  padding:18px;

}
.voice-glow-host {width:min(100%,390px);min-width:0}
.voice-glow-host[data-layout="pill"] {width:min(100%,194px)}
.voice-glow-host[data-layout="mobile"] {width:min(100%,272px)}
.voice-glow-device {
  position:relative;
  display:flex;
  align-items:center;
  gap:12px;
  padding:18px;
  min-height:86px;
  border-radius:19px;
  background:#f5f5f5;
  color:#111;
}
[data-layout="pill"] .voice-glow-device {min-height:54px;padding:12px 16px;border-radius:28px}
[data-layout="mobile"] .voice-glow-device {align-items:flex-end;min-height:186px;border-radius:24px}
.voice-glow-label {position:relative;z-index:1;display:grid;gap:3px;min-width:0;line-height:1.25}
.voice-glow-label strong {font-size:14px;font-weight:600;overflow-wrap:anywhere}
.voice-glow-label small {font-size:12px;color:#646464}
.voice-glow-indicator {
  position:relative;
  z-index:1;
  flex:0 0 auto;
  align-self:center;
  width:9px;
  height:9px;
  border-radius:50%;
  background:#87899c;
}
[data-layout="mobile"] .voice-glow-indicator {align-self:flex-end;margin-bottom:19px}
[data-voice-state="listening"] .voice-glow-indicator {background:#239364}
[data-voice-state="processing"] .voice-glow-indicator {background:#7754c6}
@media (max-width: 360px) {
  .voice-glow-scene { min-height: 200px; padding: 8px; }
}
`;

const palettes = {
  colorful: ["Spectrum", "光谱"],
  mono: ["Mono", "单色"],
  ocean: ["Ocean", "海洋"],
  sunset: ["Sunset", "落日"],
  forest: ["Forest", "森林"],
  candy: ["Candy", "糖果"],
  ice: ["Ice", "冰蓝"],
  gold: ["Gold", "金色"],
};

const layouts = {
  default: ["Input", "输入框"],
  pill: ["Pill", "胶囊"],
  mobile: ["Mobile", "移动端"],
};

const states = {
  idle: ["Ready", "就绪"],
  listening: ["Listening", "聆听中"],
  processing: ["Processing", "处理中"],
};

export default function VoiceGlowScene({ reducedMotion, preview, locale, options = {} }) {
  const lang = locale === "zh" ? 1 : 0;
  const [selectedLayout, setLayout] = useState("default");
  const [selectedPalette, setPalette] = useState("colorful");
  const [selectedState, setVoiceState] = useState("listening");
  const [demoLevel, setDemoLevel] = useState(0.74);
  const layout = options.type ?? selectedLayout;
  const palette = options.colorVariant ?? selectedPalette;
  const voiceState = options.state ?? selectedState;
  const { level } = options;
  const activeStream = voiceState === "listening" ? options.stream : null;
  const getLevel = useCallback(() => {
    if (voiceState !== "listening") return 0;
    if (typeof level === "function") return level();
    if (typeof level === "number") return level;
    if (reducedMotion) return demoLevel;
    // Sample two syllable rhythms inside the upstream animation loop.
    const t = performance.now() / 1000;
    const syllables = (0.5 + 0.5 * Math.sin(t * 7.4)) ** 2;
    return demoLevel * (0.28 + 0.72 * syllables) * (0.82 + 0.18 * Math.sin(t * 1.4));
  }, [voiceState, level, reducedMotion, demoLevel]);
  const processingMotion = useCallback(() => ({
    gather: 1,
    offset: reducedMotion ? 0 : 0.75 * Math.sin(performance.now() / 360),
    stretch: reducedMotion ? 0 : 0.5,
    heldLevel: 0.65,
  }), [reducedMotion]);

  return <>
    <div className="library-visual voice-glow-scene" data-voice-state={voiceState}>
      <style>{style}</style>
      <div className="voice-glow-host" data-layout={layout}>
        <VoiceBeam
          type={layout}
          colorVariant={palette}
          theme="light"
          level={getLevel}
          stream={activeStream}
          motion={voiceState === "processing" ? processingMotion : null}
          borderRadius={layout === "mobile" ? 24 : layout === "pill" ? 28 : 19}
          idle={reducedMotion ? 0 : undefined}
          flow={reducedMotion ? 0 : undefined}
          distortion={reducedMotion ? 0 : undefined}
          staticColors={reducedMotion}
          attack={reducedMotion ? 0 : undefined}
          release={reducedMotion ? 0 : undefined}
        >
          <div className="voice-glow-device">
            <span className="voice-glow-indicator" aria-hidden="true" />
            <span className="voice-glow-label">
              <strong>{lang ? "语音输入" : "Voice input"}</strong>
              <small aria-live={preview ? "off" : "polite"}>{states[voiceState][lang]}</small>
            </span>
          </div>
        </VoiceBeam>
      </div>
    </div>
    {!preview && <div className="library-controls">
        <SegmentedChoice label={lang ? "布局" : "Layout"} value={layout} onChange={setLayout} disabled={options.type != null} items={Object.entries(layouts).map(([key, labels]) => [key, labels[lang]])} />
        <SelectChoice label={lang ? "色板" : "Palette"} value={palette} onChange={setPalette} disabled={options.colorVariant != null} items={Object.entries(palettes).map(([key, labels]) => [key, labels[lang]])} />
        <SegmentedChoice label={lang ? "状态" : "State"} value={voiceState} onChange={setVoiceState} disabled={options.state != null} items={Object.entries(states).map(([key, labels]) => [key, labels[lang]])} />
        <RangeControl label={lang ? "模拟音量" : "Simulated level"} value={Math.round(demoLevel * 100)} onChange={value => setDemoLevel(value / 100)} disabled={voiceState !== "listening" || options.level != null || Boolean(activeStream)} />
      </div>}
  </>;
}
