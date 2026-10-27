import fs from 'node:fs/promises';
import ts from 'typescript';

// Preserve the user supplied TSX; derive the native port's exact art math and CSS.
const source=await fs.readFile('public/motion/glass-folder-original.tsx','utf8');
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}).outputText.replace(/\bexport /g,'');
const art=compile(source.slice(source.indexOf('export const ART_PRESETS'),source.indexOf('const recipeOf')));
const geometry=compile(source.slice(source.indexOf('const W = 340'),source.indexOf('export default function GlassFolder')));
const css=source.slice(source.indexOf('const GF_CSS = `')+'const GF_CSS = `'.length,source.lastIndexOf('`'));
const driver=await fs.readFile('src/lib/motion-core/glass-folder-driver.js','utf8');
const layout=`html,body{margin:0;min-height:100%;background:#ececee}body{font-family:Arial,sans-serif}.glass-folder-demo{box-sizing:border-box;min-height:600px;width:100%;padding:95px 45px 65px;background:#ececee;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;align-items:center;justify-items:center;overflow:hidden}.gf-demo-slot{position:relative;width:340px;min-width:0;max-width:100%;padding-top:30px}.gf-feedback{position:absolute;top:100%;left:0;right:0;margin-top:24px;font-size:12px;line-height:1.6;text-align:center;color:#53535c;min-height:20px}.gf-root .gf-sheet:disabled{cursor:default}@media(max-width:800px){.glass-folder-demo{grid-template-columns:1fr;padding:50px 24px 85px;gap:45px}.gf-demo-slot{padding-top:25px}}`;
await fs.writeFile('public/motion/glass-folder.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glass Folder Cards</title><style>${layout}\n${css}</style></head><body><main class="glass-folder-demo" aria-label="Glass folder cards"><div class="gf-demo-slot"></div><div class="gf-demo-slot"></div><div class="gf-demo-slot"></div></main><script>\n// Native DOM port of user-provided Glass Folder. Art math and styles preserved.\n${art}\n${geometry}\n${driver}\n</script></body></html>`);
console.log('Built Glass Folder native reference with original art algorithm and CSS.');
