import { createUploadTile, type UploadFile, type UploadTileInstance, type UploadTileProps } from "./upload-tile.core";
import { el, injectStyle, reducedMotion, vibrate } from "./kit";

export type TrayFile = UploadFile & { id: string };
export type UploadTrayProps = Omit<UploadTileProps, "file" | "spacing"> & {
  files: TrayFile[];
  gap?: number;
  onAdd?: () => void;
};

const css = `
:where(.dissolve-upload-row) { display: flex; min-width: 0; overflow-x: auto; }
:where(.dissolve-upload-add) { flex: none; box-sizing: border-box; padding: 6px; border: 0; background: none; cursor: pointer; display: grid; }
:where(.dissolve-upload-add > span) {
  display: grid; place-items: center; border-radius: 16px;
  color: var(--dissolve-muted, #646464); border: 1.5px dashed var(--dissolve-border, #b9b9b9);
}
:where(.dissolve-upload-add:focus-visible) {
  outline: 2px solid var(--dissolve-accent, #2563eb); outline-offset: -2px; border-radius: 22px;
}
`;

export function createUploadTray(host: HTMLElement, initial: UploadTrayProps) {
  const root = host.getRootNode();
  injectStyle("dissolve-upload-tray", css, root instanceof ShadowRoot ? root : undefined);
  let props = initial;
  let destroyed = false;
  const row = el("div", "dissolve-upload-row");
  row.setAttribute("role", "list");
  const addItem = el("div");
  addItem.setAttribute("role", "listitem");
  const add = el("button", "dissolve-upload-add", '<span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span>');
  add.type = "button";
  addItem.append(add);
  row.append(addItem);
  host.append(row);

  type TileRecord = { host: HTMLDivElement; tile?: UploadTileInstance };
  const tiles = new Map<string, TileRecord>();
  let newest: HTMLDivElement | undefined;
  row.ontransitionend = event => {
    if (event.target !== newest || event.propertyName !== "width") return;
    newest = undefined;
    row.scrollTo({ left: row.scrollWidth, behavior: (props.reducedMotion ?? reducedMotion()) ? "instant" : "smooth" });
  };
  add.onclick = () => {
    if (props.haptics !== false) vibrate(6);
    props.onAdd?.();
  };

  function render() {
    const { files, gap = 6, size = 72, onAdd, locale } = props;
    const retained = new Set(files.map(file => file.id));
    const zh = locale === "zh";
    row.setAttribute("aria-label", zh ? "附件" : "Attachments");
    add.setAttribute("aria-label", zh ? "添加附件" : "Add attachment");
    addItem.hidden = !onAdd;
    add.style.width = add.style.height = size + 12 + "px";
    add.style.marginRight = gap + "px";

    for (const [id, entry] of tiles) {
      if (retained.has(id)) continue;
      entry.tile?.destroy();
      entry.host.remove();
      tiles.delete(id);
    }

    let position: ChildNode = addItem;
    for (const file of files) {
      let entry = tiles.get(file.id);
      const tileProps: UploadTileProps = {
        file, size, spacing: gap, upload: props.upload, maxSize: props.maxSize,
        haptics: props.haptics, tileClassName: props.tileClassName, reducedMotion: props.reducedMotion, locale,
      };
      if (!entry) {
        const tileHost = el("div");
        const record: TileRecord = { host: tileHost };
        row.insertBefore(tileHost, position.nextSibling);
        record.tile = createUploadTile(tileHost, {
          ...tileProps,
          onDone: uploaded => props.onDone?.(uploaded),
          onRemove: (removed, reason) => {
            record.tile?.destroy();
            record.host.remove();
            record.tile = undefined;
            props.onRemove?.(removed, reason);
          },
        });
        tiles.set(file.id, record);
        entry = record;
        newest = tileHost;
      } else if (entry.tile) {
        if (position.nextSibling !== entry.host) row.insertBefore(entry.host, position.nextSibling);
        entry.tile.update(tileProps);
      }
      if (entry.tile) position = entry.host;
    }
  }

  render();
  return {
    update(next: Partial<UploadTrayProps>) {
      if (destroyed) return;
      props = { ...props, ...next };
      render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const entry of tiles.values()) entry.tile?.destroy();
      tiles.clear();
      row.remove();
    },
  };
}
