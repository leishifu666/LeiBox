// One texture upload and one GPU draw replace dozens of canvas strip copies.
// The 2D path keeps the picker usable where WebGL is unavailable.
export function createFoldedEmojiRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 if(gl){
  const shader=(type,source)=>{const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);return result;};
  const vertex=shader(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*vec2(.5,-.5)+.5;gl_Position=vec4(position,0.,1.);}');
  const fragment=shader(gl.FRAGMENT_SHADER,`
   precision highp float;
   uniform sampler2D pixels;uniform vec2 size;uniform vec2 fold;uniform float padding;
   varying vec2 uv;
   void main(){
    float y=uv.y*size.y,sy=y,u=0.;
    if(fold.x>0.&&y<fold.x){u=1.-y/fold.x;sy=fold.x-(1.570796327-acos(clamp(u,0.,1.)))*fold.x;}
    else if(fold.y>0.&&y>size.y-fold.y){u=1.-(size.y-y)/fold.y;sy=size.y-fold.y+(1.570796327-acos(clamp(u,0.,1.)))*fold.y;}
    float scale=1.-.065*u*u,x=(uv.x-.5)/scale+.5;
    if(x<0.||x>1.){gl_FragColor=vec4(vec3(34./255.),1.);return;}
    vec4 color=texture2D(pixels,vec2(x,(sy+padding)/(size.y+padding*2.)));
    gl_FragColor=vec4(mix(vec3(34./255.),color.rgb*(1.-.3*pow(u,1.5)),color.a),1.);
   }`);
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const size=gl.getUniformLocation(program,'size'),fold=gl.getUniformLocation(program,'fold'),padding=gl.getUniformLocation(program,'padding');
  let width=0,height=0;
  return{
   mode:'webgl',
   draw(source,w,h,ratio,top,bottom,pad){
    gl.viewport(0,0,canvas.width,canvas.height);
    if(width!==source.width||height!==source.height){width=source.width;height=source.height;gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);}
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);
    gl.uniform2f(size,w,h);gl.uniform2f(fold,top,bottom);gl.uniform1f(padding,pad);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   },
   destroy(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);gl.getExtension('WEBGL_lose_context')?.loseContext();}
  };
 }
 const ctx=canvas.getContext('2d'),edgeCanvas=canvas.ownerDocument.createElement('canvas'),edgeContext=edgeCanvas.getContext('2d');
 return{
  mode:'2d',
  draw(source,w,h,ratio,top,bottom,padding){
   const sourceY=y=>{if(top&&y<top)return top-(Math.PI/2-Math.acos(1-y/top))*top;if(bottom&&y>h-bottom)return h-bottom+(Math.PI/2-Math.acos(1-(h-y)/bottom))*bottom;return y;};
   ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#222';ctx.fillRect(0,0,w,h);
   ctx.drawImage(source,0,padding*ratio,source.width,h*ratio,0,0,w,h);
   for(const edge of ['top','bottom']){
    const size=edge==='top'?top:bottom;if(size<=0)continue;
    const start=edge==='top'?0:Math.floor(h-size),end=edge==='top'?Math.ceil(size):h;
    const pixelWidth=Math.ceil(w*ratio),pixelHeight=Math.ceil((end-start)*ratio);
    if(edgeCanvas.width!==pixelWidth||edgeCanvas.height!==pixelHeight){edgeCanvas.width=pixelWidth;edgeCanvas.height=pixelHeight;}
    edgeContext.setTransform(ratio,0,0,ratio,0,0);edgeContext.clearRect(0,0,w,end-start);
    ctx.fillStyle='#222';ctx.fillRect(0,start,w,end-start);
    for(let y=start;y<end;y++){
     const sy=sourceY(y)+padding,ey=sourceY(Math.min(h,y+1))+padding,height=ey-sy;
     const distance=edge==='top'?y:h-y-1,u=Math.max(0,1-distance/size),scale=1-.065*u*u,width=w*scale,x=(w-width)/2;
     if(height>0)edgeContext.drawImage(source,0,sy*ratio,source.width,height*ratio,x,y-start,width,1.15);
    }
    // Shade the folded foreground while preserving transparent gutters. The
    // fixed panel background must never acquire a curved dark silhouette.
    edgeContext.globalCompositeOperation='source-atop';
    for(let y=start;y<end;y++){
     const distance=edge==='top'?y:h-y-1,u=Math.max(0,1-distance/size);
     edgeContext.fillStyle=`rgba(0,0,0,${.3*u**1.5})`;edgeContext.fillRect(0,y-start,w,1);
    }
    edgeContext.globalCompositeOperation='source-over';ctx.drawImage(edgeCanvas,0,start,w,end-start);
   }
  },
  destroy(){edgeCanvas.width=edgeCanvas.height=0;}
 };
}
