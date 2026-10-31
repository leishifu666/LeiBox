// System colour fonts can take tens of milliseconds to rasterize a new row.
// Keep that work off the input thread; transfer completed pixels, never DOM.
export function createEmojiRasterWorker(owner,onRow,onError){
 const browser=owner.defaultView;
 if(!browser.Worker||!browser.OffscreenCanvas)return null;
 const source=`onmessage=event=>{
  const {generation,id,width,height,ratio,entries}=event.data;
  const canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d');
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.textBaseline='alphabetic';
  for(const entry of entries){ctx.font=entry.font;ctx.fillStyle=entry.color;ctx.textAlign=entry.align;ctx.fillText(entry.text,entry.x+(entry.align==='center'?entry.width/2:0),entry.height/2+entry.baseline);}
  const bitmap=canvas.transferToImageBitmap();postMessage({generation,id,bitmap},[bitmap]);
 };`;
 const url=browser.URL.createObjectURL(new browser.Blob([source],{type:'text/javascript'}));
 try{
  const worker=new browser.Worker(url);worker.onmessage=event=>onRow(event.data);worker.onerror=event=>{event.preventDefault();onError();};
  return worker;
 }catch{return null;}
 finally{browser.URL.revokeObjectURL(url);}
}
