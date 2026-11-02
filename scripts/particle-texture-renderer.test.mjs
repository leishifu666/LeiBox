import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {drawParticleTextures,particleMotionCoefficients} from '../src/lib/motion-core/particle-texture-renderer.mjs';
import {PARTICLE_TEXTURE_TRIO_PROMPT} from '../src/data/particle-texture-trio.mjs';
function fingerprint(draw,time){
 const hash=createHash('sha256');let dots=0;
 const ctx={set fillStyle(value){hash.update(value);},fillRect(){},beginPath(){},moveTo(){},arc(x,y,r){hash.update([x,y,r].map(v=>v.toFixed(6)).join(','));dots++;},fill(){}};
 draw(ctx,time);return{hash:hash.digest('hex'),dots};
}
test('the measured three-second loop repeats without a false half-cycle',()=>{
 assert.deepEqual(fingerprint(drawParticleTextures,0),fingerprint(drawParticleTextures,3));
 assert.notEqual(fingerprint(drawParticleTextures,0).hash,fingerprint(drawParticleTextures,1.5).hash);
 assert(fingerprint(drawParticleTextures,0).dots>4000,'the texture remains a dense particle field');
});
test('the copied prompt contains the complete standalone drawing algorithm and vector geometry',()=>{
 const source=PARTICLE_TEXTURE_TRIO_PROMPT.match(/```js\n([\s\S]*?)\n```/)[1];
 const context=vm.createContext({});vm.runInContext(source,context);
 assert.deepEqual(fingerprint(context.drawParticleTextures,1),fingerprint(drawParticleTextures,1));
 assert(!/https?:\/\/|import\s/.test(source),'the copied algorithm has no file or URL dependency');
 const directions=vm.runInContext('points.map(group=>({count:group.length,positive:group.filter(p=>p.motion[0]*p.motion[3]-p.motion[1]*p.motion[2]>0).length,negative:group.filter(p=>p.motion[0]*p.motion[3]-p.motion[1]*p.motion[2]<0).length,vertical:group.filter(p=>p.motion[1]!==0||p.motion[3]!==0).length}))',context);
 assert(directions[0].positive>100&&directions[0].negative>100,'the actual colored anchors contain both circulation directions');
 assert.equal(directions[1].vertical,0);assert.equal(directions[2].positive,directions[2].count);
});
test('the three studies keep their measured trajectory directions and independent local axes',()=>{
 const samples=[];for(let row=-6;row<=6;row++)for(let col=-6;col<=6;col++){
  const x=col/8,y=row/8;if(Math.hypot(x,y)>.8)continue;samples.push([x,y]);
 }
 const signedArea=([cx,cy,sx,sy])=>cx*sy-cy*sx;
 const left=samples.map(([x,y])=>particleMotionCoefficients(x,y,0,.37));
 assert(left.some(c=>signedArea(c)>.1),'left includes clockwise local orbits');
 assert(left.some(c=>signedArea(c)<-.1),'left includes counterclockwise local orbits');
 assert(new Set(left.map(c=>c.map(v=>v.toFixed(2)).join(','))).size>samples.length*.9,'neighbors keep independent local trajectories');
 const right=samples.map(([x,y])=>particleMotionCoefficients(x,y,2,.37));
 assert(right.filter(c=>signedArea(c)>0).length>right.length*.95,'right keeps the observed clockwise circulation');
 const size=coefficients=>Math.hypot(...coefficients);
 assert(left.reduce((sum,c)=>sum+size(c),0)>right.reduce((sum,c)=>sum+size(c),0)*3,'left motion is much wider than right motion');
 for(const seed of [.05,.2,.47,.72,.95]){
  const c=particleMotionCoefficients(.2,.1,1,seed);assert.equal(c[1],0);assert.equal(c[3],0);
  assert(Math.hypot(c[0],c[2])<=.5,'middle preserves a stationary row with subpixel horizontal motion');
 }
});
