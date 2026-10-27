// Measured reconstruction: articulated, tapered legs and a shaded teardrop body.
const KNEES=[[24,-42],[35,-18],[39,11],[25,28]];
const FEET=[[17,-94],[62,4],[53,54],[17,76]];

export const SPIDER_MARKUP=`<svg class="sm-spider" viewBox="-104 -104 208 208">
 <defs>
  <radialGradient id="$spider-id-abdomen" gradientUnits="userSpaceOnUse" cx="-4" cy="-25" r="28"><stop offset="0" stop-color="#292a2b"/><stop offset=".42" stop-color="#151617"/><stop offset="1" stop-color="#050506"/></radialGradient>
  <radialGradient id="$spider-id-thorax" cx=".36" cy=".26" r=".75"><stop offset="0" stop-color="#303132"/><stop offset=".42" stop-color="#202122"/><stop offset="1" stop-color="#08090a"/></radialGradient>
  <radialGradient id="$spider-id-gloss"><stop offset="0" stop-color="#96989a" stop-opacity=".46"/><stop offset=".75" stop-color="#8a8c8e" stop-opacity=".3"/><stop offset="1" stop-color="#77797b" stop-opacity="0"/></radialGradient>
 </defs>
 ${Array.from({length:8},(_,i)=>`<g class="sm-leg" data-leg="${i}"><path class="sm-coxa"/><path class="sm-femur"/><path class="sm-tibia"/><circle class="sm-joint" r="1.25"/></g>`).join('')}
 <path class="sm-abdomen" d="M-4.5-5C-9.7-8.5-13.2-16-11.3-22.4-9.4-29-3.5-32.1 2.8-30.3 10.5-28.2 14-20.5 10.3-13.4 8-8.9 5.6-6 4.2-4.7Z" fill="url(#$spider-id-abdomen)"/>
 <path d="M-5-8C-10.2-15.2-9.8-23.4-3-28.6" fill="none" stroke="#9a9a9c" stroke-width=".65" opacity=".08"/>
 <ellipse class="sm-specular" cx="-2.4" cy="-23.5" rx="5.6" ry="3.1" fill="url(#$spider-id-gloss)"/>
 <path class="sm-palps" d="M-5.4 4.7Q-9.8 9.4-11.1 10.9-7.5 10-4.3 7.4L-5.8 14.8-1.8 8.1-1.3 15.8 1 8.3 4.8 15.4 3.5 7.8Q7.2 11.7 10.7 12.1L6.1 5.4Z"/>
 <circle class="sm-thorax" r="8.1" fill="url(#$spider-id-thorax)"/>
</svg>`;

function ribbon(a,b,firstWidth,lastWidth){
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
 return `M${a[0]+nx*firstWidth/2},${a[1]+ny*firstWidth/2}L${b[0]+nx*lastWidth/2},${b[1]+ny*lastWidth/2}Q${b[0]},${b[1]} ${b[0]-nx*lastWidth/2},${b[1]-ny*lastWidth/2}L${a[0]-nx*firstWidth/2},${a[1]-ny*firstWidth/2}Z`;
}

export function createSpiderRenderer(svg){
 const legs=[...svg.querySelectorAll('.sm-leg')].map(node=>({coxa:node.querySelector('.sm-coxa'),femur:node.querySelector('.sm-femur'),tibia:node.querySelector('.sm-tibia'),joint:node.querySelector('.sm-joint')}));
 const gloss=svg.querySelector('.sm-specular');let distance=0,stride=0;
 return (moved,angle)=>{
  distance+=moved;stride+=(Math.min(1,moved/1.8)-stride)*.32;
  legs.forEach((leg,index)=>{
   const side=index<4?-1:1,i=index%4,phase=distance*.13+(i%2)*Math.PI+(side<0?0:Math.PI),lift=Math.sin(phase)*6*stride;
   const anchor=[side*3.6,i*3.2-6.2],hip=[side*8.3,i*3.7-8],knee=[KNEES[i][0]*side,KNEES[i][1]+lift*.65];
   const foot=[FEET[i][0]*side+Math.cos(phase)*3.5*stride,FEET[i][1]+lift],dx=foot[0]-knee[0],dy=foot[1]-knee[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
   const cx=(knee[0]+foot[0])/2+nx*2.4*side,cy=(knee[1]+foot[1])/2+ny*2.4*side;
   leg.coxa.setAttribute('d',ribbon(anchor,hip,3.1,2.65));leg.femur.setAttribute('d',ribbon(hip,knee,2.65,1.9));
   leg.tibia.setAttribute('d',`M${knee[0]+nx*.9},${knee[1]+ny*.9}Q${cx+nx*.45},${cy+ny*.45} ${foot[0]},${foot[1]}Q${cx-nx*.45},${cy-ny*.45} ${knee[0]-nx*.9},${knee[1]-ny*.9}Z`);
   leg.joint.setAttribute('cx',String(knee[0]));leg.joint.setAttribute('cy',String(knee[1]));
  });
  gloss.setAttribute('transform',`rotate(${-angle} 0 -18)`);
 };
}
