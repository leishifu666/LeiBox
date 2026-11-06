import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {createSurface} from './motion-runtime';
import {DEFAULT_COVERS} from './album-cover-tunnel-assets.mjs';

/** LeiShiFu original album tunnel; native scoped lifecycle adaptation. */
export function createAlbumCoverTunnel(target,initial={},CSS,MARKUP){
const optionsBase={height:675,paused:false,autoTravel:true,theme:'dark'};let options={...optionsBase,...initial};
const normalizeImages=images=>Array.isArray(images)&&images.length?images.slice(0,96).map((image,i)=>typeof image==='string'?{src:image,alt:'封面 '+(i+1)}:{src:image.src,alt:image.alt||'封面 '+(i+1)}):DEFAULT_COVERS;
let imageList=normalizeImages(initial.images),loadVersion=0;
const s=createSurface(target,{css:CSS,markup:MARKUP,width:1200,height:675,responsive:true},options);
const root=s.root,doc=target.ownerDocument,win=doc.defaultView,document=s.document,Image=win.Image,devicePixelRatio=win.devicePixelRatio||1;
const sceneEl=root.querySelector('.aw-scene'),errorEl=root.querySelector('.aw-error'),statusEl=root.querySelector('.aw-status');sceneEl.dataset.theme=options.theme;
let dead=false,loaded=false,raf=0,visible=true,inView=true;



/* ---------------- 渲染器：像素比封顶，掉帧时自动降 ---------------- */
const stage = root.querySelector('#stage');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }); } catch { sceneEl.dataset.renderer='unavailable'; errorEl.hidden=false; errorEl.textContent='当前环境不支持 WebGL2'; return s.controller; }
let PR = Math.min(devicePixelRatio, options.theme==='light' ? .75 : 1.5);
renderer.setPixelRatio(PR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);
const el = renderer.domElement;el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label','专辑封面隧道：滚轮或上下拖动穿行，点击选择，方向键切换，空格暂停');
const addEventListener=(type,listener,settings)=>s.on(type==='resize'?win:el,type,listener,settings);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.5, 200);
scene.add(camera);

/* ---------------- 背景：跟着相机走的渐变光 ---------------- */
const BGF = `vec3 bgCol(vec2 p, float tt){
      vec3 c=mix(vec3(.02,.03,.10),vec3(.10,.09,.34),smoothstep(.85,.3,p.y+(p.x-.5)*.25));
      c=mix(c,vec3(.30,.22,.62),smoothstep(.55,.15,p.y)*.3);
      c+=vec3(1.,.86,1.)*exp(-pow(length((p-vec2(.56,.2))*vec2(1.3,2.)),2.)*6.)*(.38+.03*sin(tt*.7));
      vec2 q=(p-.5)/.382+.5;                                   // 屏幕坐标（背景板只露出中间 38%）
      vec2 cq=(q-vec2(.54,.5))*vec2(1.78,1.);
      float r2=dot(cq,cq);
      c*=1.-.72*smoothstep(.05,.75,sqrt(r2));                    // 四周沉进深色
      c+=vec3(.52,.42,.95)*exp(-r2*5.)*.42;                      // 隧道深处的大光晕
      c+=vec3(.95,.86,1.)*exp(-r2*26.)*(.42+.05*sin(tt*.5));     // 光源本身
      return c; }`;
const bg = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), new THREE.ShaderMaterial({
  depthWrite: false, uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec2 vUv; uniform float uTime;
    ${BGF}
    void main(){ gl_FragColor=vec4(bgCol(vUv,uTime),1.); }`
}));
bg.renderOrder = -1; camera.add(bg); bg.position.z = -60;

/* ---------------- 粒子 ---------------- */
{
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, '#fff'); gr.addColorStop(.35, 'rgba(255,240,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  const n = 1400, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i*3] = (Math.random()-.5)*60; pos[i*3+1] = (Math.random()-.5)*36; pos[i*3+2] = -2 - Math.pow(Math.random(), .7)*80; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: .09, color: 0xf4e8ff,
    transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending }));
  camera.add(dust);
}

/* ---------------- 封面：全部塞进一张纹理数组 + 一个 InstancedMesh（1 次绘制） ---------------- */
const TS = 512;
function createLayerCanvas() {
  const cv = document.createElement('canvas'); cv.width = cv.height = TS;
  return cv.getContext('2d', { willReadFrequently: true });
}
async function writeCoverLayer(g, data, index, src) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  if (dead) throw new Error('destroyed');
  g.clearRect(0, 0, TS, TS);
  g.drawImage(img, 0, 0, TS, TS);
  data.set(g.getImageData(0, 0, TS, TS).data, index * TS * TS * 4);
}
async function buildArray(images) {
  const g = createLayerCanvas();
  const data = new Uint8Array(TS * TS * 4 * images.length);
  for (let i = 0; i < images.length; i++) {
    await writeCoverLayer(g, data, i, images[i].src);
  }
  const t = new THREE.DataArrayTexture(data, TS, TS, images.length);
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true; t.flipY = false; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

const S = 2.9, G = 4.4, D = 5.5, NL = 14, FOCUS = 14;
const covers = [], layers = [];
const keyAt = (i, j, k) => imageList.length===1?0:1 + ((((i * 3 + j * 5 + k * 2) % (imageList.length - 1)) + imageList.length - 1) % (imageList.length - 1));
for (let k = 0; k < NL; k++) {
  const L = { k, z: -k * D, items: [] }; layers.push(L);
  for (let j = -5; j <= 5; j++) for (let i = -7; i <= 7; i++) {
    if ((((i + j + k) % 2) + 2) % 2) continue;                    // 三维棋盘格：隔一格、隔一层
    const hh = Math.abs(Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453) % 1;
    if (Math.max(Math.abs(i), Math.abs(j)) > 1 && hh < .42) continue;  // 随机抽掉四成格子，留出缝隙看到更深的层
    const c = { L, gridX:i, gridY:j, tex: (i === 0 && j === 0 && k === 0) ? 0 : keyAt(i, j, k),
      hx: i * G, hy: j * G, x: i * G, y: j * G, z: 0, zo: 0, s: 1, b: .5, o: 1, lift: 0, rx: 0, ry: 0, ph: Math.random() * 6.28 };
    covers.push(c); L.items.push(c);
  }
}
const N = covers.length;
// 每张封面的几何 = 一块软投影 + 一个有厚度的盒子，合并成一个几何（投影先画，所以永远在自己身后）
const TH = S * .12;                                                    // 厚度
const shadowG = new THREE.PlaneGeometry(S * 1.6, S * 1.6); shadowG.translate(.28, -.42, -TH * .5 - .35);
const boxG = new THREE.BoxGeometry(S, S, TH, 1, 1, 1);
const partOf = (g, v) => g.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(v), 1));
partOf(shadowG, 0); partOf(boxG, 1);
const geo = mergeGeometries([shadowG, boxG]); shadowG.dispose(); boxG.dispose();
const aTex = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
const aLook = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4);   // 亮度 / 不透明度 / 模糊 / 高光强度
const aPh = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
const aFog = new THREE.InstancedBufferAttribute(new Float32Array(N), 1); aFog.setUsage(THREE.DynamicDrawUsage);
aLook.setUsage(THREE.DynamicDrawUsage); aTex.setUsage(THREE.DynamicDrawUsage); aPh.setUsage(THREE.DynamicDrawUsage);
geo.setAttribute('aTex', aTex); geo.setAttribute('aLook', aLook); geo.setAttribute('aPh', aPh); geo.setAttribute('aFog', aFog);
const mat = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: { map: { value: null }, uRim: { value: new THREE.Color(0xb4acf0) }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `
    attribute float aTex, aPart, aPh, aFog; attribute vec4 aLook;
    varying vec2 vUv; varying float vTex, vPart, vPh; varying vec4 vLook; varying vec3 vN, vVN, vVP; varying float vFog;
    void main(){
      vFog = aFog; vUv = uv; vTex = aTex; vLook = aLook; vPart = aPart; vPh = aPh; vN = normal;
      vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.);
      vVP = mv.xyz; vVN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    precision highp sampler2DArray;
    uniform sampler2DArray map; uniform vec3 uRim; uniform float uTime; uniform vec2 uRes;
    varying vec2 vUv; varying float vTex, vPart, vPh; varying vec4 vLook; varying vec3 vN, vVN, vVP; varying float vFog;
    ${BGF}
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec3 cover(vec2 uv, float bias){ return pow(texture(map, vec3(uv.x, 1. - uv.y, vTex), bias).rgb, vec3(2.2)); }
    void main(){
      if (vLook.y < .01 || vFog > .985) discard;
      // ---- 软投影：落在后面一层上的阴影 ----
      if (vPart < .5) {
        vec2 q = abs(vUv - .5) - .5 / 1.6 * .92;
        float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.);
        if (vLook.y < .99) discard;                                     // 正在穿过的那层不画影子
        float a = (1. - smoothstep(-.02, .16, d)) * .55 * (1. - vFog);
        if (a < .004) discard;                                          // 投影外圈不写深度，不会挡住后面
        gl_FragColor = vec4(vec3(.01, .0, .03), a); return;
      }
      if (vLook.y < .99 && abs(vN.z) < .5) discard;                    // 半透明时只留正面，不透出盒子内壁
      if (vLook.y < .99 && vN.z < -.5) discard;
      vec3 V = normalize(-vVP), N = normalize(vVN);
      float fres = pow(1. - abs(dot(N, V)), 3.);
      vec3 L = normalize(vec3(-.45, .75, .5));                         // 左上方的主光
      vec3 c;
      if (vN.z > .5) {
        // ---- 正面：封面 + 倒角 + 覆膜流光 + 纸张颗粒 ----
        c = cover(vUv, vLook.z);
        vec2 e2 = min(vUv, 1. - vUv); float e = min(e2.x, e2.y);
        float lip = 1. - smoothstep(.0, .014, e);                       // 外沿倒角
        float tl = clamp(.5 + (vUv.y - vUv.x) * .9, 0., 1.);           // 左上亮、右下暗
        c = mix(c, c * .55 + vec3(.55, .52, .70) * tl * .6, lip * .8);
        c *= 1. - .35 * smoothstep(.022, .014, e) * smoothstep(.010, .016, e);   // 倒角里侧一条细阴影
        c *= .9 + .1 * smoothstep(.0, .35, e);                           // 印刷面边缘微暗
        c += (h21(floor(vUv * 700.)) - .5) * .018;                      // 纸张颗粒
        float sweep = fract(uTime * .07 + vPh) * 2.6 - .8;              // 斜向扫过的覆膜高光
        float band = exp(-pow((vUv.x * .7 + (1. - vUv.y) * .3) - sweep, 2.) * 90.);
        c += vec3(1., .95, 1.) * band * (.06 + .22 * vLook.w);
        c += uRim * fres * .25;
      } else if (vN.z < -.5) {
        c = vec3(.025, .022, .045);                                      // 背板
      } else {
        // ---- 厚度：透明壳边 / 印刷包边 / 纸芯细纹 / 背板 ----
        float f = vN.x > .5 ? 1. - vUv.x : vN.x < -.5 ? vUv.x : vN.y > .5 ? 1. - vUv.y : vUv.y;   // 1 = 正面一侧
        float along = abs(vN.x) > .5 ? vUv.y : vUv.x;
        vec2 edgeUv = vN.x > .5 ? vec2(.985, along) : vN.x < -.5 ? vec2(.015, along) : vN.y > .5 ? vec2(along, .985) : vec2(along, .015);
        vec3 ink = cover(edgeUv, 2.);
        vec3 paper = vec3(.80, .77, .88) * (.86 + .14 * sin(f * 190.)) * (.94 + .06 * h21(vec2(floor(f * 60.), floor(along * 400.))));
        vec3 back = vec3(.06, .055, .10);
        c = back;
        c = mix(c, paper, smoothstep(.13, .16, f));
        c = mix(c, ink * .85, smoothstep(.74, .77, f));
        c = mix(c, ink * .5 + vec3(.55, .55, .7) * .45, smoothstep(.90, .92, f));   // 透明壳
        c += vec3(.9, .85, 1.) * .35 * (smoothstep(.975, 1., f) + (1. - smoothstep(.0, .03, f)) * .4);  // 两条亮棱
        c *= .55 + .55 * max(dot(vN, L), 0.);                            // 朝光的侧面更亮
        c += uRim * fres * .45;
      }
      c *= vLook.x;
      vec2 sp = .5 + (gl_FragCoord.xy / uRes - .5) * .382;            // 远处融进同一张背景色里（真雾，不是半透明）
      c = mix(c, bgCol(sp, uTime) * .92, vFog);
      gl_FragColor = vec4(c, vLook.y);
    }`
});
const mesh = new THREE.InstancedMesh(geo, mat, N);
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
mesh.frustumCulled = false;
const world = new THREE.Group(); world.rotation.z = .2; world.add(mesh); scene.add(world);

/* ---------------- 后期：半分辨率泛光 + 色差/暗角/颗粒（去掉了很贵的景深 Pass） ---------------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(960, 540), .5, .35, .9);
const bloomSet = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => bloomSet(w / 2, h / 2);
composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uLight: { value: new THREE.Vector2(.53, .47) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uLight; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec2 uv=vUv, d=uv-.5; vec3 c;
      c.r=texture2D(tDiffuse,uv+d*.003).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-d*.003).b;
      // 体积光：从隧道尽头的光源往外放射，被封面挡住的地方形成光束缝隙
      vec2 st=(uLight-uv)/18.; vec2 q=uv+st*h(gl_FragCoord.xy); float w=1., ray=0.;
      for(int i=0;i<18;i++){ vec3 s=texture2D(tDiffuse,q).rgb; ray+=max(dot(s,vec3(.3,.5,.2))-.62,0.)*w; w*=.9; q+=st; }
      c+=vec3(.70,.62,1.)*ray*.13*smoothstep(.2,.42,length((uv-uLight)*vec2(1.6,1.)));   // 主封面区域不叠光束，保持干净
      c*=1.-dot(d*vec2(1.,1.25),d*vec2(1.,1.25))*1.35; c+=(h(gl_FragCoord.xy+fract(uTime)*100.)-.5)*.022;
      gl_FragColor=vec4(c,1.); }`
});
composer.addPass(grade);
composer.addPass(new OutputPass());
function resize() { const w = Math.max(1,stage.clientWidth), h = Math.max(1,stage.clientHeight); mat.uniforms.uRes.value.set(w * PR, h * PR); renderer.setPixelRatio(PR); renderer.setSize(w, h, false); composer.setPixelRatio(PR); composer.setSize(w, h); }
addEventListener('resize', resize); resize();

/* ---------------- 输入 ---------------- */
const onCanvas=(type,listener,settings)=>s.on(el,type,event=>{listener(event);wake();},settings);
const pointer = new THREE.Vector2(), look = new THREE.Vector2();
let inside = false, dragging = false, lastY = 0, moved = 0, dragV = 0, wheel = 0;
onCanvas('pointermove', e => {
  const r = el.getBoundingClientRect(); inside = true;
  pointer.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  if (dragging) { dragV += e.clientY - lastY; moved += Math.abs(e.clientY - lastY); lastY = e.clientY; }
});
onCanvas('pointerdown', e => { dragging = true; lastY = e.clientY; moved = 0; el.focus({preventScroll:true});el.setPointerCapture(e.pointerId); });
onCanvas('pointerup', () => { dragging = false; if (moved < 6) { pick(); onClick(); } });
onCanvas('pointerleave', () => { inside = false; });
onCanvas('wheel', e => { e.preventDefault(); wheel += e.deltaY; }, { passive: false });
s.on(el,'keydown',e=>{if(e.key===' '){e.preventDefault();options.paused=!options.paused;syncVisibility();wake();}});

/* ---------------- 运动状态 ---------------- */
const CAM0 = FOCUS;
let travel = 0, vel = 0, idle = 0, goTo = null, heroAmt = 0, hovered = null, heroC = covers.find(c => c.tex === 0);
const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => instant() ? b : a + (b - a) * (1 - Math.exp(-k * dt));
const centerOf = L => L.items.find(c => c.hx === 0 && c.hy === 0);

// 沿弧线飞：起点到终点的直线上叠加一个侧向的弧 + 向镜头拱起 + 轻微翻转
function fly(c, x1, y1, side) {
  if(instant()){c.hx=c.x=x1;c.hy=c.y=y1;c.fl=null;return;}
  c.fl = { x0: c.x, y0: c.y, x1, y1, p: 0, dur: 1.15, side: side * (Math.random() < .5 ? 1 : -1) };
  c.hx = x1; c.hy = y1;
}
const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
function onClick() { if (hovered && hovered !== heroC) select(hovered); }
function select(t, notify=true) {
  const L = t.L, occ = centerOf(L);
  if (occ && occ !== t) { fly(occ, t.hx, t.hy, -1); }                  // 原来在中心的沿反向弧线让到被点的格子
  fly(t, 0, 0, 1);
  goTo = travel + (camera.position.z - FOCUS - L.z);                   // 镜头飞到这一层
  vel = 0; idle = 0; heroAmt = 0;
  if(instant()){travel=goTo;goTo=null;heroC=t;heroAmt=1;}
  if(notify)options.onSelect?.(t.tex);wake();
}

// 屏幕空间拾取：把每张封面中心投到屏幕上，看鼠标落在哪张里（取最靠前的）
function pick() {
  hovered = null;
  if (!inside) return;
  let bestZ = -1e9;
  for (const c of covers) {
    if (c.o < .5 || c.fog > .6) continue;
    tmp.set(c.x, c.y, c.z).applyMatrix4(world.matrixWorld);
    const dist = camera.position.z - tmp.z; if (dist < 1) continue;
    tmp.project(camera);
    const half = (S * c.s * .5) / (dist * tanHalf);
    if (Math.abs(tmp.x - pointer.x) * camera.aspect < half && Math.abs(tmp.y - pointer.y) < half && c.z > bestZ) { bestZ = c.z; hovered = c; }
  }
}
// 方向键：在当前层里换到上下左右的邻居
addEventListener('keydown', e => {
  const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
  if (!dir || !heroC) return; e.preventDefault();
  let best = null, bd = 1e9;
  for (const c of heroC.L.items) {
    if (c === heroC) continue;
    const dx = c.hx, dy = c.hy, along = dx * dir[0] + dy * dir[1]; if (along <= .1) continue;
    const d = along + Math.abs(dx * dir[1] - dy * dir[0]) * 1.5; if (d < bd) { bd = d; best = c; }
  }
  if (best) select(best);wake();
});

const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), SC = new THREE.Vector3();
const tmp = new THREE.Vector3();
const tanHalf = Math.tan(THREE.MathUtils.degToRad(16));

function update(dt, t) {
  // 1) 前进 / 惯性 / 吸附 / 闲置自动前进
  const input = wheel * .004 + dragV * .02; wheel = 0; dragV = 0;
  if (Math.abs(input) > 1e-4) { vel += input; idle = 0; goTo = null; } else idle += dt;
  vel *= Math.pow(.06, dt);
  travel += vel * (instant() ? .12 : dt) * 6;
  if (goTo !== null) { travel = damp(travel, goTo, 2.4, dt); if (Math.abs(travel - goTo) < .02) goTo = null; }
  else if (idle > .45 && Math.abs(vel) < .5) {                          // 吸附到最近的、中心有封面的那一层
    const fz = CAM0 - travel - FOCUS; let best = null, bd = 1e9;
    for (const L of layers) if (centerOf(L)) { const d = L.z - fz; if (Math.abs(d) < Math.abs(bd)) { bd = d; best = L; } }
    if (best) travel = damp(travel, travel - bd, 3, dt);
  }
  if (options.autoTravel && !instant() && idle > 5 && !hovered && goTo === null) { vel += 5.6; idle = 0; }   // 闲着就自己往前飞一张
  camera.position.z = CAM0 - travel;

  if(inside)look.copy(pointer);else look.multiplyScalar(Math.pow(.1, dt));
  camera.position.x = damp(camera.position.x, Math.sin(t * .2) * .35 + look.x * .9, 2.5, dt);
  camera.position.y = damp(camera.position.y, Math.cos(t * .17) * .25 + look.y * .55, 2.5, dt);
  camera.lookAt(camera.position.x * .4, camera.position.y * .4, camera.position.z - 20);
  camera.updateMatrixWorld();

  const focusZ = camera.position.z - FOCUS;
  // 当前主封面 = 焦平面那一层的中心
  let heroL = null;
  for (const L of layers) {
    while (L.z > camera.position.z - 1) L.z -= NL * D;                 // 飞过的层挪到最后面，无限循环
    while (L.z < camera.position.z - 1 - NL * D) L.z += NL * D;
    if (Math.abs(L.z - focusZ) < 1.2 && centerOf(L)) heroL = L;
  }
  const newHero = heroL ? centerOf(heroL) : null;
  const settled = newHero && Math.abs(vel) < .6 && Math.abs(heroL.z - focusZ) < .25;
  if (newHero !== heroC && settled) { heroC = newHero; heroAmt = 0; }
  heroAmt = damp(heroAmt, settled && newHero === heroC ? 1 : 0, settled ? 2.8 : 7, dt);

  // 2) 悬停拾取
  if (!dragging) pick(); else hovered = null;
  el.style.cursor = dragging ? 'grabbing' : hovered && hovered !== heroC ? 'pointer' : 'grab';

  // 3) 每张封面
  // 按层从远到近写进实例槽位：一次绘制，半透明也不会穿帮
  // 按每张封面真实的 z 排序（被吸起/主封面会排到同层邻居之后），它的投影才能正确叠在邻居上
  const order = covers.slice().sort((a, b) => (a.L.z + a.zo) - (b.L.z + b.zo));
  let n = 0;
  for (const c of order) {
    const L = c.L, dz = L.z - focusZ;
    const isHero = c === heroC ? heroAmt : 0;
    // 磁力：被悬停的吸起，同层邻居被推开
    let lift = 0, px = 0, py = 0;
    if (hovered && hovered !== heroC) {
      if (c === hovered) lift = 1;
      else if (c.L === hovered.L) {
        const dx = c.hx - hovered.hx, dy = c.hy - hovered.hy, r = Math.hypot(dx, dy);
        if (r < 9) { const f = (1 - r / 9); px = dx / r * f * .7; py = dy / r * f * .7; lift = f * .2; }
      }
    }
    c.lift = damp(c.lift, lift, 8, dt);
    let arcZ = 0, rz = 0, ryF = 0;
    if (c.fl) {
      const F = c.fl; F.p = Math.min(1, F.p + dt / F.dur);
      const e = ease(F.p), bump = Math.sin(Math.PI * e);
      const dx = F.x1 - F.x0, dy = F.y1 - F.y0, len = Math.hypot(dx, dy) || 1;
      const amp = Math.min(3.2, len * .32) * F.side;
      c.x = F.x0 + dx * e + (-dy / len) * bump * amp;
      c.y = F.y0 + dy * e + (dx / len) * bump * amp;
      arcZ = bump * (F.side > 0 ? 2.6 : 1.2);                          // 换上来的那张往镜头方向拱起
      rz = bump * .22 * F.side; ryF = bump * .35 * Math.sign(dx || 1);
      if (F.p >= 1) c.fl = null;
    } else { c.x = damp(c.x, c.hx + px, 4, dt); c.y = damp(c.y, c.hy + py, 4, dt); }
    const r = Math.hypot(c.x / 17, c.y / 10.5);
    const ahead = 1 - smooth(.5, 2.4, dz);                              // 穿过焦平面后快速淡出
    const fog = Math.min(1, (1 - Math.exp(-Math.max(0, -dz - .8 * D) / (4.6 * D))) / .96);  // 指数雾：一层层往深处退进光里（不透明混色）   // 只保留身后两层；第三层在两层之间完全融掉，静止时不会停在半透明                             // 远处融进背景（不透明）
    const depth = dz < 0 ? 1 - .72 * smooth(0, 4 * D, -dz) : 1;
    let b = .86 * depth * (1 - .7 * smooth(.15, 1, r));
    b = b + (1.02 - b) * isHero; b = b + (1.0 - b) * c.lift * .85;
    c.b = b;
    c.o = ahead; c.fog = fog;
    const s = 1 + .7 * isHero + .14 * c.lift;
    c.s = s;
    c.z = L.z + 1.3 * isHero + 2.0 * c.lift + arcZ + Math.sin(t * .6 + c.ph) * .06;
    c.zo = c.z - L.z;
    const tgx = (c === hovered ? -look.y * .35 : 0) + c.y * .012, tgy = (c === hovered ? look.x * .35 : 0) - c.x * .012;   // 静止时也微微朝向中心，侧面厚度看得见
    c.rx = damp(c.rx, tgx, 6, dt); c.ry = damp(c.ry, tgy, 6, dt);
    // 景深：离焦平面越远 mip 越糊（主封面始终清晰）
    const blur = Math.min(4.5, Math.abs(dz) * .3) * (1 - Math.max(isHero, c.lift));
    E.set(c.rx, c.ry + ryF, Math.sin(t * .3 + c.ph) * .012 + rz); Q.setFromEuler(E);
    P.set(c.x, c.y, c.z); SC.setScalar(s);
    M.compose(P, Q, SC); mesh.setMatrixAt(n, M);
    aLook.setXYZW(n, c.b, c.o, blur, Math.max(isHero, c.lift)); aTex.setX(n, c.tex); aPh.setX(n, c.ph * .159); aFog.setX(n, c.fog); n++;
  }
  mesh.instanceMatrix.needsUpdate = true; aLook.needsUpdate = true; aTex.needsUpdate = true; aPh.needsUpdate = true; aFog.needsUpdate = true;
  mat.uniforms.uTime.value = t;
  bg.material.uniforms.uTime.value = t; grade.uniforms.uTime.value = t;
  dust.rotation.z = t * .01;
}


const fpsEl = document.getElementById('fps');
let last=0,T=0,acc=0,frames=0,slow=0,paintDue=0,frameCount=0;
function render(now){
 if(dead||!loaded)return;
 const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;T+=dt;
 update(dt,T);composer.render();
 sceneEl.dataset.frame=String(++frameCount);
 sceneEl.dataset.active=String(heroC?.tex??0);
 sceneEl.dataset.hovered=String(hovered?.tex??-1);
 sceneEl.dataset.activeLayer=String(heroC?.L.k??-1);
 sceneEl.dataset.hoveredLayer=String(hovered?.L.k??-1);
 sceneEl.dataset.travel=travel.toFixed(3);
 sceneEl.dataset.paused=String(!!options.paused);
 sceneEl.dataset.coverCount=String(imageList.length);
 if(heroC){const label=imageList[heroC.tex]?.alt||'专辑封面';if(statusEl.textContent!==label)statusEl.textContent=label;}
 acc+=dt;frames++;
 if(acc>1){const fps=frames/acc;fpsEl.textContent=fps.toFixed(0)+' fps · '+PR.toFixed(2)+'x';slow=fps<45?slow+1:0;if(slow>=2&&PR>.76&&options.theme!=='light'){PR=Math.max(.75,PR-.25);resize();slow=0;}acc=0;frames=0;}
}
function loop(now){
 raf=0;if(dead||!visible||doc.hidden||!loaded)return;
 if(now>=paintDue||instant()){render(now);paintDue=Math.max(paintDue+1000/(options.theme==='light'?30:60),now);}
 if(!instant()){sceneEl.dataset.running='true';raf=win.requestAnimationFrame(loop);}else sceneEl.dataset.running='false';
}
function instant(){return options.paused||s.reduced();}
function wake(){if(!dead&&visible&&!doc.hidden&&loaded&&!raf)raf=win.requestAnimationFrame(loop);}
function stop(){win.cancelAnimationFrame(raf);raf=0;last=0;sceneEl.dataset.running='false';}
function syncVisibility(){visible=inView&&!doc.hidden;stop();wake();}
const io=new win.IntersectionObserver(entries=>{inView=entries.at(-1).isIntersecting;syncVisibility();});io.observe(s.element);
const ro=new win.ResizeObserver(()=>{if(!dead){resize();wake();}});ro.observe(stage);
s.on(doc,'visibilitychange',syncVisibility);
s.on(s.matchMedia('(prefers-reduced-motion: reduce)'),'change',()=>{stop();wake();});
s.on(el,'pointercancel',()=>{dragging=false;inside=false;wake();});
s.on(el,'blur',()=>{inside=false;hovered=null;wake();});
function applyActive(index){if(!Number.isInteger(index)||index<0||index>=imageList.length)return;const candidates=covers.filter(c=>c.tex===index);const c=candidates.sort((a,b)=>Math.abs(a.L.z-(camera.position.z-FOCUS))-Math.abs(b.L.z-(camera.position.z-FOCUS))||Math.hypot(a.hx,a.hy)-Math.hypot(b.hx,b.hy))[0];if(c)select(c,false);}
function loadImages(images){
 const version=++loadVersion;
 return buildArray(images).then(texture=>{
  if(dead||version!==loadVersion){texture.dispose();return;}
  const previous=mat.uniforms.map.value;
  imageList=images;mat.uniforms.map.value=texture;previous?.dispose();
  covers.forEach(c=>{c.tex=c.gridX===0&&c.gridY===0&&c.L.k===0?0:keyAt(c.gridX,c.gridY,c.L.k);});
  loaded=true;errorEl.hidden=true;delete sceneEl.dataset.error;if(options.theme==='light'&&frameCount===0)heroAmt=1;resize();update(1/60,T);composer.render();
  sceneEl.dataset.renderer='webgl2';sceneEl.dataset.ready='true';s.body.dataset.motionReady='true';s.ready();
  if(options.active!==undefined)applyActive(options.active);wake();
 }).catch(()=>{if(!dead&&version===loadVersion){sceneEl.dataset.error='images';errorEl.hidden=false;errorEl.textContent='封面图片加载失败，请检查图片地址';}});
}
// Gallery previews refine the existing texture without restarting the camera or controls.
async function upgradeCovers(batches) {
 const texture = mat.uniforms.map.value;
 if (!texture || dead) return;
 const g = createLayerCanvas();
 let upgraded = 0;
 for await (const batch of batches) {
  if (dead || mat.uniforms.map.value !== texture) return;
  for (const [index, src] of batch) {
   await writeCoverLayer(g, texture.image.data, index, src);
   if (dead || mat.uniforms.map.value !== texture) return;
   texture.addLayerUpdate(index);
  }
  texture.needsUpdate = true;
  upgraded += batch.length;
  sceneEl.dataset.detailCovers = String(upgraded);
  wake();
 }
}
const ready=loadImages(imageList);
s.setTimeout(()=>{root.querySelector('#hint').style.opacity='0';},9000);
s.addCleanup(()=>{
 dead=true;stop();io.disconnect();ro.disconnect();
 const geometries=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:[object.material];for(const material of list){if(!material)continue;materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);for(const value of Object.values(material.uniforms||{}))if(value?.value?.isTexture)textures.add(value.value);}});
 textures.forEach(texture=>texture.dispose());geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
 composer.passes.forEach(pass=>pass.dispose?.());composer.dispose();renderer.dispose();renderer.forceContextLoss();
});
return {...s.controller,ready,upgradeCovers,update(next={}){if(dead)return;const activeChanged=next.active!==undefined&&next.active!==options.active,imagesChanged=Object.hasOwn(next,'images')&&next.images!==options.images;options={...options,...next};s.controller.update(next);sceneEl.dataset.theme=options.theme;if(options.theme==='light')PR=Math.min(PR,.75);resize();if(imagesChanged)void loadImages(normalizeImages(next.images));else if(activeChanged&&loaded)applyActive(next.active);stop();wake();}};
}
