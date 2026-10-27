import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { createContactHandler } from './contact-mail.mjs';

// Local preview of the static Next export. No upstream form submissions.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const port = Number(process.env.PORT || 3000);
const contact = createContactHandler();
const mime = {'.html':'text/html; charset=utf-8','.txt':'text/x-component; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.ico':'image/x-icon','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const json=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(body));};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/contact'){
   const headers=new Headers();
   for(const [name,value] of Object.entries(req.headers)){
    if(Array.isArray(value))for(const item of value)headers.append(name,item);
    else if(value!==undefined)headers.set(name,value);
   }
   const request=new Request(new URL(req.url,`http://${req.headers.host||`127.0.0.1:${port}`}`),{
    method:req.method,headers,
    ...(req.method!=='GET'&&req.method!=='HEAD'?{body:Readable.toWeb(req),duplex:'half'}:{}),
   });
   const response=await contact(request,process.env,{clientKey:req.socket.remoteAddress||'local'});
   res.writeHead(response.status,Object.fromEntries(response.headers));
   return res.end(await response.text());
  }
  if(url.pathname==='/api/subscribe'){
   if(req.method!=='POST')return json(res,405,{error:'Method not allowed.'});
   const origin=req.headers.origin;
   if(origin&&new URL(origin).host!==req.headers.host)return json(res,403,{error:'Forbidden.'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)return json(res,413,{error:'Request too large.'});}
   let data;try{data=JSON.parse(raw);}catch{return json(res,400,{error:'Expected a JSON body.'});}
   const email=typeof data.email==='string'?data.email.trim():'';
   if(!email)return json(res,400,{error:'Please enter your email address.'});
   if(email.length>254||email.split('@')[0].length>64||!/^[^\s@<>]+@[^\s@<>.]+(\.[^\s@<>.]+)+$/.test(email))return json(res,400,{error:'Please enter a valid email address.'});
   // Exercise the original success state without storing or sending the email.
   return json(res,200,{ok:true,localPreview:true});
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
  const resolved=path.resolve(root,'.'+pathname);
  if(resolved!==root&&!resolved.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  let candidates=[resolved];
  // Next 16 requests flat segment names; the exporter writes nested segments.
  const segment=path.basename(resolved).match(/^(__next\.[^.]+)\.(.+)\.txt$/);
  if(segment)candidates.unshift(path.join(path.dirname(resolved),segment[1],...segment[2].split('.'))+'.txt');
  if(req.headers.rsc==='1'||url.searchParams.has('_rsc')) candidates=[...candidates,resolved+'.txt',path.join(resolved,'index.txt')];
  candidates.push(resolved+'.html',path.join(resolved,'index.html'));
  let file,stat;for(const candidate of candidates){try{const s=await fsp.stat(candidate);if(s.isFile()){file=candidate;stat=s;break;}}catch{}}
  if(!file){file=path.join(root,'404.html');try{stat=await fsp.stat(file);}catch{res.writeHead(503,{'content-type':'text/plain; charset=utf-8'});return res.end('Run npm run build before npm start.');}res.statusCode=404;}
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');
  const immutable=file.includes(`${path.sep}_next${path.sep}static${path.sep}`)||file.includes(`${path.sep}assets${path.sep}optimized${path.sep}`)||file.includes(`${path.sep}fonts${path.sep}misans${path.sep}`)||(/[/\\]doc-assets[/\\][a-f0-9]{24}\.json$/.test(file));
  res.setHeader('cache-control',immutable?'public,max-age=31536000,immutable':'no-cache');
  res.setHeader('accept-ranges','bytes');
  const range=req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  if(range){const start=range[1]?Number(range[1]):Math.max(0,stat.size-Number(range[2]));const end=range[1]?(range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1):stat.size-1;
   if(start>end||start>=stat.size){res.writeHead(416,{'content-range':`bytes */${stat.size}`});return res.end();}
   res.writeHead(206,{'content-range':`bytes ${start}-${end}/${stat.size}`,'content-length':end-start+1});if(req.method==='HEAD')return res.end();return fs.createReadStream(file,{start,end}).pipe(res);
  }
  res.setHeader('content-length',stat.size);if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
 }catch(error){if(!res.headersSent)res.writeHead(500);res.end('Local preview error.');console.error(error.message);}
});
server.listen(port,'127.0.0.1',()=>console.log(`Canvas UI local preview: http://127.0.0.1:${port}\nNewsletter is simulated locally. Contact sends only when server mail settings are configured.`));
