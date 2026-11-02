export const INK_VERTEX=`attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

export const INK_FRAGMENT=`precision highp float;
varying vec2 v_uv;
uniform sampler2D u_from,u_to;
uniform vec4 u_fromRect,u_toRect;
uniform vec2 u_origin;
uniform float u_progress,u_aspect,u_roughness,u_seed;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float field(vec2 p){float n=0.,a=.55;for(int i=0;i<5;i++){n+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p+3.7;a*=.47;}return n;}
vec2 atlas(vec2 uv,vec4 r){return r.xy+clamp(uv,.001,.999)*r.zw;}
void main(){
 vec2 uv=vec2(v_uv.x,1.-v_uv.y),aspect=vec2(u_aspect,1.);
 if(u_progress<=0.){gl_FragColor=texture2D(u_from,atlas(uv,u_fromRect));return;}
 if(u_progress>=1.){gl_FragColor=texture2D(u_to,atlas(uv,u_toRect));return;}
 vec2 delta=(uv-u_origin)*aspect;
 float distanceFromPress=length(delta);
 vec2 farthest=max(u_origin,1.-u_origin)*aspect;
 float reach=length(farthest);
 float growth=mix(-.12,reach+.22,u_progress);
 float wobble=(field(uv*vec2(5.2,6.8)+vec2(u_seed,u_seed*.71)+u_progress*.75)-.5)*(.10+u_roughness*.27)*sin(u_progress*3.14159265);
 float edge=distanceFromPress+wobble-growth;
 float reveal=1.-smoothstep(-.008,.005,edge);
 float lens=exp(-edge*edge/.0012)*.045*(1.-u_progress);
 vec2 direction=delta/max(distanceFromPress,.001)/aspect;
 vec4 before=texture2D(u_from,atlas(uv-direction*lens,u_fromRect));
 vec4 after=texture2D(u_to,atlas(uv+direction*lens*.45,u_toRect));
 gl_FragColor=mix(before,after,reveal);
}`;
