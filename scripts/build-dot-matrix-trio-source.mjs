import fs from 'node:fs/promises';
import {DOT_MATRIX_TRIO_COPY} from '../src/data/dot-matrix-trio.mjs';

export async function buildDotMatrixTrioSource() {
  const css = await fs.readFile('src/lib/motion-core/dot-matrix-trio.css', 'utf8');
  const script = await fs.readFile('src/lib/motion-core/dot-matrix-trio.js', 'utf8');
  const logo = await fs.readFile('public/leibox-logo.svg', 'utf8');
  const wordmarkPaths = logo.match(/<g id="custom-wordmark"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  if (!wordmarkPaths) throw new Error('LeiBox wordmark is missing from the current site logo');
  const brand = logo.replace(/<svg\b[^>]*>/, '<svg class="dm-brand-logo" viewBox="0 0 603.900954 208" aria-label="LeiBox" role="img">')
    .replace(/<(?:title|desc)>[\s\S]*?<\/(?:title|desc)>/g, '')
    .replace('id="existing-symbol"', 'data-dm-symbol').replace(/\s+id="[^"]*"/g, '').replaceAll('#fff', 'currentColor');
  const wordmark = `<svg class="dm-wordmark" viewBox="0 0 368 100" aria-label="LeiBox" role="img"><g fill="currentColor">${wordmarkPaths.replace(/\s+id="[^"]*"/g, '')}</g></svg>`;
  const posters = ['Ripple', 'Spiral', 'Pulse'].map((name, index) => `<button type="button" class="dm-poster" data-pattern="${name.toLowerCase()}" aria-label="${name} · pause or resume animation" aria-pressed="false"><canvas class="dm-canvas" aria-hidden="true"></canvas><span class="dm-footer">${index === 1 ? `<i class="dm-corner dm-corner--tl" aria-hidden="true"></i>${wordmark}` : `<span class="dm-brand">${brand}</span><span class="dm-copy" lang="en">${DOT_MATRIX_TRIO_COPY[index === 0 ? 'left' : 'right'].join('<br>')}</span><i class="dm-corner dm-corner--br" aria-hidden="true"></i>`}<i class="dm-corner dm-corner--tr" aria-hidden="true"></i></span></button>`).join('');
  const markup = `<main class="dm-scene notranslate" translate="no" aria-label="Dot Matrix Ripple and Spiral"><div class="dm-stage">${posters}</div><span class="dm-status" role="status" aria-live="polite"></span></main>`;
  await fs.writeFile('public/motion/dot-matrix-trio.html', `<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dot Matrix Ripple and Spiral</title><style>${css}</style></head><body>${markup}<script>${script}</script></body></html>`);
}
