import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(await fs.readFile('src/lib/motion-core/thinking-particles-renderer.js','utf8'),context);
const raster=context.rasterThinkingFaces;
function draw(faces){return raster(faces,12,12,new Uint8ClampedArray(12*12*4),new Float32Array(12*12));}
const slanted={verts:[[0,0,1],[10,0,1],[0,10,20]],shade:40};
const flat={verts:[[0,0,5],[10,0,5],[0,10,5]],shade:190};
test('intersecting faces use local depth, rather than mean face depth',()=>{
 const image=draw([slanted,flat]);
 assert.equal(image[(0*12+1)*4],190,'flat face hides the farther end of the slanted face');
 assert.equal(image[(5*12+1)*4],40,'near end of the slanted face remains visible');
 assert.equal(image[(11*12+11)*4+3],0,'empty space stays transparent');
});
test('visibility does not depend on face insertion order',()=>assert.deepEqual(draw([slanted,flat]),draw([flat,slanted])));
