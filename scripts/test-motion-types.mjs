import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/motion-frameworks/manifest.json'),'utf8'));
const files=manifest.items.filter(item=>/\.(ts|tsx)$/.test(item.entry)).map(item=>path.join(root,'public',item.entry));
const program=ts.createProgram(files,{noEmit:true,strict:true,skipLibCheck:true,jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,target:ts.ScriptTarget.ES2020,lib:['lib.es2020.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],allowJs:true,checkJs:false,esModuleInterop:true});
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length){process.stderr.write(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:file=>file,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));process.exitCode=1;}else console.log(`Strict TypeScript passed for ${files.length} React, Preact, Solid and Vanilla entries. Vue and Svelte are compiled in the runtime matrix.`);
