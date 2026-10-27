import fs from 'node:fs/promises';
export async function buildElasticPanelSource(){
 const css=await fs.readFile('src/lib/motion-core/elastic-panel-resize.css','utf8');
 const js=await fs.readFile('src/lib/motion-core/elastic-panel-resize.js','utf8');
 const markup='<main class="er-scene" aria-label="Elastic panel resize"><section class="er-panel" id="er-panel" aria-label="Resizable panel"></section><div class="er-handle" role="separator" tabindex="0" aria-label="Resize panel" aria-orientation="vertical" aria-controls="er-panel" aria-valuemin="50" aria-valuemax="72.4" aria-valuenow="61.4"><svg viewBox="0 0 80 160" aria-hidden="true"><path class="er-outline" d="M40 50 Q40 80 40 110"/><path class="er-ink" d="M40 50 Q40 80 40 110"/></svg></div><span class="er-status" aria-live="polite"></span></main>';
 await fs.writeFile('public/motion/elastic-panel-resize.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elastic Panel Resize</title><style>${css}</style></head><body>${markup}<script>${js}</script></body></html>`);
}
