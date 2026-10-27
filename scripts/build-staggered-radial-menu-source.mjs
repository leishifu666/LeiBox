import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {RADIAL_ACTIONS} from '../src/data/staggered-radial-menu.mjs';
import {SOFT_WHEEL_ACTIONS} from '../src/data/soft-action-wheel.mjs';

export async function buildRadialMenuSources(){
 const baseCss=await fs.readFile('src/lib/motion-core/staggered-radial-menu.css','utf8');
 const script=await fs.readFile('src/lib/motion-core/staggered-radial-menu.js','utf8');
 for(const soft of [false,true]){
  const slug=soft?'soft-action-wheel':'staggered-radial-menu',title=soft?'Soft Action Wheel':'Staggered Radial Menu',actions=soft?SOFT_WHEEL_ACTIONS:RADIAL_ACTIONS;
  const css=baseCss+(soft?'\n'+await fs.readFile('src/lib/motion-core/soft-action-wheel.css','utf8'):'');
  const markup=`<main class="radial-menu-demo notranslate" translate="no" ${soft?'data-variant="soft" ':''}aria-label="${title}"><div class="rm-stage"><div class="rm-menu" role="menu" id="radial-actions" aria-label="Quick actions" inert>${actions.map(action=>`<button type="button" class="rm-action" role="menuitem" aria-label="${action.label}" data-action="${action.key}" style="--rm-color:${action.color}" tabindex="-1" inert><svg class="rm-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${action.shape}</svg></button>`).join('')}</div><button type="button" class="rm-toggle" aria-label="Open actions" aria-haspopup="menu" aria-expanded="false" aria-controls="radial-actions"><span class="rm-plus" aria-hidden="true"></span></button></div><span class="rm-status" role="status" aria-live="polite"></span></main>`;
  await fs.writeFile(`public/motion/${slug}.html`,`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body>${markup}<script>${script}</script></body></html>`);
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){await buildRadialMenuSources();console.log('Built both radial menu variants from the shared DOM core.');}
