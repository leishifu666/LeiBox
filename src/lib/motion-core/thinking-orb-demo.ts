import { createThinkingOrb, type OrbState, type ThinkingOrbProps } from "./dissolve/thinking-orb.core";
import { createSurface, type MotionOptions } from "./motion-runtime";
import { THINKING_ORB_HEIGHT, THINKING_ORB_WIDTH } from "../../data/thinking-orb";

export type ThinkingOrbOptions = MotionOptions & ThinkingOrbProps & {
  showControls?: boolean;
  locale?: "en" | "zh";
};

const states = {
  idle: ["Idle", "待机"],
  thinking: ["Thinking", "思考"],
  searching: ["Searching", "搜索"],
  listening: ["Listening", "聆听"],
  done: ["Done", "完成"],
  error: ["Error", "错误"],
} satisfies Record<OrbState, [string, string]>;

const markup = `
<div class="orb-stage">
  <div class="orb-asset"></div>
  <div class="library-controls" hidden>
    <fieldset class="library-field">
      <legend data-orb-state-label></legend>
      <div class="library-segments">${Object.keys(states).map(state => `
        <label><input type="radio" name="orb-state" value="${state}"><span></span></label>`).join("")}</div>
    </fieldset>
    <label class="library-field library-range">
      <span data-orb-level-label></span>
      <span class="library-range-row">
        <input type="range" min="0" max="100" value="45">
        <output class="library-range-value" aria-hidden="true"></output>
      </span>
    </label>
  </div>
</div>`;

const styles = `
.orb-stage { display: grid; }
.orb-stage.library-demo { display: flex; }
.orb-stage .library-controls { padding-bottom: 3px; }
.orb-stage .library-range { margin-inline-start: auto; }
.orb-stage .library-range:has(input:disabled) { opacity: .72; }
@media (max-width: 540px) {
  .orb-stage .library-range { margin-inline-start: 0; }
}
`;

export function createThinkingOrbDemo(target: HTMLElement, initial: ThinkingOrbOptions, sharedStyles: string) {
  let options = { size: 96, haptics: false, ...initial };
  let selectedState: OrbState = "idle";
  let simulatedLevel = 0.45;
  let destroyed = false;
  const surfaceOptions = () => ({
    height: options.height ?? (options.showControls ? THINKING_ORB_HEIGHT : options.size),
    reducedMotion: options.reducedMotion,
  });
  const scope = createSurface(target, {
    markup, css: sharedStyles + styles, width: THINKING_ORB_WIDTH, height: THINKING_ORB_HEIGHT, responsive: true,
  }, surfaceOptions());
  const stage = scope.root.querySelector<HTMLElement>(".orb-stage")!;
  const host = scope.root.querySelector<HTMLElement>(".orb-asset")!;
  const controls = scope.root.querySelector<HTMLElement>(".library-controls")!;
  const radios = [...controls.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  const slider = controls.querySelector<HTMLInputElement>('input[type="range"]')!;
  const output = controls.querySelector("output")!;
  const stateLabel = controls.querySelector("[data-orb-state-label]")!;
  const levelLabel = controls.querySelector("[data-orb-level-label]")!;

  const orbOptions = (): ThinkingOrbProps => ({
    state: options.state ?? selectedState,
    size: options.size,
    level: options.level ?? (options.showControls ? simulatedLevel : undefined),
    interactive: options.interactive,
    color: options.color,
    dots: options.dots,
    dotSize: options.dotSize,
    haptics: options.haptics,
    reducedMotion: options.reducedMotion,
  });
  const orb = createThinkingOrb(host, orbOptions());

  function syncControls() {
    const zh = options.locale === "zh";
    const labelIndex = zh ? 1 : 0;
    const state = options.state ?? selectedState;
    const level = options.level ?? simulatedLevel;
    const percentage = Math.round((typeof level === "number" ? level : level.value) * 100);
    controls.hidden = !options.showControls;
    stage.classList.toggle("library-demo", !!options.showControls);
    stage.lang = zh ? "zh" : "en";
    stateLabel.textContent = zh ? "状态" : "State";
    levelLabel.textContent = zh ? "模拟音量" : "Simulated level";
    for (const radio of radios) {
      const radioState = radio.value as OrbState;
      radio.checked = radioState === state;
      radio.disabled = options.state !== undefined;
      radio.nextElementSibling!.textContent = states[radioState][labelIndex];
    }
    slider.disabled = state !== "listening" || options.level !== undefined;
    slider.value = String(percentage);
    output.value = percentage + "%";
    host.setAttribute("aria-label", zh ? `智能体状态，${states[state][1]}` : `Agent status, ${states[state][0]}`);
  }

  for (const radio of radios) {
    scope.on(radio, "change", () => {
      selectedState = radio.value as OrbState;
      orb.update(orbOptions());
      syncControls();
    });
  }
  scope.on(slider, "input", () => {
    simulatedLevel = slider.valueAsNumber / 100;
    orb.update({ level: simulatedLevel });
    syncControls();
  });
  scope.addCleanup(() => {
    destroyed = true;
    orb.destroy();
  });
  syncControls();
  return {
    ...scope.controller,
    update(next: ThinkingOrbOptions) {
      if (destroyed) return;
      options = { ...options, ...next };
      scope.controller.update(surfaceOptions());
      orb.update(orbOptions());
      syncControls();
    },
  };
}
