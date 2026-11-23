/* Supplied HTML adaptation. Design reference: @gabriell_lab.
   Artwork and embedded material maps retain their respective rights; no separate source license was supplied. */
import * as THREE from 'hanging-gallery-three';
import {ARTWORK_URIS,BACK_URIS} from './hanging-art-gallery-assets.mjs';

export function createHangingArtGallery(scope, initial = {}) {
  const {document,window,on,requestAnimationFrame,cancelAnimationFrame} = scope;
  const root=document.getElementById('gallery-scene');
  const reduced=()=>scope.reduced();
  let options={...initial}, destroyed=false, initialized=false, raf=null, lastTime=performance.now();
  let pending=0, environmentTarget=null;
  const textures=new Set(), images=new Set();
  const initialIndex=Number.isInteger(initial.active)?Math.max(0,Math.min(4,initial.active)):2;
  const validIndex=index=>Number.isInteger(index)&&index>=0&&index<5;
  function wake(){
    if(!destroyed&&initialized&&!document.hidden&&!reduced()&&raf===null){lastTime=performance.now();raf=requestAnimationFrame(animate);}
  }
  function loaded(){
    pending--;
    if(destroyed)return;
    if(initialized){renderFrame(performance.now());if(pending===0)root.dataset.ready='true';wake();}
  }





function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert Float32 height array into a pixel-aligned Tangent-Space Normal Map (flipY = true!)
function heightToNormalTexture(heightData, size, strength, maxAniso) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(size - 1, y + 1);
    for (let x = 0; x < size; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(size - 1, x + 1);
      // Sobel 3x3 gradient for clean, low-noise micro-relief
      const tl = heightData[ym * size + xm];
      const tc = heightData[ym * size + x];
      const tr = heightData[ym * size + xp];
      const ml = heightData[y * size + xm];
      const mr = heightData[y * size + xp];
      const bl = heightData[yp * size + xm];
      const bc = heightData[yp * size + x];
      const br = heightData[yp * size + xp];

      const gx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
      const gy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);

      let dx = -gx * strength;
      let dy = gy * strength;
      let dz = 1.0;
      const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);
      dx *= invLen;
      dy *= invLen;
      dz *= invLen;

      const idx = (y * size + x) * 4;
      pixels[idx] = Math.round((dx * 0.5 + 0.5) * 255);
      pixels[idx + 1] = Math.round((dy * 0.5 + 0.5) * 255);
      pixels[idx + 2] = Math.round((dz * 0.5 + 0.5) * 255);
      pixels[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  tex.flipY = true; 
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  if (maxAniso) tex.anisotropy = maxAniso;
  textures.add(tex);
  tex.needsUpdate = true;
  return tex;
}

// Derive pixel-aligned Normal Map & Roughness Map from an image's luminance
function attachDerivedPBRMaps(dataUri, material, opts, maxAniso) {
  const img = new Image();
  images.add(img);pending++;
  img.onerror=()=>{images.delete(img);loaded();};
  img.onload = function () {
    images.delete(img);
    if(destroyed)return;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const pixels = ctx.getImageData(0, 0, size, size).data;

    const hField = new Float32Array(size * size);
    const rPixels = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const r = pixels[i * 4] / 255;
      const g = pixels[i * 4 + 1] / 255;
      const b = pixels[i * 4 + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      hField[i] = lum;
      if (opts.makeRoughness) {
        const rv = THREE.MathUtils.clamp(
          opts.roughMax - lum * (opts.roughMax - opts.roughMin),
          0.10,
          0.95
        );
        const rb = Math.round(rv * 255);
        rPixels[i * 4] = rb;
        rPixels[i * 4 + 1] = rb;
        rPixels[i * 4 + 2] = rb;
        rPixels[i * 4 + 3] = 255;
      }
    }

    material.normalMap = heightToNormalTexture(hField, size, opts.normalStrength, maxAniso);
    material.normalScale = new THREE.Vector2(opts.normalScale, opts.normalScale);

    if (opts.makeRoughness) {
      const rTex = new THREE.DataTexture(rPixels, size, size, THREE.RGBAFormat);
      rTex.flipY = true; 
      rTex.wrapS = THREE.ClampToEdgeWrapping;
      rTex.wrapT = THREE.ClampToEdgeWrapping;
      rTex.magFilter = THREE.LinearFilter;
      rTex.minFilter = THREE.LinearMipmapLinearFilter;
      rTex.generateMipmaps = true;
      rTex.anisotropy = maxAniso;
      rTex.needsUpdate = true;
      textures.add(rTex);
      material.roughnessMap = rTex;
      material.roughness = 1.0;
    }
    material.needsUpdate = true;
    loaded();
  };
  img.src = dataUri;
}

function canvasToTex(canvas, isSRGB, maxAniso) {
  const tex = new THREE.CanvasTexture(canvas);
  if (isSRGB) tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if (maxAniso) tex.anisotropy = maxAniso;
  textures.add(tex);
  tex.needsUpdate = true;
  return tex;
}

// =========================================================================
// HIGH-CONTRAST PHOTOGRAPHY STUDIO PMREM ENVIRONMENT
// Dark front/floor negative-fill + crisp overhead & side softboxes:
// prevents flat-face glare/overexposure while giving REAL gleaming bevels
// and burnished metallic gold/chrome contrast!
// =========================================================================
function createStudioEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  // Dark neutral studio room (linear ~0.10) — NO ambient white washout!
  envScene.background = new THREE.Color(0x1f2228);

  // Deep black negative-fill panels in front & below so piano black stays pitch black
  // and gold/chrome show dramatic dark-to-bright metallic bands
  const blackFlag = new THREE.MeshBasicMaterial({ color: 0x060709, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), blackFlag);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -7;
  envScene.add(floor);

  const frontDark = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), blackFlag);
  frontDark.position.set(0, -1, 14);
  frontDark.lookAt(0, 0, 0);
  envScene.add(frontDark);

  // Crisp overhead studio softbox strip — lights top bevels of celadon, black oval & chrome rail
  const topSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 6),
    new THREE.MeshBasicMaterial({ color: 0xd8dce4, side: THREE.DoubleSide })
  );
  topSoftbox.position.set(0, 10.5, 1.5);
  topSoftbox.rotation.x = Math.PI / 2;
  envScene.add(topSoftbox);

  // Upper-left warm key softbox — creates sweeping golden glint on Hokusai disc
  const leftKeyBox = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 8.5),
    new THREE.MeshBasicMaterial({ color: 0xfff3de, side: THREE.DoubleSide })
  );
  leftKeyBox.position.set(-10.5, 5.5, 6.5);
  leftKeyBox.lookAt(0, 0, 0);
  envScene.add(leftKeyBox);

  // Right cool-white rim strip — crisp metallic edge definition when turning
  const rightRimBox = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 9.5),
    new THREE.MeshBasicMaterial({ color: 0xc8d2e2, side: THREE.DoubleSide })
  );
  rightRimBox.position.set(11.0, 3.5, 5.5);
  rightRimBox.lookAt(0, 0, 0);
  envScene.add(rightRimBox);

  // Soft warm-gray mid fill behind camera (subtle, never overexposes)
  const softFill = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 6),
    new THREE.MeshBasicMaterial({ color: 0x4a4c52, side: THREE.DoubleSide })
  );
  softFill.position.set(0, 4.5, 13);
  softFill.lookAt(0, 0, 0);
  envScene.add(softFill);

  const envRT = pmrem.fromScene(envScene, 0.035);
  environmentTarget=envRT;
  const geometries=new Set(),materials=new Set();
  envScene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)materials.add(node.material);});
  geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
  pmrem.dispose();
  return envRT.texture;
}

// =========================================================================
// BESPOKE REALISTIC PBR MATERIAL BUILDERS
// =========================================================================

// 2. Piano-Black Lacquer Back with Crisp Metallic Double Gold Pinstripes (Vermeer)
function createVermeerBackMaterial(maxAniso) {
  const size = 1024;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d');

  const mCanvas = document.createElement('canvas');
  mCanvas.width = size;
  mCanvas.height = size;
  const mCtx = mCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  // Deep velvety obsidian lacquer (#08080c)
  cCtx.fillStyle = '#08080c';
  cCtx.fillRect(0, 0, size, size);
  mCtx.fillStyle = '#0e0e0e';
  mCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#262626';
  rCtx.fillRect(0, 0, size, size);

  const drawRings = (ctx, stroke, lw1, lw2) => {
    ctx.strokeStyle = stroke;
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, size * 0.436, size * 0.448, 0, 0, Math.PI * 2);
    ctx.lineWidth = lw1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, size * 0.408, size * 0.422, 0, 0, Math.PI * 2);
    ctx.lineWidth = lw2;
    ctx.stroke();
  };

  drawRings(cCtx, '#c7a452', 4.6, 3.8);
  drawRings(mCtx, '#ededed', 5.4, 4.6);
  drawRings(rCtx, '#404040', 5.4, 4.6);

  return new THREE.MeshPhysicalMaterial({
    map: canvasToTex(cCanvas, true, maxAniso),
    metalnessMap: canvasToTex(mCanvas, false, maxAniso),
    roughnessMap: canvasToTex(rCanvas, false, maxAniso),
    metalness: 1.0,
    roughness: 1.0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.09,
    envMapIntensity: 1.15
  });
}

// 4. Matte Unglazed Terracotta Clay with Micro-Speckles & Center Recessed Ring (Van Gogh)
function createTerracottaBackMaterial(maxAniso) {
  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const hField = new Float32Array(size * size);
  const rand = mulberry32(1889);

  const half = size * 0.5;
  for (let y = 0; y < size; y++) {
    const dy = (y - half) / half;
    for (let x = 0; x < size; x++) {
      const dx = (x - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);

      const grain = (rand() - 0.5) * 0.075;
      const speckle = rand() > 0.990 ? 0.14 : (rand() < 0.009 ? -0.10 : 0.0);

      // Crisp stamped circular ring groove in dead center
      const ringDist = Math.abs(r - 0.092);
      const ringGroove = ringDist < 0.011 ? Math.cos((ringDist / 0.011) * Math.PI * 0.5) : 0.0;

      // Rich authentic terracotta clay RGB(196, 82, 54)
      const shade = 1.0 + grain * 0.45 + speckle - ringGroove * 0.30;
      const idx = (y * size + x) * 4;
      img.data[idx] = Math.max(0, Math.min(255, Math.round(196 * shade)));
      img.data[idx + 1] = Math.max(0, Math.min(255, Math.round(82 * shade)));
      img.data[idx + 2] = Math.max(0, Math.min(255, Math.round(54 * shade)));
      img.data[idx + 3] = 255;

      hField[y * size + x] = 0.5 + grain * 0.3 + speckle * 0.45 - ringGroove * 0.60;
    }
  }
  ctx.putImageData(img, 0, 0);

  return new THREE.MeshStandardMaterial({
    map: canvasToTex(cCanvas, true, maxAniso),
    normalMap: heightToNormalTexture(hField, size, 1.4, maxAniso),
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.25
  });
}

// =========================================================================

// =========================================================================
const ARTWORKS = [
  {
    id: 'davinci',
    artist: 'Leonardo da Vinci',
    year: '1503',
    shape: 'arch',
    width: 1.46,
    height: 2.08,
    depth: 0.13,
    bevel: 0.030,
    wireLen: 0.56,
    insetScale: 0.875,
    uvInsetX: 0.075,
    uvInsetY: 0.055
  },
  {
    id: 'vermeer',
    artist: 'Johannes Vermeer',
    year: '1665',
    shape: 'oval',
    width: 1.44,
    height: 2.00,
    depth: 0.13,
    bevel: 0.032,
    wireLen: 0.70,
    insetScale: 0.89,
    uvInsetX: 0.075,
    uvInsetY: 0.06
  },
  {
    id: 'hokusai',
    artist: 'Katsushika Hokusai',
    year: '1831',
    shape: 'circle',
    width: 1.90,
    height: 1.90,
    depth: 0.14,
    bevel: 0.036,
    wireLen: 0.84,
    insetScale: 0.895,
    uvInsetX: 0.065,
    uvInsetY: 0.065
  },
  {
    id: 'vangogh',
    artist: 'Vincent van Gogh',
    year: '1889',
    shape: 'scallop',
    width: 1.92,
    height: 1.90,
    depth: 0.14,
    bevel: 0.032,
    wireLen: 0.92,
    insetScale: 0.845,
    uvInsetX: 0.115,
    uvInsetY: 0.095
  },
  {
    id: 'klimt',
    artist: 'Gustav Klimt',
    year: '1908',
    shape: 'squircle',
    width: 1.66,
    height: 1.64,
    depth: 0.13,
    bevel: 0.036,
    wireLen: 0.64,
    insetScale: 0.855,
    uvInsetX: 0.09,
    uvInsetY: 0.08
  }
];

const VIDEO_X_SETS = [
  [188, 622, 976, 1362, 1748],
  [140, 574, 1006, 1362, 1748],
  [170, 526, 960, 1393, 1749],
  [170, 556, 911, 1344, 1778],
  [170, 555, 941, 1296, 1730]
];

const WORLD_SPAN = 11.4;
const TARGET_X_TABLES = VIDEO_X_SETS.map((row) =>
  row.map((vx) => ((vx - 960) / 1920) * WORLD_SPAN)
);

function buildShape(spec, scaleFactor) {
  const s = new THREE.Shape();
  const sf = scaleFactor || 1.0;
  const hw = (spec.width * sf) / 2;
  const hh = (spec.height * sf) / 2;

  if (spec.shape === 'arch') {
    const r = hw;
    const archCy = hh - r;
    s.moveTo(-hw, -hh);
    s.lineTo(hw, -hh);
    s.lineTo(hw, archCy);
    s.absarc(0, archCy, r, 0, Math.PI, false);
    s.lineTo(-hw, -hh);
  } else if (spec.shape === 'oval') {
    s.absellipse(0, 0, hw, hh, 0, Math.PI * 2, false, 0);
  } else if (spec.shape === 'circle') {
    s.absarc(0, 0, hw, 0, Math.PI * 2, false);
  } else if (spec.shape === 'scallop') {
    const steps = 240;
    const baseR = hw * 0.905;
    const amp = hw * 0.095;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wave = Math.pow(Math.abs(Math.cos(5 * a)), 0.58);
      const r = baseR + amp * wave;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * (spec.height / spec.width);
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
  } else if (spec.shape === 'squircle') {
    const steps = 140;
    const n = 4.2;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const x = Math.sign(ca) * Math.pow(Math.abs(ca), 2 / n) * hw;
      const y = Math.sign(sa) * Math.pow(Math.abs(sa), 2 / n) * hh;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
  }
  return s;
}

function applyPlanarNormalizedUVs(geom, flipUOnBack) {
  geom.computeBoundingBox();
  const bb = geom.boundingBox;
  const sizeX = bb.max.x - bb.min.x;
  const sizeY = bb.max.y - bb.min.y;
  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    let u = (pos.getX(i) - bb.min.x) / sizeX;
    const v = (pos.getY(i) - bb.min.y) / sizeY;
    if (flipUOnBack && norm && norm.getZ(i) < -0.2) {
      u = 1.0 - u;
    }
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

function createInsetShapeGeometry(shape, uvInsetX, uvInsetY) {
  const geom = new THREE.ShapeGeometry(shape, 72);
  geom.computeBoundingBox();
  const bb = geom.boundingBox;
  const sizeX = bb.max.x - bb.min.x;
  const sizeY = bb.max.y - bb.min.y;
  const pos = geom.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const spanX = 1.0 - uvInsetX * 2;
  const spanY = 1.0 - uvInsetY * 2;
  for (let i = 0; i < pos.count; i++) {
    const u = uvInsetX + ((pos.getX(i) - bb.min.x) / sizeX) * spanX;
    const v = uvInsetY + ((pos.getY(i) - bb.min.y) / sizeY) * spanY;
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geom;
}

// =========================================================================

// =========================================================================
const container = document.getElementById('stage');
const captionsLayer = document.getElementById('captions-layer');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  30,
  Math.max(1,root.clientWidth) / Math.max(1,root.clientHeight),
  0.1,
  100
);

let renderer;
try { renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
}); } catch {return mountFallback();}
renderer.setClearColor(0xffffff, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(Math.max(1,root.clientWidth), Math.max(1,root.clientHeight));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
// LinearToneMapping preserves rich saturated museum colors without ACES desaturation/bleaching
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 0.94;
container.appendChild(renderer.domElement);
renderer.domElement.tabIndex=0;
renderer.domElement.setAttribute('role','img');
renderer.domElement.setAttribute('aria-label','Five hanging artworks. Use left and right arrows to select.');
root.dataset.renderer='webgl';

const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
scene.environment = createStudioEnvironment(renderer);


const ambientLight = new THREE.AmbientLight(0xffffff, 0.34);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xddd9d0, 0.14);
hemiLight.position.set(0, 9, 4);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfffdf8, 0.44);
keyLight.position.set(-4.4, 5.8, 10.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.camera.near = 2;
keyLight.shadow.camera.far = 25;
keyLight.shadow.camera.left = -8.5;
keyLight.shadow.camera.right = 8.5;
keyLight.shadow.camera.top = 4.5;
keyLight.shadow.camera.bottom = -4.5;
keyLight.shadow.radius = 7.0;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xeef4ff, 0.10);
rimLight.position.set(6.0, 2.5, 6.5);
scene.add(rimLight);

// Soft wall shadow catcher
const wallPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 24),
  new THREE.ShadowMaterial({ opacity: 0.145 })
);
wallPlane.position.set(0, 0, -0.82);
wallPlane.receiveShadow = true;
scene.add(wallPlane);

// --- Brushed Satin Chrome Gallery Rail ---
const RAIL_Y = 1.48;
const railGeo = new THREE.CylinderGeometry(0.044, 0.044, 34, 36);
railGeo.rotateZ(Math.PI / 2);
const railMat = new THREE.MeshPhysicalMaterial({
  color: 0xd8dce2,
  metalness: 0.90,
  roughness: 0.22,
  clearcoat: 0.20,
  clearcoatRoughness: 0.16,
  envMapIntensity: 1.65
});
const railMesh = new THREE.Mesh(railGeo, railMat);
railMesh.position.set(0, RAIL_Y, 0);
railMesh.castShadow = true;
scene.add(railMesh);

const texLoader = new THREE.TextureLoader();
function loadSRGBTex(uri) {
  pending++;
  const tex = texLoader.load(uri,loaded,undefined,loaded);
  textures.add(tex);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = maxAniso;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}


const oakMat = new THREE.MeshStandardMaterial({
  map: loadSRGBTex(BACK_URIS.wood_back),
  roughness: 0.80,
  metalness: 0.0,
  envMapIntensity: 0.25
});
attachDerivedPBRMaps(BACK_URIS.wood_back, oakMat, {
  normalStrength: 1.4,
  normalScale: 0.55,
  makeRoughness: false
}, maxAniso);

// 2. Piano-Black Lacquer Oval (deep pitch obsidian + crisp overhead bevel glint)
const blackRimMat = new THREE.MeshPhysicalMaterial({
  color: 0x08080c,
  roughness: 0.14,
  metalness: 0.08,
  clearcoat: 0.90,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.25
});
const vermeerBackMat = createVermeerBackMaterial(maxAniso);

// 3. Burnished Antique Gold (real sculpted metal + pixel-aligned braided spiral normal & roughness maps!)
const goldRimMat = new THREE.MeshPhysicalMaterial({
  color: 0xc29842,
  metalness: 0.86,
  roughness: 0.24,
  clearcoat: 0.15,
  clearcoatRoughness: 0.20,
  envMapIntensity: 1.85
});
const goldBackMat = new THREE.MeshPhysicalMaterial({
  map: loadSRGBTex(BACK_URIS.gold_spiral),
  color: 0xffe8b5, // slight warm metallic boost so high metalness stays rich burnished gold
  metalness: 0.78,
  roughness: 0.30,
  clearcoat: 0.12,
  clearcoatRoughness: 0.24,
  envMapIntensity: 1.80
});
attachDerivedPBRMaps(BACK_URIS.gold_spiral, goldBackMat, {
  normalStrength: 2.2,
  normalScale: 1.15,
  makeRoughness: true,
  roughMin: 0.18,
  roughMax: 0.54
}, maxAniso);

// 4. Matte Unglazed Terracotta Clay (true bisque pottery, zero glare!)
const terracottaRimMat = new THREE.MeshStandardMaterial({
  color: 0xc45236,
  roughness: 0.95,
  metalness: 0.0,
  envMapIntensity: 0.22
});
const terracottaBackMat = createTerracottaBackMaterial(maxAniso);

// 5. Glazed Celadon Porcelain (translucent-looking jade glaze + top-bevel highlight + pixel-aligned crackle normal!)
const celadonMat = new THREE.MeshPhysicalMaterial({
  map: loadSRGBTex(BACK_URIS.celadon_back),
  roughness: 0.30,
  metalness: 0.0,
  clearcoat: 0.75,
  clearcoatRoughness: 0.14,
  envMapIntensity: 1.05
});
attachDerivedPBRMaps(BACK_URIS.celadon_back, celadonMat, {
  normalStrength: 1.2,
  normalScale: 0.42,
  makeRoughness: false
}, maxAniso);

const rimMaterials = {
  davinci: oakMat,
  vermeer: blackRimMat,
  hokusai: goldRimMat,
  vangogh: terracottaRimMat,
  klimt: celadonMat
};

const backFaceMaterials = {
  davinci: null,
  vermeer: vermeerBackMat,
  hokusai: goldBackMat,
  vangogh: terracottaBackMat,
  klimt: null
};

const wireMat = new THREE.MeshStandardMaterial({
  color: 0x222428,
  roughness: 0.38,
  metalness: 0.85,
  envMapIntensity: 1.25
});
const collarMat = new THREE.MeshPhysicalMaterial({
  color: 0xc8ccd4,
  roughness: 0.22,
  metalness: 0.90,
  envMapIntensity: 1.5
});

const items = [];
const hitMeshes = [];

ARTWORKS.forEach((spec, index) => {
  const hangerGroup = new THREE.Group();
  const startX = TARGET_X_TABLES[initialIndex][index];
  hangerGroup.position.set(startX, RAIL_Y, 0);
  scene.add(hangerGroup);

  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.052, 24),
    collarMat
  );
  sleeve.rotation.z = Math.PI / 2;
  hangerGroup.add(sleeve);

  const pendulumGroup = new THREE.Group();
  hangerGroup.add(pendulumGroup);

  const wireGeo = new THREE.CylinderGeometry(0.008, 0.008, spec.wireLen, 10);
  const wireMesh = new THREE.Mesh(wireGeo, wireMat);
  wireMesh.position.set(0, -spec.wireLen / 2, 0);
  pendulumGroup.add(wireMesh);

  const eyelet = new THREE.Mesh(
    new THREE.TorusGeometry(0.026, 0.007, 12, 24),
    collarMat
  );
  eyelet.position.set(0, -spec.wireLen, 0);
  pendulumGroup.add(eyelet);

  const medallionCenterY = -(spec.wireLen + spec.height / 2);
  const medallionGroup = new THREE.Group();
  medallionGroup.position.set(0, medallionCenterY, 0);
  pendulumGroup.add(medallionGroup);

  const outerShape = buildShape(spec, 1.0);

  const extrudeGeom = new THREE.ExtrudeGeometry(outerShape, {
    depth: spec.depth,
    bevelEnabled: true,
    bevelSegments: 7,
    steps: 1,
    bevelSize: spec.bevel,
    bevelThickness: spec.bevel,
    curveSegments: 72
  });
  extrudeGeom.translate(0, 0, -spec.depth / 2);
  extrudeGeom.computeVertexNormals();
  applyPlanarNormalizedUVs(extrudeGeom, true);

  const bodyMesh = new THREE.Mesh(extrudeGeom, rimMaterials[spec.id]);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.userData.itemIndex = index;
  medallionGroup.add(bodyMesh);
  hitMeshes.push(bodyMesh);

  // Sculpted raised metallic gold bezel ring on Hokusai circle for authentic 3D rim reflection
  if (spec.id === 'hokusai') {
    const bezelRing = new THREE.Mesh(
      new THREE.TorusGeometry(spec.width * 0.482, 0.026, 18, 96),
      goldRimMat
    );
    bezelRing.position.z = spec.depth / 2 + spec.bevel * 0.55;
    medallionGroup.add(bezelRing);

    const backBezelRing = new THREE.Mesh(
      new THREE.TorusGeometry(spec.width * 0.482, 0.024, 18, 96),
      goldRimMat
    );
    backBezelRing.position.z = -(spec.depth / 2 + spec.bevel * 0.55);
    medallionGroup.add(backBezelRing);
  }

  const faceZ = spec.depth / 2 + spec.bevel + 0.0022;

  if (backFaceMaterials[spec.id]) {
    const backInset = spec.id === 'hokusai' ? 0.94 : 0.96;
    const backShape = buildShape(spec, backInset);
    const backGeom = createInsetShapeGeometry(backShape, 0.0, 0.0);
    const backMesh = new THREE.Mesh(backGeom, backFaceMaterials[spec.id]);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -faceZ;
    backMesh.userData.itemIndex = index;
    medallionGroup.add(backMesh);
    hitMeshes.push(backMesh);
  }

  // Front Painting Window (matte museum print/canvas: zero glare, zero washout!)
  const innerShape = buildShape(spec, spec.insetScale);

  const lipShape = buildShape(spec, spec.insetScale + 0.011);
  const lipGeom = new THREE.ShapeGeometry(lipShape, 72);
  const lipMat = new THREE.MeshStandardMaterial({
    color: 0x161412,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.0,
    transparent: true,
    opacity: 0.28
  });
  const lipMesh = new THREE.Mesh(lipGeom, lipMat);
  lipMesh.position.z = faceZ - 0.0009;
  medallionGroup.add(lipMesh);

  const paintingGeom = createInsetShapeGeometry(innerShape, spec.uvInsetX, spec.uvInsetY);
  const paintingMat = new THREE.MeshStandardMaterial({
    map: loadSRGBTex(ARTWORK_URIS[spec.id]),
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.0
  });
  const paintingMesh = new THREE.Mesh(paintingGeom, paintingMat);
  paintingMesh.position.z = faceZ;
  paintingMesh.userData.itemIndex = index;
  medallionGroup.add(paintingMesh);
  hitMeshes.push(paintingMesh);

  const hitPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 1.08, spec.height * 1.08),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitPlane.userData.itemIndex = index;
  medallionGroup.add(hitPlane);
  hitMeshes.push(hitPlane);

  const capEl = document.createElement('div');
  capEl.dataset.index=String(index);
  capEl.className = 'art-caption' + (index === initialIndex ? ' visible' : '');
  capEl.innerHTML =
    '<div class="artist">' + spec.artist + '</div>' +
    '<div class="year">' + spec.year + '</div>';
  captionsLayer.appendChild(capEl);

  const isInitialActive = index === initialIndex;
  items.push({
    index,
    spec,
    hangerGroup,
    pendulumGroup,
    medallionGroup,
    capEl,
    x: startX,
    vx: 0,
    rotY: isInitialActive ? 0 : Math.PI,
    vRotY: 0,
    rotX: 0,
    vRotX: 0,
    swingZ: 0,
    vSwingZ: 0,
    scale: isInitialActive ? 1.055 : 1.0,
    vScale: 0,
    zPos: isInitialActive ? 0.22 : 0.0,
    vZPos: 0,
    idlePhase: index * 1.25
  });
});

function updateCamera() {
  const w = Math.max(1,root.clientWidth);
  const h = Math.max(1,root.clientHeight);
  const aspect = w / Math.max(1, h);
  camera.aspect = aspect;

  const targetVisibleWidth = 12.15;
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const distForWidth = (targetVisibleWidth / aspect) / (2 * Math.tan(fovRad / 2));
  const distForHeight = 7.4 / (2 * Math.tan(fovRad / 2));
  const z = Math.max(distForWidth, distForHeight, 11.2);

  camera.position.set(0, -0.08, z);
  camera.lookAt(0, -0.08, 0);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
updateCamera();


let activeIndex = initialIndex;
let hoveredIndex = -1;
const pointerNDC = new THREE.Vector2(-10, -10);
const pointerLocalOffset = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();

function syncSelection(){
  root.dataset.active=String(activeIndex);
  document.querySelectorAll('.sr-controls button').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===activeIndex)));
}
function setActive(idx,notify=true){
  if(!validIndex(idx)||destroyed)return;
  const changed=activeIndex!==idx;
  activeIndex=idx;syncSelection();
  if(reduced())renderFrame(performance.now());else wake();
  if(changed&&notify)options.onActiveChange?.(idx);
}

function updatePointerFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  scene.updateMatrixWorld(true);
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(hitMeshes, false);
  if (hits.length > 0) {
    const hit = hits[0];
    const idx = hit.object.userData.itemIndex;
    hoveredIndex = idx;
    renderer.domElement.style.cursor = 'pointer';
    setActive(idx);

    const item = items[idx];
    const localPt = item.medallionGroup.worldToLocal(hit.point.clone());
    pointerLocalOffset.x = THREE.MathUtils.clamp(localPt.x / (item.spec.width * 0.5), -1, 1);
    pointerLocalOffset.y = THREE.MathUtils.clamp(localPt.y / (item.spec.height * 0.5), -1, 1);
  } else {
    hoveredIndex = -1;
    renderer.domElement.style.cursor = 'default';
    pointerLocalOffset.set(0, 0);
  }
}

on(renderer.domElement,'pointermove',e=>{if(e.pointerType!=='touch')updatePointerFromEvent(e);});
on(renderer.domElement,'pointerdown', (e) => {
  if(e.button!==0||e.isPrimary===false)return;
  if(e.isTrusted)renderer.domElement.focus({preventScroll:true});
  updatePointerFromEvent(e);
  if (hoveredIndex >= 0 && !reduced()) {
    items[hoveredIndex].vRotY += 0.85;
  }
});
on(renderer.domElement,'pointerleave', () => {
  hoveredIndex = -1;
  renderer.domElement.style.cursor = 'default';
  pointerLocalOffset.set(0, 0);
});

on(renderer.domElement,'pointerup',e=>{if(e.pointerType!=='mouse')clearHover();});
function clearHover(){
  // Removing a focused canvas dispatches blur before the runtime removes listeners.
  if(destroyed)return;
  hoveredIndex=-1;pointerLocalOffset.set(0,0);renderer.domElement.style.cursor='default';
  if(reduced())renderFrame(performance.now());else wake();
}
on(renderer.domElement,'blur',clearHover);
on(root,'keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'||e.key==='Home'||e.key==='End'){
    e.preventDefault();
    clearHover();
    setActive(e.key==='Home'?0:e.key==='End'?4:(activeIndex+(e.key==='ArrowRight'?1:4))%5);
  }else if(e.key==='Escape')clearHover();
});
document.querySelectorAll('.sr-controls button').forEach(btn=>{
  on(btn,'click',()=>{clearHover();setActive(Number(btn.dataset.index));});
});

function stepSpring(val, vel, target, stiffness, damping, dt) {
  if(reduced())return [target,0];
  const force = (target - val) * stiffness;
  const accel = force - vel * damping;
  vel += accel * dt;
  val += vel * dt;
  return [val, vel];
}

const projVec = new THREE.Vector3();

function renderFrame(now) {
  // A texture callback can paint after a queued RAF's timestamp was sampled.
  // Never integrate a spring backwards when that RAF is delivered afterwards.
  const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.04);
  lastTime = Math.max(lastTime,now);
  const tSec = now * 0.001;

  const targetXs = TARGET_X_TABLES[activeIndex];
  const w = Math.max(1,root.clientWidth);
  const h = Math.max(1,root.clientHeight);

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const isActive = i === activeIndex;
    const isHovered = i === hoveredIndex;

    const prevVx = it.vx;
    [it.x, it.vx] = stepSpring(it.x, it.vx, targetXs[i], 68, 12.5, dt);
    it.hangerGroup.position.x = it.x;

    const accelX = (it.vx - prevVx) / Math.max(dt, 0.001);
    const targetSwing = THREE.MathUtils.clamp(-accelX * 0.0045, -0.07, 0.07)
      + (reduced()||options.idleMotion===false?0:Math.sin(tSec * 0.85 + it.idlePhase) * 0.004);
    [it.swingZ, it.vSwingZ] = stepSpring(it.swingZ, it.vSwingZ, targetSwing, 38, 6.2, dt);
    it.pendulumGroup.rotation.z = it.swingZ;

    const tiltY = !reduced() && isActive && isHovered ? pointerLocalOffset.x * 0.14 : 0;
    const targetRotY = (isActive ? 0 : Math.PI) + tiltY;
    [it.rotY, it.vRotY] = stepSpring(it.rotY, it.vRotY, targetRotY, 72, 11.2, dt);
    it.medallionGroup.rotation.y = it.rotY;

    const targetRotX = !reduced() && isActive && isHovered ? -pointerLocalOffset.y * 0.08 : 0;
    [it.rotX, it.vRotX] = stepSpring(it.rotX, it.vRotX, targetRotX, 60, 10.5, dt);
    it.medallionGroup.rotation.x = it.rotX;

    [it.scale, it.vScale] = stepSpring(it.scale, it.vScale, isActive ? 1.055 : 1.0, 75, 13.0, dt);
    it.medallionGroup.scale.setScalar(it.scale);

    [it.zPos, it.vZPos] = stepSpring(it.zPos, it.vZPos, isActive ? 0.22 : 0.0, 75, 13.0, dt);
    it.medallionGroup.position.z = it.zPos;

    it.medallionGroup.updateWorldMatrix(true,false);
  projVec.set(0, -it.spec.height * 0.5 - 0.18, 0);
    it.medallionGroup.localToWorld(projVec);
    projVec.project(camera);

    const projectedX = (projVec.x * 0.5 + 0.5) * w;
    const capHalf=Math.min(w/2-8,it.capEl.offsetWidth/2);
    const screenX=Math.max(capHalf+8,Math.min(w-capHalf-8,projectedX));
    const screenY = (-projVec.y * 0.5 + 0.5) * h;

    const facingFront = Math.cos(it.rotY) > 0.35;
    const showCap = isActive && facingFront;
    it.capEl.classList.toggle('visible', showCap);
  it.capEl.setAttribute('aria-hidden',String(!showCap));
  it.capEl.dataset.rotation=it.rotY.toFixed(4);
  it.capEl.dataset.swing=it.swingZ.toFixed(4);
    const slideOffset = showCap ? 0 : 6;
    it.capEl.style.transform =
      'translate(' + screenX.toFixed(1) + 'px, ' + (screenY + slideOffset).toFixed(1) + 'px) translate(-50%, 0)';
  }

  renderer.render(scene, camera);
}

function animate(now){
  raf=null;
  if(destroyed||document.hidden)return;
  renderFrame(now);
  const moving=items.some(it=>Math.max(Math.abs(it.vx),Math.abs(it.vRotY),Math.abs(it.vRotX),Math.abs(it.vSwingZ),Math.abs(it.vScale),Math.abs(it.vZPos))>.0001);
  if(!reduced()&&(options.idleMotion!==false||moving))raf=requestAnimationFrame(animate);
}
function refresh(){
  if(destroyed)return;
  if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=performance.now();
  updateCamera();renderFrame(lastTime);wake();
}
const observer=new scope.ResizeObserver(refresh);observer.observe(root);
on(document,'visibilitychange',()=>{
  if(document.hidden){if(raf!==null)cancelAnimationFrame(raf);raf=null;}
  else refresh();
});
on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',refresh);
initialized=true;syncSelection();refresh();
if(pending===0)root.dataset.ready='true';
return {
  refresh,
  update(next){
    if(destroyed)return;
    options={...options,...next};
    if(validIndex(next.active))setActive(next.active,false);
    refresh();
  },
  destroy(){
    if(destroyed)return;destroyed=true;
    if(raf!==null)cancelAnimationFrame(raf);observer.disconnect();
    images.forEach(img=>{img.onload=null;img.onerror=null;img.src='';});images.clear();
    const geometries=new Set(),materials=new Set();
    scene.traverse(node=>{
      if(node.geometry)geometries.add(node.geometry);
      if(node.material)(Array.isArray(node.material)?node.material:[node.material]).forEach(material=>materials.add(material));
    });
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
    textures.forEach(texture=>texture.dispose());textures.clear();environmentTarget?.dispose();
    keyLight.shadow.map?.dispose();
    renderer.renderLists.dispose();renderer.dispose();renderer.forceContextLoss();
    renderer.domElement.width=1;renderer.domElement.height=1;renderer.domElement.remove();captionsLayer.replaceChildren();
  },
};

function mountFallback(){
  const fallback=document.getElementById('gallery-fallback');
  fallback.hidden=false;container.hidden=true;document.querySelector('.sr-controls').hidden=true;root.dataset.renderer='fallback';root.dataset.ready='true';
  const list=fallback.querySelector('.gallery-fallback-list');
  const buttons=ARTWORKS.map((spec,index)=>{
    const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',spec.artist);
    const image=document.createElement('img');image.src=ARTWORK_URIS[spec.id];image.alt=spec.artist;button.appendChild(image);list.appendChild(button);
    on(button,'click',()=>select(index,true));return button;
  });
  let active=initialIndex;
  function select(index,notify=false){
    const changed=active!==index;active=index;root.dataset.active=String(index);
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    fallback.querySelector('.gallery-fallback-caption').textContent=ARTWORKS[index].artist+' · '+ARTWORKS[index].year;
    if(changed&&notify)options.onActiveChange?.(index);
  }
  on(fallback,'keydown',e=>{
    if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();select(e.key==='Home'?0:e.key==='End'?4:(active+(e.key==='ArrowLeft'?4:1))%5,true);buttons[active].focus();
    }
  });
  select(active);
  return {refresh(){},update(next){if(destroyed)return;options={...options,...next};if(validIndex(next.active))select(next.active);},destroy(){destroyed=true;list.replaceChildren();}};
}
}
