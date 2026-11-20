/**
 * UploadTile for the web, framework free, from dissolve (dissolve-ui). This file is yours.
 * The React component (upload-tile.tsx) wraps it; it also runs on its own:
 *
 *   createUploadTile(el, {
 *     file: { name: 'brief.pdf', size: 812000 },
 *     upload: (file, onProgress, signal) => send(file, { onProgress, signal }),
 *     onRemove: () => el.remove(),
 *   });
 *
 * An attachment that assembles from grains as it uploads: the upload progress (0 to 1) is the share
 * of grains that have landed, a front running left to right. At 1 the tile is whole and only then
 * the remove cross fades in. No ring, no badge. A file over maxSize (or an upload that rejects)
 * completes its assembly, shakes, turns red and leaves as dust, and the row closes up behind it.
 * Tap the tile while it uploads to cancel: the request is aborted and the grains that have landed
 * snap away from the pointer. Colors follow --dissolve-surface-2, --dissolve-foreground,
 * --dissolve-muted, --dissolve-danger, --dissolve-primary and --dissolve-border.
 */
import { DPR, play, snapshot, type Origin } from './engine';
import { CALM, clamp, el, fit, fontOf, frame, hash, injectStyle, onThemeChange, propsOf, reducedMotion, rr, scope, token, value, vibrate } from './kit';

export type UploadFile = {
  /** Stable id, for lists. */
  id?: string;
  name: string;
  /** Bytes. */
  size: number;
  /** An image URL: shows as a thumbnail. Anything else shows a file icon, the name and the size. */
  uri?: string;
};

export type UploadFn = (file: UploadFile, onProgress: (progress: number) => void, signal: AbortSignal) => Promise<void>;

export type RemoveReason = 'rejected' | 'cancelled' | 'removed';

export type UploadTileProps = {
  file: UploadFile;
  /** Your upload. Report progress 0 to 1, stop when the signal aborts, reject to show the error state. */
  upload: UploadFn;
  /** Bytes. A bigger file is rejected without starting the upload. */
  maxSize?: number;
  /** Tile side in px. 6 px of room are kept around it for the cross and the grains. Default 72. */
  size?: number;
  /** Space after the tile in a row. It closes up with the tile. Default 0. */
  spacing?: number;
  /** Called once the upload resolved and the tile is whole, as the cross appears. */
  onDone?: (file: UploadFile) => void;
  /** Called once the tile has gone and its space has closed: drop the file here. */
  onRemove?: (file: UploadFile, reason: RemoveReason) => void;
  /** A short vibration when whole, on reject, cancel and remove, where the browser has it. Default true. */
  haptics?: boolean;
  /** Tile classes (background, radius). */
  tileClassName?: string;
  reducedMotion?: boolean;
  locale?: 'en' | 'zh';
};

export type UploadTileInstance = {
  update: (props: Partial<UploadTileProps>) => void;
  destroy: () => void;
};

const DEFAULTS = { size: 72, spacing: 0, haptics: true };

/** Room kept around the tile for the cross and the grains flying in. */
const PAD = 6;
/** Grain side, the landing window of each grain and how far it drifts in from. */
const GRAIN = 2, WINDOW = 0.18, DRIFT = 10;
/** Progress chase, assembly of a rejected file, cross fade in, row open and close. */
const CHASE = 240, INTRO = 420, CROSS_IN = 220, OPEN = 300;
const CALM_CSS = 'cubic-bezier(0.32, 0.72, 0, 1)';
const DOC = 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5';
const X_ICON = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5"/></svg>';

const CSS = `
:where([data-dissolve="upload-tile"]) { position: relative; flex: none; }
:where(.dissolve-upload-box) { position: absolute; left: 0; top: 0; box-sizing: border-box; }
:where(.dissolve-upload-box[role="button"]) { cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where(.dissolve-upload-box:focus-visible) { outline: 2px solid var(--dissolve-accent, rgb(10 132 255)); outline-offset: -2px; border-radius: 22px; }
:where(.dissolve-upload-spot) { position: absolute; border-radius: 16px; box-shadow: inset 0 0 0 1px var(--dissolve-border, rgb(60 60 67 / 0.12)); pointer-events: none; }
:where(.dissolve-upload-face) { display: block; border-radius: 16px; background: var(--dissolve-surface-2, rgb(229 229 234)); }
:where(.dissolve-upload-cross:focus-visible) { outline: 2px solid var(--dissolve-accent, rgb(10 132 255)); outline-offset: 2px; }
:where(.dissolve-upload-asm) { position: absolute; left: 0; top: 0; display: block; pointer-events: none; }
`;

/** 2.4 MB, 812 KB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Per grain: home x, y, landing start, drift dx, dy. The front runs left to right with noise. */
function grainField(size: number) {
  const n = Math.floor(size / GRAIN), data: number[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c, lx = (c + 0.5) * GRAIN, ly = (r + 0.5) * GRAIN;
    data.push(lx, ly, (0.78 * (lx / size) + 0.22 * hash(i, 1)) * (1 - WINDOW), (hash(i, 2) - 0.5) * 2 * DRIFT, (hash(i, 3) - 0.5) * 2 * DRIFT);
  }
  return { n, data };
}

function cover(x: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), sw = w / s, sh = h / s;
  x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
}

export function createUploadTile(host: HTMLElement, initial: UploadTileProps): UploadTileInstance {
  const root = host.getRootNode();
  injectStyle('dissolve-upload-tile', CSS, root instanceof ShadowRoot ? root : undefined);
  const props = propsOf(DEFAULTS, initial);
  const p = () => props.current;
  const sc = scope();
  const file = p().file;
  const TILE = p().size, OUT = TILE + PAD * 2;
  const reduce = () => p().reducedMotion ?? reducedMotion();
  const zh = () => p().locale === 'zh';

  host.dataset.dissolve = 'upload-tile';
  host.setAttribute('role', 'listitem');
  Object.assign(host.style, { width: '0px', height: OUT + 'px' });
  const box = el('div', 'dissolve-upload-box');
  Object.assign(box.style, { width: OUT + 'px', height: OUT + 'px', padding: PAD + 'px' });
  box.setAttribute('aria-label', file.name);
  const spot = el('div', 'dissolve-upload-spot');
  Object.assign(spot.style, { left: PAD + 'px', top: PAD + 'px', width: TILE + 'px', height: TILE + 'px' });
  const face = el('canvas');
  face.width = face.height = Math.round(TILE * DPR);
  Object.assign(face.style, { width: TILE + 'px', height: TILE + 'px', opacity: '0' });
  const fx = face.getContext('2d')!;
  // The tile drawn as grains of its own face, placed by the upload progress.
  const asm = el('canvas', 'dissolve-upload-asm');
  asm.width = asm.height = Math.round(OUT * DPR);
  Object.assign(asm.style, { width: OUT + 'px', height: OUT + 'px' });
  const ax = asm.getContext('2d')!;
  const cross = el('button', 'dissolve-upload-cross', X_ICON);
  face.setAttribute('aria-hidden', 'true');
  asm.setAttribute('aria-hidden', 'true');
  cross.type = 'button';
  cross.tabIndex = -1;
  // Inline: page resets (button { background: none; padding: 0 }) beat :where() rules.
  Object.assign(cross.style, {
    position: 'absolute', right: '0', top: '0', width: '20px', height: '20px', padding: '0', border: '0', borderRadius: '50%',
    display: 'grid', placeItems: 'center', cursor: 'pointer', opacity: '0', visibility: 'hidden', pointerEvents: 'none',
    background: 'var(--dissolve-primary, rgb(28 28 30))', color: 'var(--dissolve-primary-foreground, rgb(255 255 255))',
  });
  box.append(spot, face, asm, cross);
  host.append(box);

  let img: HTMLImageElement | null = null;
  let bad = false, whole = false, phase: 'enter' | 'uploading' | 'done' | 'gone' = 'enter';
  let reportedProgress = 0;
  let settling = false;
  const ctrl = new AbortController();
  sc.onDispose(() => ctrl.abort());

  function decorate() {
    face.className = 'dissolve-upload-face' + (p().tileClassName ? ' ' + p().tileClassName : '');
    cross.setAttribute('aria-label', zh() ? `移除 ${file.name}` : `Remove ${file.name}`);
    if (phase === 'uploading') box.setAttribute('aria-label', zh() ? `正在上传 ${file.name}，点击取消` : `Uploading ${file.name}, press to cancel`);
  }

  const radius = () => parseFloat(getComputedStyle(face).borderTopLeftRadius) || 0;

  // Drawn detached, then copied: text on a canvas in the page can render lighter (inherited font settings).
  const paper = document.createElement('canvas');
  paper.width = paper.height = face.width;
  const px = paper.getContext('2d')!;

  function paintFace() {
    const x = px, T = TILE, font = fontOf(host);
    const col = (name: string, fallback: string) => token(host, name, fallback);
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.clearRect(0, 0, T, T);
    x.save();
    rr(x, 0, 0, T, T, radius());
    x.clip();
    if (img) cover(x, img, T, T);
    else {
      const bg = getComputedStyle(face).backgroundColor;
      x.fillStyle = bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : col('surface-2', 'rgb(229 229 234)');
      x.fillRect(0, 0, T, T);
      // Doc glyph and extension top left, name and size at the bottom.
      const muted = col('muted', 'rgb(142 142 147)');
      x.strokeStyle = muted; x.lineWidth = 1.4; x.lineJoin = 'round';
      x.save(); x.translate(8, 8); x.scale(20 / 24, 20 / 24); x.stroke(new Path2D(DOC)); x.restore();
      x.fillStyle = muted;
      x.font = `700 9px ${font}`;
      x.fillText((file.name.split('.').pop() ?? '').slice(0, 4).toUpperCase(), 31, 21.5);
      x.fillStyle = col('foreground', 'rgb(28 28 30)');
      x.font = `600 11px ${font}`;
      x.fillText(fit(x, file.name, T - 16), 8, T - 20);
      x.fillStyle = muted;
      x.font = `400 10px ${font}`;
      x.fillText(formatBytes(file.size), 8, T - 8);
    }
    if (bad) {
      const danger = col('danger', 'rgb(255 59 48)');
      x.fillStyle = danger; x.globalAlpha = 0.16; x.fillRect(0, 0, T, T); x.globalAlpha = 1;
      x.strokeStyle = danger; x.lineWidth = 1.5; rr(x, 0.75, 0.75, T - 1.5, T - 1.5, Math.max(0, radius() - 0.75)); x.stroke();
      x.font = `700 9px ${font}`;
    }
    x.restore();
    fx.clearRect(0, 0, face.width, face.height);
    fx.drawImage(paper, 0, 0);
  }

  const field = grainField(TILE);
  function drawAsm(P: number) {
    const G = GRAIN * DPR, d = field.data, n = field.n;
    ax.setTransform(DPR, 0, 0, DPR, 0, 0);
    ax.clearRect(0, 0, OUT, OUT);
    for (let i = 0; i < n * n; i++) {
      const k = i * 5;
      const t = clamp((P - d[k + 2]) / WINDOW);
      if (t <= 0) continue;
      const e = 1 - (1 - t) ** 3, w = e * GRAIN;
      const cx = PAD + d[k] + d[k + 3] * (1 - e), cy = PAD + d[k + 1] + d[k + 4] * (1 - e);
      ax.drawImage(face, (i % n) * G, ((i / n) | 0) * G, G, G, cx - w / 2, cy - w / 2, w, w);
    }
  }
  function paintProgress() {
    if (whole) return;
    const plain = reduce();
    face.style.opacity = plain ? (0.15 + 0.85 * prog.v).toFixed(3) : '0';
    asm.style.visibility = plain ? 'hidden' : '';
    if (!plain) drawAsm(prog.v);
  }
  const prog = value(sc, 0, paintProgress);
  const crossIn = value(sc, 0, () => {
    cross.style.opacity = crossIn.v.toFixed(3);
    cross.style.transform = reduce() ? '' : `scale(${(0.6 + 0.4 * crossIn.v).toFixed(3)})`;
  });

  /** Runs the assembly to 1 in ms, then shows the real tile. */
  async function complete(ms: number) {
    settling = true;
    const finished = await prog.to(1, reduce() ? 150 : ms, CALM);
    if (!finished || !sc.alive || ctrl.signal.aborted) return;
    whole = true;
    spot.remove();
    face.style.opacity = '1';
    asm.style.visibility = 'hidden';
  }

  async function close(reason: RemoveReason, burst?: Promise<void>) {
    host.style.width = '0px';
    await Promise.all([sc.wait(reduce() ? 150 : OPEN), burst]);
    if (sc.alive) p().onRemove?.(file, reason);
  }

  async function leave(reason: RemoveReason, preset: string, origin?: Origin) {
    phase = 'gone';
    prog.set(prog.v);
    box.removeAttribute('role');
    box.tabIndex = -1;
    cross.style.pointerEvents = 'none';
    cross.tabIndex = -1;
    if (reduce()) { box.style.visibility = 'hidden'; return close(reason); }
    const r = box.getBoundingClientRect();
    // Whole: the face leaves. Mid upload: only the grains that have landed.
    const src = whole
      ? snapshot(OUT, OUT, (c) => c.drawImage(face, PAD, PAD, TILE, TILE))
      : snapshot(OUT, OUT, (c) => c.drawImage(asm, 0, 0, OUT, OUT));
    box.style.visibility = 'hidden';
    const burst = sc.track(play({ source: src, x: r.left, y: r.top, w: OUT, h: OUT, preset, origin, duration: preset === 'snap' ? 900 : 1100, grain: 2 }));
    await close(reason, burst.done);
  }

  async function reject(ms: number, tooLarge = false) {
    phase = 'gone';
    box.removeAttribute('role');
    box.tabIndex = -1;
    await complete(ms);
    if (!sc.alive) return;
    const shake = box.animate([0, 6, -6, 0, 6, -6, 0, 6, -6, 0].map((v) => ({ transform: `translateX(${v}px)` })), { duration: reduce() ? 1 : 240 });
    sc.onDispose(() => shake.cancel());
    await shake.finished.catch(() => {});
    if (!sc.alive) return;
    bad = true;
    paintFace();
    if (p().haptics) vibrate([20, 60, 20]);
    host.setAttribute('aria-label', zh()
      ? `${file.name}${tooLarge ? ' 超出大小限制' : ' 上传失败'}`
      : `${file.name} ${tooLarge ? 'exceeds the size limit' : 'failed to upload'}`);
    await sc.wait(260);
    if (sc.alive) leave('rejected', 'dust');
  }

  function cancel(origin: { x: number; y: number }) {
    if (phase !== 'uploading') return;
    ctrl.abort();
    if (p().haptics) vibrate(6);
    leave('cancelled', 'snap', origin);
  }

  const onBoxClick = (e: MouseEvent) => {
    const r = box.getBoundingClientRect(), s = r.width / OUT || 1;
    cancel({ x: clamp((e.clientX - r.left) / s, 0, OUT), y: clamp((e.clientY - r.top) / s, 0, OUT) });
  };
  const onBoxKey = (e: KeyboardEvent) => {
    if (phase !== 'uploading' || e.target !== box) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cancel({ x: OUT / 2, y: OUT / 2 }); }
  };
  const onCross = (e: MouseEvent) => {
    e.stopPropagation();
    if (phase !== 'done') return;
    if (p().haptics) vibrate(6);
    leave('removed', 'snap', { x: OUT - 10, y: 10 }); // snaps away from the cross itself
  };
  box.addEventListener('click', onBoxClick);
  box.addEventListener('keydown', onBoxKey);
  cross.addEventListener('click', onCross);

  async function start() {
    if (file.uri) {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.src = file.uri;
      await Promise.race([im.decode().then(() => { img = im; }, () => {}), sc.wait(1500)]);
    }
    if (!sc.alive) return;
    paintFace();
    // The row opens, then the grains land as the upload runs.
    await frame();
    if (!sc.alive) return;
    host.style.transition = `width ${reduce() ? 150 : OPEN}ms ${CALM_CSS}`;
    host.style.width = OUT + p().spacing + 'px';
    await sc.wait(260);
    if (!sc.alive) return;
    const { maxSize } = p();
    if (maxSize != null && file.size > maxSize) return reject(INTRO, true);
    phase = 'uploading';
    box.tabIndex = 0;
    box.setAttribute('role', 'button');
    decorate();
    try {
      await p().upload(file, (v) => {
        const progress = clamp(v);
        if (!ctrl.signal.aborted && sc.alive && phase === 'uploading' && !settling && Number.isFinite(v) && progress > reportedProgress) {
          reportedProgress = progress;
          prog.to(reportedProgress, CHASE, CALM);
        }
      }, ctrl.signal);
    } catch {
      if (!ctrl.signal.aborted && sc.alive && phase === 'uploading') reject(CHASE);
      return;
    }
    if (ctrl.signal.aborted || phase !== 'uploading') return;
    await complete(CHASE);
    if (phase !== 'uploading' || !sc.alive) return;
    phase = 'done';
    box.removeAttribute('role');
    box.tabIndex = -1;
    box.setAttribute('aria-label', file.name);
    cross.tabIndex = 0;
    cross.style.visibility = 'visible';
    cross.style.pointerEvents = 'auto';
    crossIn.to(1, reduce() ? 150 : CROSS_IN, CALM);
    if (p().haptics) vibrate([10, 40, 18]);
    p().onDone?.(file);
  }

  onThemeChange(sc, () => {
    paintFace();
    paintProgress();
  });
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', paintProgress);
  sc.onDispose(() => media.removeEventListener('change', paintProgress));
  decorate();
  host.setAttribute('aria-label', file.name);
  start();

  return {
    update(next) {
      const changed = props.update(next);
      if (changed.has('tileClassName') || changed.has('locale')) decorate();
      if (changed.has('tileClassName')) paintFace();
      if (changed.has('tileClassName') || changed.has('reducedMotion')) paintProgress();
      if (changed.has('spacing') && phase !== 'gone' && host.style.width !== '0px') host.style.width = OUT + p().spacing + 'px';
    },
    destroy() {
      sc.dispose();
      box.remove();
      delete host.dataset.dissolve;
      host.removeAttribute('role');
      host.removeAttribute('aria-label');
      for (const k of ['width', 'height', 'transition']) host.style.removeProperty(k);
    },
  };
}
