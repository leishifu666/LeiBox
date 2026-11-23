import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {deploymentGitOptions} from './git-options.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2),dry=args.includes('--prepare-only'),checkOnly=args.includes('--check');
if(args.length===1&&args[0]==='--help'){
 console.log('Usage: npm run deploy:server | npm run deploy:server:check | npm run deploy:server:prepare\n--check: verify GitHub, SSH and the live catalog without building or publishing.\n--prepare-only: build, test and package without pushing or uploading.\nNo flags: build, test, push, upload and verify the committed main revision.\nHelp: node scripts/deploy/server.mjs --help');
 process.exit(0);
}
const catalogPath='/ai/catalog.json';
const detailPattern=/^out\/docs\/animations\/([a-z0-9-]+)\.html$/;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const publicGet=(base,route,fresh=false)=>{
 const url=new URL(route,base);
 if(fresh)url.searchParams.set('leibox-release-check',Date.now().toString());
 return fetch(url,{headers:fresh?{'Cache-Control':'no-cache'}:undefined,signal:AbortSignal.timeout(20000)});
};
const publicHash=async (base,route,fresh=false)=>{
 const response=await publicGet(base,route,fresh);
 if(!response.ok)throw new Error(`Public verification failed: ${route} (${response.status})`);
 return sha256(Buffer.from(await response.arrayBuffer()));
};
const run=(command,args,options={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{cwd:root,stdio:options.capture?['pipe','pipe','pipe']:'inherit',...options});let stdout='',stderr='';
 if(options.capture){child.stdout.on('data',data=>{stdout+=data;});child.stderr.on('data',data=>{stderr+=data;});}
 child.on('error',reject);child.on('close',code=>code===0?resolve(stdout.trim()):reject(new Error(`${command} failed (${code}) ${stderr}`)));
 if(options.input){child.stdin.on('error',reject);options.input.pipe(child.stdin);options.input.on('error',reject);}
});
async function main(){
try{
 if(args.some(arg=>!['--prepare-only','--check'].includes(arg))||(dry&&checkOnly))throw new Error('Use --check or --prepare-only, or no flags. See --help.');
 const config=JSON.parse(await fs.readFile(path.join(root,'.deploy/server.json'),'utf8'));
 if(!/^[a-zA-Z0-9._-]+$/.test(config.host)||!/^\w[\w-]*$/.test(config.user)||!Number.isInteger(config.port)||config.port<1||config.port>65535)throw new Error('Invalid SSH target');
 const key=path.resolve(config.key.replace(/^~(?=[/\\])/,os.homedir())),known=path.resolve(config.knownHosts.replace(/^~(?=[/\\])/,os.homedir()));
 await fs.access(key);await fs.access(known);
 const ssh=['-T','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','IdentitiesOnly=yes','-o','ConnectTimeout=20',...(process.platform==='win32'?['-o','KexAlgorithms=curve25519-sha256']:[]),'-o',`UserKnownHostsFile="${known.replaceAll('\\','/')}"`,'-i',key,'-p',String(config.port),`${config.user}@${config.host}`];
 const git=deploymentGitOptions(config);
 const remoteRevision=async()=>{
  const ref=await run('git',[...git,'-c','http.lowSpeedLimit=1','-c','http.lowSpeedTime=15','ls-remote','--exit-code','origin','refs/heads/main'],{capture:true,signal:AbortSignal.timeout(20000)});
  const revision=ref.split(/\s+/)[0];
  if(!/^[a-f0-9]{40}$/.test(revision))throw new Error('GitHub returned an invalid main revision');
  return revision;
 };
 const commit=await run('git',['rev-parse','HEAD'],{capture:true});
 if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('Invalid Git revision');
 const branch=await run('git',['branch','--show-current'],{capture:true});if(branch!=='main')throw new Error('Run deployment from main');
 const dirty=await run('git',['diff','--name-only','HEAD'],{capture:true});
 if(!dry){
  await remoteRevision().catch(error=>{throw new Error(`GitHub preflight failed before building. Check gitProxy / directGitHub / gitSslBackend in .deploy/server.json. ${error.message}`);});
  console.log('GitHub connection verified.');
 }
 const baseline=await run(config.ssh||'ssh',[...ssh,'manifest'],{capture:true});
 const current=JSON.parse(baseline);
 const currentCatalog=current.liveCatalogSha256??current.files.find(item=>item.path==='out'+catalogPath)?.sha256;
 if(!currentCatalog||await publicHash(config.siteUrl,catalogPath,true)!==currentCatalog){
  throw new Error('SSH target does not match the live LeiBox catalog. Check the production origin and .deploy/server.json before publishing.');
 }
 if(current.retirementProtocol!==1)throw new Error('The production deployment receiver must be upgraded to support route retirement.');
 if(checkOnly){
  console.log(JSON.stringify({connectionsVerified:true,localCommit:commit,serverCommit:current.commit??null,siteUrl:config.siteUrl},null,2));
  return;
 }
 console.log(`Deploying committed revision ${commit}. ${dirty?'Uncommitted edits are excluded.':''}`);
 const release=commit.slice(0,12)+'-'+Date.now().toString(16),folder=path.join(root,'outputs/deploy-server',release),source=path.join(folder,'source');await fs.mkdir(source,{recursive:true});
 await run('git',['archive','--format=tar',`--output=${path.join(folder,'source.tar')}`,commit]);
 await run(config.python||'python',['-c',"import tarfile,pathlib,sys; p=pathlib.Path(sys.argv[2]).resolve(); t=tarfile.open(sys.argv[1]); assert all((p/m.name).resolve().is_relative_to(p) for m in t.getmembers()); t.extractall(p,filter='data')",path.join(folder,'source.tar'),source]);
 await fs.symlink(path.join(root,'node_modules'),path.join(source,'node_modules'),process.platform==='win32'?'junction':'dir');
 const npm=process.env.npm_execpath;if(!npm)throw new Error('Use npm run deploy:server');
 await run(process.execPath,[npm,'run','build'],{cwd:source,env:{...process.env,NEXT_PUBLIC_SITE_URL:config.siteUrl}});
 await run(process.execPath,['--test','scripts/performance-budget.test.mjs','scripts/leibox-skill.test.mjs','scripts/collection-cli.test.mjs','scripts/deploy/test_server.mjs'],{cwd:source});
 await run(config.python||'python',['-m','unittest','discover','-s','scripts/deploy','-p','test_*.py']);
 await fs.writeFile(path.join(folder,'baseline.json'),baseline);
 // Read site files from the commit and use the publisher paired with the installed receiver.
 await run(config.python||'python',['scripts/deploy/package.py',source,folder,commit,release]);
 const manifest=JSON.parse(await fs.readFile(path.join(folder,'release-manifest.json'),'utf8'));
 if(dry){console.log(`Prepared and checked: ${folder}`);return;}
 if(await run('git',['rev-parse','HEAD'],{capture:true})!==commit)throw new Error('HEAD changed during the build; rerun deployment');
 if(await remoteRevision()===commit)console.log('GitHub main already contains this revision.');
 else await run('git',[...git,'push','origin','main']);
 const output=await run(config.ssh||'ssh',[...ssh,'deploy'],{capture:true,input:createReadStream(path.join(folder,'release.tar.gz'))});
 const receipt=JSON.parse(output);if(receipt.commit!==commit)throw new Error('Server returned the wrong revision');
 if(receipt.archiveSha256!==sha256(await fs.readFile(path.join(folder,'release.tar.gz'))))throw new Error('Server received a different archive');
 await fs.writeFile(path.join(folder,'receipt.json'),JSON.stringify(receipt,null,2));
 const previousPaths=new Set(current.files.map(item=>item.path));
 const newDetails=manifest.files
  .filter(item=>!previousPaths.has(item.path)&&detailPattern.test(item.path))
  .map(item=>'/docs/animations/'+item.path.match(detailPattern)[1]);
 for(const route of new Set(['/components',catalogPath,...(config.verifyRoutes??[]),...newDetails])){
  const file=route.endsWith('.json')?'out'+route:'out'+route+'.html';
  const expected=manifest.files.find(item=>item.path===file);
  if(!expected||await publicHash(config.siteUrl,route)!==expected.sha256)throw new Error(`Public payload differs: ${route}`);
 }
 const retiredDetails=manifest.retired.filter(item=>detailPattern.test(item.path)).map(item=>'/docs/animations/'+item.path.match(detailPattern)[1]);
 for(const route of retiredDetails){
  const response=await publicGet(config.siteUrl,route);
  if(![404,410].includes(response.status))throw new Error(`Retired page is still public: ${route} (${response.status})`);
  await response.body?.cancel();
 }
 console.log(JSON.stringify({...receipt,publicVerified:true,retiredDetails,receipt:path.join(folder,'receipt.json')},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
}
await main();
