import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChevronUp } from 'lucide-react';

export async function buildBlisterDropdownSource() {
  const [css, license] = await Promise.all([
    fs.readFile('src/lib/motion-core/blister-dropdown.css', 'utf8'),
    fs.readFile('node_modules/lucide-react/LICENSE', 'utf8'),
  ]);
  const chevron = renderToStaticMarkup(createElement(ChevronUp, { className: 'blister-chevron', size: 16, strokeWidth: 2.4, 'aria-hidden': true }));
  const entry = `/*!\n${license}\n*/
import { createBlisterDropdown } from './blister-dropdown.mjs';
const css = ${JSON.stringify(css)};
const chevron = ${JSON.stringify(chevron)};
export function mountBlisterDropdown(host, options = {}) {
  return createBlisterDropdown(host, options, css, chevron);
}`;
  const packaged = await build({
    stdin: { contents: entry, sourcefile: 'blister-dropdown-entry.js', resolveDir: path.resolve('src/lib/motion-core') },
    bundle: true, write: false, platform: 'browser', target: 'es2020', legalComments: 'inline', logLevel: 'silent',
    format: 'esm', external: ['./motion-runtime'],
  });
  return packaged.outputFiles[0].text;
}
