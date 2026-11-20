import { createSurface, type MotionOptions } from "./motion-runtime";
import { createUploadTray, type TrayFile, type UploadTrayProps } from "./dissolve/upload-tray";
import type { RemoveReason, UploadFile, UploadFn } from "./dissolve/upload-tile.core";
import { UPLOAD_TILE_ENTRY } from "../../data/upload-tile";

export type UploadTrayOptions = MotionOptions & Partial<UploadTrayProps> & { preview?: boolean };

const MB = 1024 * 1024;
const outcomes = {
  success: ["Success", "成功"],
  failure: ["Upload fails", "上传失败"],
  oversize: ["Over size limit", "超出大小"],
} as const;
type Outcome = keyof typeof outcomes;

const markup = `
<div class="upload-stage">
  <div class="upload-composer"><div data-upload-tray></div></div>
  <div class="library-controls" hidden>
    <fieldset class="library-field">
      <legend></legend>
      <div class="library-segments">${Object.keys(outcomes).map(outcome => `
        <label><input name="upload-outcome" type="radio" value="${outcome}"><span></span></label>`).join("")}</div>
    </fieldset>
  </div>
  <span class="upload-status" role="status"></span>
</div>`;

const css = `
.upload-stage.library-demo {
  --dissolve-surface-2: #f1f1f2;
  --dissolve-foreground: #171719;
  --dissolve-muted: #626268;
  --dissolve-border: #c9c9ce;
  --dissolve-primary: #171719;
  --dissolve-danger: #d62e27;
}
.upload-stage.library-demo .upload-composer {
  width: min(100%, 500px);
  min-width: 0;
  padding: 12px;
  border: 1px solid #e4e4e6;
  border-radius: 20px;
  box-shadow: 0 4px 14px rgb(0 0 0 / 4%);
}
.upload-stage.library-demo .library-controls { width: min(100%, 500px); padding-bottom: 3px; }
.upload-stage[data-preview=true] .upload-composer { width: auto; max-width: 100%; }
.upload-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;

type Sample = TrayFile & { outcome: Outcome; duration: number };

const simulateUpload: UploadFn = (file, onProgress, signal) => {
  const { outcome, duration } = file as Sample;
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const stop = () => {
      clearInterval(tick);
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      stop();
      reject(signal.reason);
    };
    const tick = setInterval(() => {
      const progress = (performance.now() - start) / duration;
      if (outcome === "failure" && progress >= 0.52) {
        stop();
        reject(new Error("Simulated upload failure"));
      } else if (progress >= 1) {
        stop();
        onProgress(1);
        resolve();
      } else {
        onProgress(progress);
      }
    }, 60);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
};

const missingUploader: UploadFn = async () => { throw new Error("Provide an upload function for supplied files"); };

export function createUploadTileDemo(target: HTMLElement, initial: UploadTrayOptions, sharedStyles: string, thumbnail: string) {
  let options = initial;
  let outcome: Outcome = "success";
  let nextId = 0;
  let destroyed = false;
  let samples: Sample[] = [
    { id: "lake", name: "alpine-lake.webp", size: 840 * 1024, uri: thumbnail, outcome: "success", duration: 760 },
    { id: "brief", name: "brief.pdf", size: 1.4 * MB, outcome: "success", duration: 2700 },
  ];
  const demo = () => options.files === undefined;
  const surfaceOptions = () => ({ height: options.height ?? (demo() ? UPLOAD_TILE_ENTRY.canvasHeight : (options.size ?? 72) + 12), reducedMotion: options.reducedMotion });
  const scope = createSurface(target, {
    markup, css: sharedStyles + css, width: UPLOAD_TILE_ENTRY.canvasWidth!, height: UPLOAD_TILE_ENTRY.canvasHeight!, responsive: true,
  }, surfaceOptions());
  const stage = scope.root.querySelector<HTMLElement>(".upload-stage")!;
  const controls = scope.root.querySelector<HTMLElement>(".library-controls")!;
  const status = scope.root.querySelector<HTMLElement>(".upload-status")!;
  const legend = controls.querySelector("legend")!;
  const radios = [...controls.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  const zh = () => options.locale === "zh";

  function announce(file: UploadFile, reason: RemoveReason | "done") {
    const descriptions = {
      done: ["Upload finished", "上传完成"],
      cancelled: ["Upload cancelled", "已取消上传"],
      rejected: file.size > (options.maxSize ?? 25 * MB) ? ["Over size limit", "超出大小限制"] : ["Upload failed", "上传失败"],
      removed: ["Attachment removed", "已移除附件"],
    };
    status.textContent = `${descriptions[reason][zh() ? 1 : 0]} · ${file.name}`;
  }

  function add() {
    const id = ++nextId;
    samples = [...samples, {
      id: `sample-${id}`,
      name: outcome === "oversize" ? `archive-${id}.zip` : `notes-${id}.pdf`,
      size: outcome === "oversize" ? 32 * MB : 1.2 * MB,
      outcome,
      duration: 3000,
    }];
    tray.update({ files: samples });
  }

  function trayProps(): UploadTrayProps {
    return {
      files: options.files ?? samples,
      upload: options.upload ?? (demo() ? simulateUpload : missingUploader),
      maxSize: options.maxSize ?? (demo() ? 25 * MB : undefined),
      onAdd: options.onAdd ?? (demo() && !options.preview ? add : undefined),
      onDone: file => { if (demo()) announce(file, "done"); options.onDone?.(file); },
      onRemove: (file, reason) => {
        if (demo()) {
          announce(file, reason);
          samples = samples.filter(sample => sample.id !== file.id);
          tray.update({ files: samples });
        }
        options.onRemove?.(file, reason);
      },
      gap: options.gap,
      size: options.size ?? (demo() ? options.preview ? 88 : 76 : undefined),
      haptics: options.haptics ?? false,
      tileClassName: options.tileClassName,
      locale: options.locale,
      reducedMotion: options.reducedMotion,
    };
  }

  function syncDemo() {
    const labelIndex = zh() ? 1 : 0;
    controls.hidden = !demo() || !!options.preview;
    stage.classList.toggle("library-demo", demo());
    stage.dataset.preview = String(!!options.preview);
    stage.lang = options.locale ?? "en";
    legend.textContent = zh() ? "模拟结果" : "Simulated result";
    for (const radio of radios) {
      const value = radio.value as Outcome;
      radio.checked = value === outcome;
      radio.nextElementSibling!.textContent = outcomes[value][labelIndex];
    }
  }
  syncDemo();
  const tray = createUploadTray(scope.root.querySelector<HTMLElement>("[data-upload-tray]")!, trayProps());
  for (const radio of radios) {
    scope.on(radio, "change", () => { outcome = radio.value as Outcome; });
  }
  scope.addCleanup(() => { destroyed = true; tray.destroy(); });
  return {
    ...scope.controller,
    update(next: UploadTrayOptions) {
      if (destroyed) return;
      options = { ...options, ...next };
      scope.update(surfaceOptions());
      syncDemo();
      tray.update(trayProps());
    },
  };
}
