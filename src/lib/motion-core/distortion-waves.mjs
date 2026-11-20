import { createSurface } from "./motion-runtime";
import { WaveController } from "./distortion-waves-engine.mjs";
import { createModeMorph } from "./distortion-waves-mode-morph.mjs";

const TYPES = ["vertical", "center", "horizontal"];
const PALETTE_LIST = ["colorful", "green", "ocean", "sunset", "mono"];

const CHECK_LG_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.6 4.6L19 7.8"/></svg>`;
const CHECK_SM_SVG = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-4.8"/></svg>`;
const COINS_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="10" cy="7" rx="6" ry="2.6"/><path d="M4 7v5c0 1.44 2.69 2.6 6 2.6s6-1.16 6-2.6V7"/><path d="M16 10.6c2.38.44 4 1.35 4 2.4v4c0 1.44-2.69 2.6-6 2.6-2.46 0-4.58-.64-5.5-1.56"/></svg>`;
const ARROW_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8h9"/><path d="M8.5 4l4 4-4 4"/></svg>`;
const BACK_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 8h-9"/><path d="M7.5 4l-4 4 4 4"/></svg>`;

function contentMarkup(mode, avatar) {
  if (mode === "center") {
    return `<div class="dw-view">
      <div class="dw-badge dw-badge--token" data-dw-source-token>${COINS_SVG}</div>
      <h3 class="dw-title">Add credits</h3>
      <p class="dw-caption">Current balance: $65.73</p>
      <ul class="dw-checklist">
        <li><span class="dw-check-dot">${CHECK_SM_SVG}</span><span>Balance goes to $85.73 right away</span></li>
        <li><span class="dw-check-dot">${CHECK_SM_SVG}</span><span>Use credits for document rewrites</span></li>
        <li><span class="dw-check-dot">${CHECK_SM_SVG}</span><span>Credits never expire</span></li>
      </ul>
    </div>`;
  }
  if (mode === "horizontal") {
    return `<div class="dw-view">
      <span class="dw-h-tag">Draft · v2.4</span>
      <h3 class="dw-h-title">Release Notes</h3>
      <p class="dw-h-desc">4 shader presets, OKLab edge fringes and live DOM capture ready for production rollout.</p>
      <div class="dw-h-meta">
        <span>Bundle <strong>18.4 kB</strong></span>
        <span>Targets <strong>6 frameworks</strong></span>
      </div>
    </div>`;
  }
  return `<div class="dw-view">
    <div class="dw-badge"><img src="${avatar}" width="48" height="48" alt=""></div>
    <p class="dw-subtitle">Sending to <strong>Maya Chen</strong></p>
    <p class="dw-amount">$1,250.00</p>
    <div class="dw-rows">
      <div class="dw-row"><span class="dw-row-label">From</span><span class="dw-row-value">Everyday ·· 4821</span></div>
      <div class="dw-row"><span class="dw-row-label">Arrives</span><span class="dw-row-value">In seconds</span></div>
      <div class="dw-row"><span class="dw-row-label">Fee</span><span class="dw-row-value">Free</span></div>
      <div class="dw-row"><span class="dw-row-label">Note</span><span class="dw-row-value">Studio rent</span></div>
    </div>
  </div>`;
}

function revealedMarkup(mode) {
  if (mode === "center") {
    return `<div class="dw-view">
      <div class="dw-badge dw-badge--check">${CHECK_LG_SVG}</div>
      <h3 class="dw-title">Credits added</h3>
      <p class="dw-caption">New balance: $85.73</p>
      <ul class="dw-checklist">
        <li><span class="dw-check-dot dw-check-dot--ok">${CHECK_SM_SVG}</span><span>$20.00 credited immediately</span></li>
        <li><span class="dw-check-dot dw-check-dot--ok">${CHECK_SM_SVG}</span><span>Ready for document rewrites</span></li>
        <li><span class="dw-check-dot dw-check-dot--ok">${CHECK_SM_SVG}</span><span>Receipt #DW-4082 saved</span></li>
      </ul>
    </div>`;
  }
  if (mode === "horizontal") {
    return `<div class="dw-view">
      <span class="dw-h-tag dw-h-tag--done">Published · Live</span>
      <h3 class="dw-h-title">Release Shipped</h3>
      <p class="dw-h-desc">Edge cache updated across all regions. Rollback snapshot stored for instant recovery.</p>
      <div class="dw-h-meta">
        <span>Status <strong>Healthy</strong></span>
        <span>Latency <strong>14 ms</strong></span>
      </div>
    </div>`;
  }
  return `<div class="dw-view">
    <div class="dw-badge dw-badge--check">${CHECK_LG_SVG}</div>
    <p class="dw-subtitle">Sent to <strong>Maya Chen</strong></p>
    <p class="dw-amount">$1,250.00</p>
    <div class="dw-rows">
      <div class="dw-row"><span class="dw-row-label">From</span><span class="dw-row-value">Everyday ·· 4821</span></div>
      <div class="dw-row"><span class="dw-row-label">Arrived</span><span class="dw-row-value dw-row-value--ok">Just now</span></div>
      <div class="dw-row"><span class="dw-row-label">Fee</span><span class="dw-row-value">Free</span></div>
      <div class="dw-row"><span class="dw-row-label">Note</span><span class="dw-row-value">Studio rent</span></div>
    </div>
  </div>`;
}

function buttonContent(mode, revealed) {
  if (mode === "horizontal") {
    return revealed ? `${BACK_SVG}<span>Back</span>` : `${ARROW_SVG}<span>Ship</span>`;
  }
  if (mode === "center") {
    return revealed ? "Done" : "Buy $20 tokens";
  }
  return revealed ? "Done" : "Confirm";
}

function defaultPaletteFor(mode) {
  return mode === "center" ? "green" : mode === "horizontal" ? "ocean" : "colorful";
}

export function createDistortionWaves(target, options = {}, { css, avatar, gallery = false }) {
  let mode = TYPES.includes(options.type) ? options.type : "vertical";
  let customPalette = options.palette ?? null;
  let revealed = Boolean(options.revealed);
  let scrub = options.scrub ?? null;
  let showControls = gallery ? false : (options.showControls ?? true);
  let onRevealedChange = options.onRevealedChange;
  let onFinish = options.onFinish;

  const markup = `<div class="dw-scene" data-gallery="${gallery ? "true" : "false"}" data-revealed="false" data-mode="${mode}">
    <div class="dw-stage">
      <div class="dw-card" data-distortion-wave data-mode="${mode}">
        <div class="dw-layer" data-dw-layer="content"></div>
        <div class="dw-layer" data-dw-layer="revealed"></div>
        <div class="dw-overlay" data-dw-layer="overlay" data-dw-skip>
          <button type="button" class="dw-cta" data-dw-cta>Confirm</button>
        </div>
      </div>
    </div>
    <div class="dw-controls" data-dw-controls>
      <div class="dw-seg" role="group" aria-label="Wave type">
        <span class="dw-mode-highlight" aria-hidden="true"></span>
        <button type="button" class="dw-seg-btn" data-type="vertical" aria-pressed="true">Vertical</button>
        <button type="button" class="dw-seg-btn" data-type="center" aria-pressed="false">Center</button>
        <button type="button" class="dw-seg-btn" data-type="horizontal" aria-pressed="false">Horizontal</button>
      </div>
      <div class="dw-swatches" role="group" aria-label="Wave palette">
        <button type="button" class="dw-swatch dw-swatch--colorful" data-palette="colorful" aria-label="Colorful palette" aria-pressed="true"></button>
        <button type="button" class="dw-swatch dw-swatch--green" data-palette="green" aria-label="Green palette" aria-pressed="false"></button>
        <button type="button" class="dw-swatch dw-swatch--ocean" data-palette="ocean" aria-label="Ocean palette" aria-pressed="false"></button>
        <button type="button" class="dw-swatch dw-swatch--sunset" data-palette="sunset" aria-label="Sunset palette" aria-pressed="false"></button>
        <button type="button" class="dw-swatch dw-swatch--mono" data-palette="mono" aria-label="Mono palette" aria-pressed="false"></button>
      </div>
    </div>
  </div>`;

  const scope = createSurface(target, { markup, css, width: 820, height: 540, responsive: true }, options);
  const scene = scope.root.querySelector(".dw-scene");
  const card = scope.root.querySelector(".dw-card");
  const contentLayer = scope.root.querySelector('[data-dw-layer="content"]');
  const revealedLayer = scope.root.querySelector('[data-dw-layer="revealed"]');
  const cta = scope.root.querySelector("[data-dw-cta]");
  const controls = scope.root.querySelector("[data-dw-controls]");
  const typeButtons = [...scope.root.querySelectorAll("[data-type]")];
  const swatchButtons = [...scope.root.querySelectorAll("[data-palette]")];
  const modeMorph = createModeMorph(scope, {
    card, contentLayer, revealedLayer, button: cta,
    overlay: scope.root.querySelector(".dw-overlay"),
    segment: scope.root.querySelector(".dw-seg"),
  });

  const activePalette = () => customPalette || defaultPaletteFor(mode);

  const renderViews = () => {
    card.dataset.mode = mode;
    scene.dataset.mode = mode;
    contentLayer.innerHTML = contentMarkup(mode, avatar);
    revealedLayer.innerHTML = revealedMarkup(mode);
    cta.classList.toggle("dw-cta--rail", mode === "horizontal");
    cta.innerHTML = buttonContent(mode, revealed);
    controls.hidden = !showControls;
    const pal = activePalette();
    typeButtons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.type === mode)));
    swatchButtons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.palette === pal)));
    modeMorph.positionHighlight();
  };

  renderViews();

  const wave = new WaveController(card, contentLayer, revealedLayer, scope);
  scope.addCleanup(() => wave.destroy());

  const currentSource = () => {
    if (mode === "center") return contentLayer.querySelector("[data-dw-source-token]") || cta;
    return cta;
  };

  const syncWave = () => {
    scene.dataset.revealed = String(revealed);
    wave.update({
      type: mode,
      palette: activePalette(),
      revealed,
      source: currentSource(),
      scrub,
      reducedMotion: scope.reduced() ? "always" : "never",
      onFinish: (done) => {
        scene.dataset.revealed = String(done);
        onFinish?.(done);
      },
    });
  };

  syncWave();

  scope.on(cta, "click", () => {
    // The wave needs the final button geometry as its source.
    modeMorph.finish();
    revealed = !revealed;
    scrub = null;
    cta.innerHTML = buttonContent(mode, revealed);
    syncWave();
    onRevealedChange?.(revealed);
  });

  for (const btn of typeButtons) {
    scope.on(btn, "click", () => {
      const next = btn.dataset.type;
      if (!TYPES.includes(next) || next === mode) return;
      modeMorph.change(() => {
        mode = next;
        customPalette = null;
        revealed = false;
        scrub = null;
        wave.reset();
        renderViews();
        syncWave();
      });
    });
  }

  for (const btn of swatchButtons) {
    scope.on(btn, "click", () => {
      const next = btn.dataset.palette;
      if (!PALETTE_LIST.includes(next)) return;
      customPalette = next;
      swatchButtons.forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.palette === next)));
      syncWave();
    });
  }

  const update = (next = {}) => {
    modeMorph.finish();
    scope.update(next);
    if ("onRevealedChange" in next) onRevealedChange = next.onRevealedChange;
    if ("onFinish" in next) onFinish = next.onFinish;
    let viewsChanged = false;
    if (next.type && TYPES.includes(next.type) && next.type !== mode) {
      mode = next.type;
      wave.reset();
      viewsChanged = true;
    }
    if ("palette" in next) {
      customPalette = next.palette || null;
      viewsChanged = true;
    }
    if (!gallery && typeof next.showControls === "boolean" && next.showControls !== showControls) {
      showControls = next.showControls;
      viewsChanged = true;
    }
    if (typeof next.revealed === "boolean") revealed = next.revealed;
    if ("scrub" in next) scrub = next.scrub ?? null;
    if (viewsChanged) renderViews();
    else cta.innerHTML = buttonContent(mode, revealed);
    syncWave();
  };

  return {
    ...scope.controller,
    update,
    play(opts) { modeMorph.finish(); revealed = true; scrub = null; cta.innerHTML = buttonContent(mode, true); scene.dataset.revealed = "true"; wave.play(opts); },
    reverse() { modeMorph.finish(); revealed = false; scrub = null; cta.innerHTML = buttonContent(mode, false); scene.dataset.revealed = "false"; wave.reverse(); },
    reset() { modeMorph.finish(); revealed = false; scrub = null; cta.innerHTML = buttonContent(mode, false); scene.dataset.revealed = "false"; wave.reset(); },
    prepare() { return wave.prepare(); },
    get debug() { return wave.debug; },
  };
}
