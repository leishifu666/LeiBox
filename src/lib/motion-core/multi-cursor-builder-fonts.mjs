const documents=new WeakMap();

/** Register exact style/weight descriptors once per document; release on the last unmount. */
export function acquireBuilderFonts(owner,definitions){
 let cache=documents.get(owner);if(!cache){cache=new Map();documents.set(owner,cache);}
 const leases=definitions.map(({family,source,...descriptors})=>{
  const key=family+JSON.stringify(descriptors)+source;let entry=cache.get(key);
  if(!entry){const face=new owner.defaultView.FontFace(family,source,descriptors);owner.fonts.add(face);entry={face,users:0,ready:face.load().catch(()=>null)};cache.set(key,entry);}
  entry.users++;return{key,entry};
 });
 return{ready:Promise.all(leases.map(l=>l.entry.ready)),release(){for(const{key,entry}of leases){if(--entry.users===0){owner.fonts.delete(entry.face);cache.delete(key);}}}};
}
