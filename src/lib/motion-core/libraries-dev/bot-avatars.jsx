import { SelectChoice } from "./select-choice";
import { SegmentedChoice } from "./demo-controls";
import { useState } from "react";
import { BotAvatar, botAvatarTypes } from "bot-avatars";

const shapesZh = ["四叶草", "花朵", "三角", "方块", "团子", "幽灵", "圆球", "水滴", "星星", "机器人", "机甲", "外星人", "六边形", "猫咪", "云朵", "胶囊", "卵石", "水洼"];
const materials = {
  fabric: ["Fabric", "绒布"],
  plastic: ["Plastic", "亮面塑料"],
  crisp: ["Crisp", "锐利边缘"],
  smooth: ["Smooth", "柔和表面"],
  flat: ["Flat", "哑光"],
};
const states = {
  default: ["Idle", "待命"],
  working: ["Working", "工作中"],
  sleeping: ["Sleeping", "休眠"],
};
const faces = { eyes: ["Eyes", "眼睛"], mouth: ["Eyes and mouth", "眼睛和嘴巴"] };

const css = `
.bot-demo-panel {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  justify-items: center;
  width: min(100%, 500px);
  min-height: 244px;
}
.bot-demo-avatar { width: min(42vw, 192px); }
.bot-demo-avatar canvas { display: block; }
.bot-demo-companion { opacity: .78; }
@media (max-width: 350px) {
  .bot-demo-panel { min-height: 205px; }
}
`;

export default function BotAvatarsScene({ reducedMotion, locale, options }) {
  const zh = locale === "zh";
  const [selectedType, setType] = useState("clover");
  const [selectedState, setState] = useState("default");
  const [selectedShading, setShading] = useState("fabric");
  const [selectedFace, setFace] = useState("eyes");
  const type = options.type ?? selectedType;
  const state = options.state ?? selectedState;
  const shading = options.shading ?? selectedShading;
  const face = options.face ?? selectedFace;

  return (
    <>
      <style>{css}</style>
      <div className="library-visual">
        <div className="bot-demo-panel">
          <BotAvatar className="bot-demo-companion" aria-hidden="true" type="cat" shading="plastic" state="sleeping" size="clamp(45px, 14vw, 92px)" paused />
          <div className="bot-demo-avatar">
            <BotAvatar type={type} state={state} shading={shading} face={face} size="100%" paused={reducedMotion} />
          </div>
          <BotAvatar className="bot-demo-companion" aria-hidden="true" type="star" state="default" size="clamp(45px, 14vw, 92px)" paused />
        </div>
      </div>
      <div className="library-controls">
        <SelectChoice label={zh ? "造型" : "Shape"} value={type} onChange={setType} disabled={options.type != null} items={botAvatarTypes.map((key, index) => [key, zh ? shapesZh[index] : key.charAt(0).toUpperCase() + key.slice(1)])} />
        <SegmentedChoice label={zh ? "状态" : "State"} value={state} onChange={setState} disabled={options.state != null} items={Object.entries(states).map(([key, labels]) => [key, labels[zh ? 1 : 0]])} />
        <SelectChoice label={zh ? "材质" : "Material"} value={shading} onChange={setShading} disabled={options.shading != null} items={Object.entries(materials).map(([key, labels]) => [key, labels[zh ? 1 : 0]])} />
        <SegmentedChoice label={zh ? "五官" : "Face"} value={face} onChange={setFace} disabled={options.face != null} items={Object.entries(faces).map(([key, labels]) => [key, labels[zh ? 1 : 0]])} />
      </div>
    </>
  );
}
