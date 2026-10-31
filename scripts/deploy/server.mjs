import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2),dry=args.includes('--prepare-only');
const run=(command,args,options={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{cwd:root,stdio:options.capture?['pipe','pipe','pipe']:'inherit',...options});let stdout='',stderr='';
 if(options.capture){child.stdout.on('data',data=>{stdout+=data;});child.stderr.on('data',data=>{stderr+=data;});}
 child.on('error',reject);child.on('close',code=>code===0?resolve(stdout.trim()):reject(new Error(`${command} failed (${code}) ${stderr}`)));
 if(options.input){child.stdin.on('error',reject);options.input.pipe(child.stdin);options.input.on('error',reject);}
});
try{
 const config=JSON.parse(await fs.readFile(path.join(root,'.deploy/server.json'),'utf8'));
 if(!/^[a-zA-Z0-9._-]+$/.test(config.host)||!/^\w[\w-]*$/.test(config.user)||!Number.isInteger(config.port)||config.port<1||config.port>65535)throw new Error('Invalid SSH target');
 const key=path.resolve(config.key.replace(/^~(?=[/\\])/,os.homedir())),known=path.resolve(config.knownHosts.replace(/^~(?=[/\\])/,os.homedir()));
 await fs.access(key);await fs.access(known);
 const ssh=['-T','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','IdentitiesOnly=yes','-o','ConnectTimeout=20',...(process.platform==='win32'?['-o','KexAlgorithms=curve25519-sha256']:[]),'-o',`UserKnownHostsFile="${known.replaceAll('\\','/')}"`,'-i',key,'-p',String(config.port),`${config.user}@${config.host}`];
 const commit=await run('git',['rev-parse','HEAD'],{capture:true});
 if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('Invalid Git revision');
 const branch=await run('git',['branch','--show-current'],{capture:true});if(branch!=='main')throw new Error('Run deployment from main');
 const dirty=await run('git',['diff','--name-only','HEAD'],{capture:true});
 console.log(`Deploying committed revision ${commit}. ${dirty?'Uncommitted edits are excluded.':''}`);
 const release=commit.slice(0,12)+'-'+Date.now().toString(16),folder=path.join(root,'outputs/deploy-server',release),source=path.join(folder,'source');await fs.mkdir(source,{recursive:true});
 await run('git',['archive','--format=tar',`--output=${path.join(folder,'source.tar')}`,commit]);
 await run(config.python||'python',['-c',"import tarfile,pathlib,sys; p=pathlib.Path(sys.argv[2]).resolve(); t=tarfile.open(sys.argv[1]); assert all((p/m.name).resolve().is_relative_to(p) for m in t.getmembers()); t.extractall(p,filter='data')",path.join(folder,'source.tar'),source]);
 await fs.symlink(path.join(root,'node_modules'),path.join(source,'node_modules'),process.platform==='win32'?'junction':'dir');
 const npm=process.env.npm_execpath;if(!npm)throw new Error('Use npm run deploy:server');
 await run(process.execPath,[npm,'run','build'],{cwd:source,env:{...process.env,NEXT_PUBLIC_SITE_URL:config.siteUrl}});
 await run(process.execPath,['--test','scripts/performance-budget.test.mjs','scripts/leibox-skill.test.mjs','scripts/collection-cli.test.mjs'],{cwd:source});
 await run(config.python||'python',['scripts/deploy/test_receiver.py'],{cwd:source});
 const baseline=await run(config.ssh||'ssh',[...ssh,'manifest'],{capture:true});JSON.parse(baseline);await fs.writeFile(path.join(folder,'baseline.json'),baseline);
 await run(config.python||'python',[path.join(root,'scripts/deploy/package.py'),source,folder,commit,release]);
 if(dry){console.log(`Prepared and checked: ${folder}`);process.exit(0);}
 if(await run('git',['rev-parse','HEAD'],{capture:true})!==commit)throw new Error('HEAD changed during the build; rerun deployment');
 await run('git',['push','origin','main']);
 const output=await run(config.ssh||'ssh',[...ssh,'deploy'],{capture:true,input:createReadStream(path.join(folder,'release.tar.gz'))});
 const receipt=JSON.parse(output);if(receipt.commit!==commit)throw new Error('Server returned the wrong revision');
 if(receipt.archiveSha256!==createHash('sha256').update(await fs.readFile(path.join(folder,'release.tar.gz'))).digest('hex'))throw new Error('Server received a different archive');
 await fs.writeFile(path.join(folder,'receipt.json'),JSON.stringify(receipt,null,2));
 const manifest=JSON.parse(await fs.readFile(path.join(folder,'release-manifest.json'),'utf8'));
 for(const route of config.verifyRoutes||['/components','/ai/catalog.json']){
  const response=await fetch(new URL(route,config.siteUrl));if(!response.ok)throw new Error(`Public verification failed: ${route} (${response.status})`);
  const data=Buffer.from(await response.arrayBuffer()),file=route.endsWith('.json')?'out'+route:'out'+route+'.html';
  const expected=manifest.files.find(item=>item.path===file);if(expected&&createHash('sha256').update(data).digest('hex')!==expected.sha256)throw new Error(`Public payload differs: ${route}`);
 }
 console.log(JSON.stringify({...receipt,publicVerified:true,receipt:path.join(folder,'receipt.json')},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
