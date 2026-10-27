import fs from 'node:fs/promises';
const css=await fs.readFile('src/lib/motion-core/crumpled-paper.css','utf8');
const script=await fs.readFile('src/lib/motion-core/crumpled-paper.js','utf8');
// Public paper-face images from the author's demo; provenance is recorded with the component.
// Embed the pixels so every framework bundle also works offline without asset paths.
const paperImages=await Promise.all(['letter','photo','note'].map(async name=>'data:image/jpeg;base64,'+(await fs.readFile(`public/assets/components/crumpled-paper/${name}.jpg`)).toString('base64')));
const labels=['Unfold handwritten letter','Unfold mountain photograph','Unfold printed letter'];
const descriptions=['14 October. Dear Ada. A letter from June about finding an old letter, the lake, and a visit in spring.','Blue Ridge, first light. October 2025. Seven layers of hazy blue mountains.','Atelier Nord. Paper & Print. 12 October. Dear Sam. A letter from Elin Aro thanking Sam for drawings. Received 14 Oct.'];
await fs.writeFile('public/motion/crumpled-paper.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crumpled Paper Unfold</title><style>${css}</style></head><body><main class="crumple-demo" aria-label="Crumpled paper unfold"><canvas class="cp-shadows" aria-hidden="true"></canvas><canvas class="cp-canvas" aria-hidden="true"></canvas>${labels.map((label,i)=>`<button class="cp-hit" type="button" aria-label="${label}" aria-expanded="false"><span class="cp-sr">${descriptions[i]}</span></button>`).join('')}</main><script>const CP_PAPER_IMAGES=${JSON.stringify(paperImages)};\n${script}</script></body></html>`);
console.log('Built crumpled paper standalone HTML from the native mesh renderer.');
