import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../../..");
const p = JSON.parse(await fs.readFile(path.join(dir, "parameters.json"), "utf8"));
const original = await fs.readFile(path.join(root, p.mark.source), "utf8").catch(()=>fs.readFile(path.join(dir,"existing-mark.svg"),"utf8"));
const markD = original.match(/\sd="([^"]+)"/)[1];
await fs.writeFile(path.join(dir, "existing-mark.svg"), original);
const n = v => Number(v.toFixed(6)).toString();
const xy = point => point.map(n).join(" ");
const rad = a => a * Math.PI / 180;
const polar = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
const capsule = (a, b, radius) => {
  const length = Math.hypot(b[0]-a[0], b[1]-a[1]);
  const normal = [-(b[1]-a[1])/length, (b[0]-a[0])/length];
  const offset = (c, sign) => [c[0]+sign*normal[0]*radius, c[1]+sign*normal[1]*radius];
  return `M${xy(offset(a,1))} L${xy(offset(b,1))} A${radius} ${radius} 0 0 0 ${xy(offset(b,-1))} L${xy(offset(a,-1))} A${radius} ${radius} 0 0 0 ${xy(offset(a,1))} Z`;
};
const ellipse = (c, rx, ry) => `M${n(c[0]-rx)} ${n(c[1])} A${rx} ${ry} 0 1 1 ${n(c[0]+rx)} ${n(c[1])} A${rx} ${ry} 0 1 1 ${n(c[0]-rx)} ${n(c[1])} Z`;
const circle = (c, r) => ellipse(c, r, r);
const e = p.ei;
if(e.arcEndTangentToBar){
  const dx=e.barEnd[0]-e.barStart[0],dy=e.barEnd[1]-e.barStart[1],length=Math.hypot(dx,dy),normal=[-dy/length,dx/length];
  const middleRadius=(e.outerRadius+e.innerRadius)/2,cap=(e.outerRadius-e.innerRadius)/2;
  const distance=normal[0]*(e.center[0]-e.barStart[0])+normal[1]*(e.center[1]-e.barStart[1]);
  const angle=Math.atan2(normal[1],normal[0])-Math.acos((e.barRadius-cap-distance)/middleRadius);
  e.arcEndDegrees=(angle*180/Math.PI+360)%360;
}
const outerStart = polar(e.center,e.outerRadius,e.arcStartDegrees), outerEnd = polar(e.center,e.outerRadius,e.arcEndDegrees);
const innerStart = polar(e.center,e.innerRadius,e.arcStartDegrees), innerEnd = polar(e.center,e.innerRadius,e.arcEndDegrees);
const ringCapRadius=(e.outerRadius-e.innerRadius)/2;
const eRing = `M${xy(outerStart)} A${e.outerRadius} ${e.outerRadius} 0 1 1 ${xy(outerEnd)} A${ringCapRadius} ${ringCapRadius} 0 0 1 ${xy(innerEnd)} A${e.innerRadius} ${e.innerRadius} 0 1 0 ${xy(innerStart)} A${ringCapRadius} ${ringCapRadius} 0 0 1 ${xy(outerStart)} Z`;
const [ix,iy,iw,ih] = e.stemBounds, ir=iw/2;
const iStem = `M${ix} ${iy+ir} A${ir} ${ir} 0 0 1 ${ix+iw} ${iy+ir} V${iy+ih} H${ix} Z`;
const L = p.L, half=L.stem/2, [cx,cy]=L.bendCenter, [fx,fy]=L.footEnd;
const innerL = cx-L.stem, outerL=cx;
const lPath = `M0 ${half} A${half} ${half} 0 0 1 ${L.stem} ${half} V${cy} A${innerL} ${innerL} 0 0 0 ${cx} ${fy-half} H${fx} A${half} ${half} 0 0 1 ${fx} ${fy+half} H${cx} A${outerL} ${outerL} 0 0 1 0 ${cy} Z`;
const glyphs = [
  {id:"letter-L",d:lPath},
  {id:"e-bowl",group:"ligature-ei",d:eRing},
  {id:"ei-shared-stroke",group:"ligature-ei",d:capsule(e.barStart,e.barEnd,e.barRadius)},
  {id:"i-body",group:"ligature-ei",d:iStem},
  {id:"i-dot",group:"ligature-ei",d:circle(e.dotCenter,e.dotRadius)},
  {id:"letter-B",d:[p.B.outer,p.B.upperCounter,p.B.lowerCounter].join(" "),transform:`translate(${p.B.x} 0)`},
  {id:"letter-o",d:ellipse(p.o.center,...p.o.outerRadii)+" "+ellipse(p.o.center,...p.o.innerRadii)},
  {id:"letter-x",d:"M"+p.x.points.map(xy).join(" L")+" Z"},
];
const glyphMarkup = (selection = glyphs, prefix="") => selection.map(g=>`<path id="${prefix}${g.id}" d="${g.d}" fill-rule="evenodd"${g.transform?` transform="${g.transform}"`:""}/>`).join("");
const eiGlyphs = glyphs.filter(g=>g.group === "ligature-ei");
const markScale=p.mark.height/p.mark.bounds[3], markWidth=p.mark.bounds[2]*markScale;
const wordX=markWidth+p.lockup.gap, width=wordX+p.lockup.wordWidth, height=p.mark.height;
const symbolTransform=`scale(${n(markScale)}) translate(${-p.mark.bounds[0]} ${-p.mark.bounds[1]})`;
const symbol=`<g id="existing-symbol" transform="${symbolTransform}"><path d="${markD}" fill-rule="evenodd"/></g>`;
const lockup= symbol+`<g id="custom-wordmark" transform="translate(${n(wordX)} ${p.lockup.wordTop})">${glyphMarkup()}</g>`;
const svg=(w,h,body,extra="")=>`<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}" ${extra}>${body}</svg>`;
const title='<title>LeiBox — custom ei ligature</title><desc>Existing LeiBox symbol combined with custom vector lettering. All logo glyphs are outlines, independent of installed fonts.</desc>';
const logo = color => svg(width,height,title+`<g fill="${color}">${lockup}</g>`,'role="img" aria-label="LeiBox"');
const files={
  "logo.svg":logo("#000"),"logo-white.svg":logo("#fff"),
  "wordmark.svg":svg(p.lockup.wordWidth,p.lockup.wordHeight,title+`<g fill="#000">${glyphMarkup()}</g>`),
  "ei-detail.svg":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="48 -8 120 116"><title>ei custom ligature</title><g fill="#000">${glyphMarkup(eiGlyphs)}</g></svg>`,
};
const sourceHash=createHash("sha256").update(original).digest("hex");
const geometry={...p,sourceMarkSha256:sourceHash,sourceMarkPath:markD,markScale,markWidth,wordX,width,height,glyphs,
  computed:{barAngleDegrees:Math.atan2(e.barEnd[1]-e.barStart[1],e.barEnd[0]-e.barStart[0])*180/Math.PI,barLength:Math.hypot(e.barEnd[0]-e.barStart[0],e.barEnd[1]-e.barStart[1]),outerStart,outerEnd,innerStart,innerEnd},
  evidence:{existingSymbol:"unchanged SVG path, transformed uniformly",lettering:"geometric regularization of the selected 170x79 raster, with optical curve fitting",module:"defined for this reconstruction, not recovered original author measurements"}};
await fs.writeFile(path.join(dir,"geometry.json"),JSON.stringify(geometry,null,2)+"\n");

// All constructions below reference the same geometry and paths as the deliverable.
const line=(a,b,cls="guide")=>`<path class="${cls}" d="M${xy(a)} L${xy(b)}"/>`;
const text=(x,y,str,size=16,fill="#505552",anchor="start")=>`<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${str}</text>`;
const cross=(c,size=4)=>line([c[0]-size,c[1]],[c[0]+size,c[1]],"center")+line([c[0],c[1]-size],[c[0],c[1]+size],"center");
const guideCircle=(c,r)=>`<circle class="guide" cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r)}"/>`+cross(c);
const dim=(a,b,label,offset=0)=>{
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]), normal=[-(b[1]-a[1])/len,(b[0]-a[0])/len];
  const a1=[a[0]+normal[0]*offset,a[1]+normal[1]*offset], b1=[b[0]+normal[0]*offset,b[1]+normal[1]*offset];
  return line(a,a1)+line(b,b1)+`<path class="dim" marker-start="url(#arrow)" marker-end="url(#arrow)" d="M${xy(a1)} L${xy(b1)}"/>`+text((a1[0]+b1[0])/2,(a1[1]+b1[1])/2-12,label,16,"#454b47","middle");
};
const display=v=>Number(v.toFixed(3)).toString();
const units=v=>`${display(v/p.module)}x`;
const defs=`<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#e5e8e4"/><path d="M-2 2L2-2 M0 8L8 0 M6 10L10 6" stroke="#b8bdb7" stroke-width=".65"/></pattern><pattern id="hatchDetail" href="#hatch" patternTransform="scale(.25)"/><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M8 1L0 4L8 7" fill="none" stroke="#656d66" stroke-width="1"/></marker></defs>`;
const styles=`<style>text{font-family:MiSans,"Microsoft YaHei",Arial,sans-serif}.guide{fill:none;stroke:#a8b1ab;stroke-width:.8;vector-effect:non-scaling-stroke}.center{fill:none;stroke:#818e85;stroke-width:.8;vector-effect:non-scaling-stroke}.dim{fill:none;stroke:#656d66;stroke-width:.9}.outline{stroke:#48524a;stroke-width:.85;vector-effect:non-scaling-stroke}</style>`;
let body=`<rect width="1600" height="1580" fill="#fafbf8"/>${defs}${styles}`;
body+=text(72,60,"LeiBox · 标志比例定位制图",32,"#19201b")+text(72,94,"EI LIGATURE / GEOMETRIC RECONSTRUCTION",14,"#7a847c")+text(1528,60,"01 / 2026.10",15,"#69756b","end");
body+=line([72,116],[1528,116])+text(72,155,"01 / 图文组合与比例",18,"#29342b");
const sx=160,sy=242,sc=1.85, map=([x,y])=>[sx+x*sc,sy+y*sc];
body+=`<g transform="translate(${sx} ${sy}) scale(${sc})" fill="url(#hatch)" class="outline">${lockup}</g>`;
for(const yy of [0,p.lockup.wordTop,p.lockup.wordTop+24,p.lockup.wordTop+100,height])body+=line(map([-25,yy]),map([width+18,yy]));
for(const xx of [0,markWidth,wordX,width])body+=line(map([xx,-18]),map([xx,height+38]));
body+=dim(map([0,0]),map([width,0]),`组合宽 ${units(width)}`,-50);
body+=dim(map([0,height]),map([markWidth,height]),`图形 ${units(markWidth)}`,56);
body+=dim(map([markWidth,height]),map([wordX,height]),units(p.lockup.gap),56);
body+=dim(map([wordX,height]),map([width,height]),`字标 ${units(p.lockup.wordWidth)}`,56);
const baseLabels=[[0,"图形上沿"],[60,"字高线"],[84,"小写字高线"],[160,"字标基线"],[208,"图形下沿"]];
for(const [yy,label]of baseLabels)body+=text(1332,sy+yy*sc+5,label,14,"#6e7a70");
body+=text(160,722,`本次定义 x = 字标主笔画 ${p.module}u　·　字高 ${units(100)}　·　图形高 ${units(height)}`,17,"#435046");
body+=text(160,752,"左侧图形直接引用项目已确认 SVG；字标保持所选 ei 连字，整体坐标等比组合",16,"#788279");
body+=line([72,797],[1528,797])+line([795,826],[795,1455]);
body+=text(72,849,"02 / 现有图形的圆角与定位",20,"#29342b")+text(72,880,"正式路径不变 · 圆角沿用原 SVG",15,"#7a847c");
const msc=.8, mx=200-p.mark.bounds[0]*msc,my=948-p.mark.bounds[1]*msc;
const nativeMap=point=>[mx+point[0]*msc,my+point[1]*msc];
body+=`<g transform="translate(${n(mx)} ${n(my)}) scale(${msc})" fill="url(#hatch)" class="outline"><path d="${markD}" fill-rule="evenodd"/></g>`;
// Exact SVG circular-arc center recovery (sweep=1, small arc), no invented circles.
function smallCircleCenter(a,b,r){const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),h=Math.sqrt(r*r-l*l/4);return[mid[0]-dy/l*h,mid[1]+dx/l*h];}
const shellPairs=[[[212,59.403],[300,59.403]],[[404.258,119.597],[448.258,195.807]],[[448.258,316.193],[404.258,392.403]],[[300,452.597],[212,452.597]],[[107.742,392.403],[63.742,316.193]],[[63.742,195.807],[107.742,119.597]]];
geometry.symbolConstruction={outerRadius:88,outerCenters:shellPairs.map(([a,b])=>smallCircleCenter(a,b,88)),innerRadius:27,innerCenters:[[274,273.618802154],[274,392.618802154],[377.05702305,333.118802154]]};
for(const c of geometry.symbolConstruction.outerCenters)body+=guideCircle(nativeMap(c),88*msc);
for(const c of geometry.symbolConstruction.innerCenters)body+=guideCircle(nativeMap(c),27*msc);
body+=line(nativeMap([274,247]),nativeMap([274,425]))+line(nativeMap([230,418.02293]),nativeMap([412,312.9452]));
body+=text(568,1020,`外圆角 R = ${display(88*markScale/p.module)}x`,16,"#4a584c");
body+=line([555,1025],nativeMap(polar(geometry.symbolConstruction.outerCenters[1],88,-32)));
body+=text(568,1118,`内圆角 R = ${display(27*markScale/p.module)}x`,16,"#4a584c");
body+=line([555,1122],nativeMap([377.05702305,306.118802154]));
body+=text(150,1350,"原始图形参数：外圆角 R88 / 内圆角 R27 / 负形笔画 54u",15,"#6d796f");
body+=text(150,1380,"负形两臂原长 119u，保留既定圆角、间距与方向",15,"#6d796f");
body+=text(850,849,"03 / ei 连字的共享笔画",20,"#29342b")+text(850,880,"圆弧 + 斜向胶囊 + i 竖干与圆点",15,"#7a847c");
const ex=704,ey=979,esc=4,em=point=>[ex+point[0]*esc,ey+point[1]*esc];
body+=`<g transform="translate(${ex} ${ey}) scale(${esc})" fill="url(#hatchDetail)" class="outline">${glyphMarkup(eiGlyphs,"detail-")}</g>`;
body+=guideCircle(em(e.center),e.outerRadius*esc)+guideCircle(em(e.center),e.innerRadius*esc)+guideCircle(em(e.dotCenter),e.dotRadius*esc);
for(const c of[e.barStart,e.barEnd])body+=guideCircle(em(c),e.barRadius*esc);
body+=line(em([49,100]),em([173,100]))+line(em([e.center[0],13]),em([e.center[0],110]))+line(em(e.barStart),em(e.barEnd),"center");
for(const q of[outerStart,outerEnd,innerStart,innerEnd,e.barStart,e.barEnd])body+=`<circle cx="${n(em(q)[0])}" cy="${n(em(q)[1])}" r="3.1" fill="#5d7162"/>`;
body+=text(850,935,`e 外弧 R${units(e.outerRadius)} / 内弧 R${units(e.innerRadius)}`,15,"#4a584c");
body+=text(1220,935,`i 点 R${units(e.dotRadius)}`,15,"#4a584c");
body+=text(920,1450,`连笔 ${units(e.barRadius*2)}　·　斜向 ${display(Math.abs(geometry.computed.barAngleDegrees))}°`,16,"#4a584c");
body+=line([72,1494],[1528,1494])+text(72,1531,"辅助圆、切点与定位线均来自同一份参数；B 字腔使用三次 Bézier 曲线，不作圆弧拟合",15,"#738075");
files["construction.svg"]=svg(1600,1580,body);

// Complete lettering geometry: true circles/ellipses and a separate cubic-detail panel.
let details=`<rect width="1600" height="1320" fill="#fafbf8"/>${defs}${styles}`;
details+=text(72,60,"LeiBox · 字标几何细节",32,"#19201b")+text(72,94,"LETTERING GEOMETRY / SHARED SOURCE",14,"#7a847c");
details+=line([72,116],[1528,116])+text(72,157,"04 / 圆弧、字腔与基线",20,"#29342b");
const wx=168,wy=260,ws=3.35,wm=q=>[wx+q[0]*ws,wy+q[1]*ws];
details+=`<g transform="translate(${wx} ${wy}) scale(${ws})" fill="url(#hatchDetail)" class="outline">${glyphMarkup()}</g>`;
for(const yy of[0,24,100])details+=line(wm([-12,yy]),wm([384,yy]));
const capCenters=[polar(e.center,(e.outerRadius+e.innerRadius)/2,e.arcStartDegrees),polar(e.center,(e.outerRadius+e.innerRadius)/2,e.arcEndDegrees)];
const letteringCircles=[
  {id:"L-top",center:[half,half],radius:half},
  {id:"L-elbow-outer",center:L.bendCenter,radius:outerL},
  {id:"L-elbow-inner",center:L.bendCenter,radius:innerL},
  {id:"L-end",center:L.footEnd,radius:half},
  {id:"e-outer",center:e.center,radius:e.outerRadius},
  {id:"e-inner",center:e.center,radius:e.innerRadius},
  ...capCenters.map((center,i)=>({id:`e-cap-${i}`,center,radius:ringCapRadius})),
  ...[e.barStart,e.barEnd].map((center,i)=>({id:`shared-cap-${i}`,center,radius:e.barRadius})),
  {id:"i-top",center:[ix+ir,iy+ir],radius:ir},
  {id:"i-dot",center:e.dotCenter,radius:e.dotRadius},
];
const seenCircles=new Set();
for(const c of letteringCircles){const key=[...c.center,c.radius].map(n).join(",");if(!seenCircles.has(key)){details+=guideCircle(wm(c.center),c.radius*ws);seenCircles.add(key);}}
for(const radii of[p.o.outerRadii,p.o.innerRadii])details+=`<ellipse class="guide" cx="${n(wm(p.o.center)[0])}" cy="${n(wm(p.o.center)[1])}" rx="${n(radii[0]*ws)}" ry="${n(radii[1]*ws)}"/>`;
details+=cross(wm(p.o.center))+line(wm([p.o.center[0],12]),wm([p.o.center[0],112]));
details+=text(168,675,`L 弯部：R${units(outerL)} / R${units(innerL)}　·　e 端圆 R${units(ringCapRadius)}　·　i 端圆 R${units(ir)}`,16,"#536156");
details+=text(168,706,`o 外椭圆：${units(p.o.outerRadii[0])} × ${units(p.o.outerRadii[1])}　·　内椭圆：${units(p.o.innerRadii[0])} × ${units(p.o.innerRadii[1])}`,16,"#536156");
details+=line([72,750],[1528,750])+text(72,801,"05 / B 字腔的自由曲线",20,"#29342b");
details+=text(72,833,"保留选中字形的上下字腔比例，使用三次 Bézier 参数，不强行改成正圆",16,"#738075");
const bx=980,by=910,bs=2.5,bm=q=>[bx+q[0]*bs,by+q[1]*bs];
details+=`<g transform="translate(${bx} ${by}) scale(${bs})" fill="url(#hatchDetail)" class="outline"><path d="${[p.B.outer,p.B.upperCounter,p.B.lowerCounter].join(" ")}" fill-rule="evenodd"/></g>`;
function cubicSegments(d){
  const tokens=d.match(/[A-Za-z]|-?\d*\.?\d+/g);let i=0,current=[0,0],start=[0,0],result=[];
  while(i<tokens.length){const cmd=tokens[i++];
    if(cmd==="M"){current=[+tokens[i++],+tokens[i++]];start=[...current];}
    else if(cmd==="H")current=[+tokens[i++],current[1]];
    else if(cmd==="C"){const a=[+tokens[i++],+tokens[i++]],b=[+tokens[i++],+tokens[i++]],end=[+tokens[i++],+tokens[i++]];result.push({from:[...current],control1:a,control2:b,to:end});current=end;}
    else if(cmd==="Z")current=start;
    else throw new Error(`Unexpected cubic command ${cmd}`);
  }return result;
}
const bCurves=[p.B.outer,p.B.upperCounter,p.B.lowerCounter].flatMap(cubicSegments);
for(const c of bCurves){details+=line(bm(c.from),bm(c.control1))+line(bm(c.control2),bm(c.to));for(const q of[c.control1,c.control2])details+=`<rect x="${n(bm(q)[0]-2.7)}" y="${n(bm(q)[1]-2.7)}" width="5.4" height="5.4" fill="#748b7a"/>`;for(const q of[c.from,c.to])details+=`<circle cx="${n(bm(q)[0])}" cy="${n(bm(q)[1])}" r="3.1" fill="#43584a"/>`;}
details+=text(120,925,"参数分工",18,"#435046")+text(120,965,"圆与圆弧：L、e、i 及连笔端部",17,"#6c796f")+text(120,1002,"椭圆：o 的内外字腔",17,"#6c796f")+text(120,1039,"直线：主竖干、x 的斜边与水平基线",17,"#6c796f")+text(120,1076,"自由曲线：B 的两组字腔",17,"#6c796f")+text(120,1145,"所有成品与制图均从 parameters.json 重新生成",16,"#536156");
details+=line([72,1244],[1528,1244])+text(72,1282,"几何规整依据选中位图；尺寸、模数与精确半径为本次拟合及定义，未推断原字体名称",15,"#738075");
files["lettering-construction.svg"]=svg(1600,1320,details);
geometry.letteringConstruction={circles:letteringCircles,ellipses:[p.o.outerRadii,p.o.innerRadii],bCubicSegments:bCurves};

const preview=svg(1400,660,`<rect width="1400" height="660" fill="#fff"/><g fill="#000" transform="translate(140 110) scale(1.85)">${lockup}</g>`);
files["logo-preview.svg"]=preview;
const inversePreview=svg(1400,660,`<rect width="1400" height="660" fill="#111a15"/><g fill="#fff" transform="translate(140 110) scale(1.85)">${lockup}</g>`);
files["inverse-preview.svg"]=inversePreview;
for(const[name,contents]of Object.entries(files))await fs.writeFile(path.join(dir,name),contents+"\n");
for(const name of ["logo-preview","inverse-preview","construction","lettering-construction"]){await sharp(Buffer.from(files[name+".svg"])).png().toFile(path.join(dir,name+".png"));}
await sharp(Buffer.from(files["logo.svg"])).resize({width:2400}).png().toFile(path.join(dir,"logo.png"));
await sharp(Buffer.from(files["logo-white.svg"])).resize({width:2400}).png().toFile(path.join(dir,"logo-white.png"));
await sharp(Buffer.from(files["wordmark.svg"])).resize({width:1488}).png().toFile(path.join(dir,"wordmark.png"));
await sharp(Buffer.from(files["ei-detail.svg"])).resize({width:1200}).flatten({background:"#fff"}).png().toFile(path.join(dir,"ei-detail.png"));
for(const h of[16,24,25,32,48])await sharp(Buffer.from(files["logo.svg"])).resize({height:h}).png().toFile(path.join(dir,`size-${h}.png`));
await fs.writeFile(path.join(dir,"geometry.json"),JSON.stringify(geometry,null,2)+"\n");
console.log({width,height,wordX,existingMarkSha256:sourceHash,output:dir});
