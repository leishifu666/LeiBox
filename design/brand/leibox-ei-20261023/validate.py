"""Check the actual exported paths, transparency and rasterized use sizes."""
from pathlib import Path
from collections import deque
import json, hashlib, math, re, xml.etree.ElementTree as ET
import numpy as np
from PIL import Image, ImageDraw, ImageFont

directory=Path(__file__).resolve().parent
root=directory.parents[2]
geo=json.loads((directory/'geometry.json').read_text(encoding='utf-8'))
source_path=root/geo['mark']['source']
source=(source_path if source_path.exists() else directory/'existing-mark.svg').read_bytes()
svg=ET.parse(directory/'logo.svg').getroot()
ns={'s':'http://www.w3.org/2000/svg'}
actual=svg.find(".//s:g[@id='existing-symbol']/s:path",ns)
original=ET.fromstring(source).find('s:path',ns)
assert actual.attrib['d']==original.attrib['d']
assert hashlib.sha256(source).hexdigest()==geo['sourceMarkSha256']
for name in ['logo.svg','logo-white.svg','wordmark.svg','ei-detail.svg']:
 tree=ET.parse(directory/name).getroot()
 assert not tree.findall('.//s:text',ns) and not tree.findall('.//s:image',ns)
 for node in tree.iter():
  assert not any(key.endswith('href') for key in node.attrib)
for name in ['construction.svg','lettering-construction.svg']:
 tree=ET.parse(directory/name).getroot(); ids=[node.get('id') for node in tree.iter() if node.get('id')]
 assert len(ids)==len(set(ids)), f'Duplicate SVG IDs in {name}'

def topology(mask):
 h,w=mask.shape
 def count(a,diag):
  seen=np.zeros_like(a,dtype=bool);items=[]
  for y in range(h):
   for x in range(w):
    if not a[y,x] or seen[y,x]:continue
    queue=deque([(x,y)]);seen[y,x]=True;area=0;edge=False
    while queue:
     xx,yy=queue.popleft();area+=1;edge=edge or xx==0 or yy==0 or xx==w-1 or yy==h-1
     for dx,dy in ([(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)] if diag else [(-1,0),(1,0),(0,-1),(0,1)]):
      nx,ny=xx+dx,yy+dy
      if 0<=nx<w and 0<=ny<h and a[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;queue.append((nx,ny))
    items.append((area,edge))
  return items
 foreground=count(mask,True);background=count(~mask,False)
 holes=[area for area,edge in background if not edge]
 return {'components':len(foreground),'holes':len(holes),'smallest_hole_pixels':min(holes) if holes else 0}

def alpha(path):return np.array(Image.open(path).convert('RGBA'))[:,:,3]

# Recover line/arc tangents from exported SVG instructions, not from cached guide labels.
def segments(d):
 tokens=re.findall(r'[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?',d);i=0;current=None;start=None;result=[]
 while i<len(tokens):
  cmd=tokens[i];i+=1
  if cmd=='M':current=np.array([float(tokens[i]),float(tokens[i+1])]);i+=2;start=current.copy();continue
  if cmd in ['L','H','V','Z']:
   if cmd=='L':end=np.array([float(tokens[i]),float(tokens[i+1])]);i+=2
   elif cmd=='H':end=np.array([float(tokens[i]),current[1]]);i+=1
   elif cmd=='V':end=np.array([current[0],float(tokens[i])]);i+=1
   else:end=start.copy()
   delta=end-current
   if np.linalg.norm(delta)>1e-8:
    tangent=delta/np.linalg.norm(delta);result.append((current.copy(),end.copy(),tangent,tangent))
   current=end;continue
  if cmd=='A':
   rx,ry,rotation,large,sweep,x,y=map(float,tokens[i:i+7]);i+=7
   assert abs(rx-ry)<1e-8 and rotation==0
   end=np.array([x,y]);half=(current-end)/2;q=float(np.dot(half,half));radius=max(rx,math.sqrt(q))
   factor=math.sqrt(max(0,radius*radius/q-1))*(-1 if bool(large)==bool(sweep) else 1)
   center=(current+end)/2+np.array([half[1],-half[0]])*factor
   def tangent(point):
    v=(point-center)/radius
    return np.array([-v[1],v[0]])*(1 if sweep else -1)
   result.append((current.copy(),end.copy(),tangent(current),tangent(end)));current=end;continue
  raise ValueError(cmd)
 return result

tangencies={}
for name in ['letter-L','e-bowl','ei-shared-stroke']:
 node=svg.find(f".//s:path[@id='{name}']",ns);items=segments(node.get('d'));angles=[];gaps=[]
 for a,b in zip(items,items[1:]+items[:1]):
  gaps.append(float(np.linalg.norm(a[1]-b[0])))
  angles.append(math.degrees(math.acos(float(np.clip(np.dot(a[3],b[2]),-1,1)))))
 tangencies[name]={'max_join_gap_u':max(gaps),'max_tangent_angle_degrees':max(angles)}
 assert max(gaps)<1e-5 and max(angles)<.05,(name,tangencies[name])

ei=geo['ei'];bar=np.array(ei['barEnd'])-np.array(ei['barStart']);bar=bar/np.linalg.norm(bar);normal=np.array([-bar[1],bar[0]])
theta=math.radians(ei['arcEndDegrees']);middle=(ei['outerRadius']+ei['innerRadius'])/2;ring_cap=(ei['outerRadius']-ei['innerRadius'])/2
cap_center=np.array(ei['center'])+middle*np.array([math.cos(theta),math.sin(theta)])
union_tangent_error=abs(float(np.dot(normal,cap_center-np.array(ei['barStart'])))+ring_cap-ei['barRadius'])
stem=ei['stemBounds'];stem_cap=np.array([stem[0]+stem[2]/2,stem[1]+stem[2]/2])
assert union_tangent_error<1e-6 and np.linalg.norm(stem_cap-np.array(ei['barEnd']))<1e-6 and stem[2]/2==ei['barRadius']

sizes=[]
for height in [16,24,25,32,48]:
 a=alpha(directory/f'size-{height}.png')
 thresholds={str(t):topology(a>=t) for t in [96,128,160]}
 sizes.append({'height':height,'width':a.shape[1],'thresholds':thresholds})
assert np.array_equal(alpha(directory/'logo.png'),alpha(directory/'logo-white.png'))
assert int(alpha(directory/'logo.png')[0,0])==0
word=topology(alpha(directory/'wordmark.png')>=128)
assert word['components']==6 and word['holes']==4,word
assert all(item['thresholds']['128']['components']==7 and item['thresholds']['128']['holes']==5 for item in sizes if item['height']>=24)

# Inspect native-scale samples alongside enlarged nearest-neighbour pixel views.
sheet=Image.new('RGB',(1200,620),'#f5f7f4');draw=ImageDraw.Draw(sheet)
try:font=ImageFont.truetype('DejaVuSans.ttf',20)
except OSError:font=ImageFont.load_default(size=20)
draw.text((32,22),'Actual sizes / black + reversed / nearest-neighbour enlargement',font=font,fill='#34443a')
for index,item in enumerate(sizes):
 y=80+index*100;sample=Image.open(directory/f"size-{item['height']}.png").convert('RGBA')
 draw.text((32,y+12),str(item['height'])+' px',font=font,fill='#34443a')
 sheet.paste(sample,(130,y+8),sample)
 white=Image.new('RGBA',sample.size,'white');white.putalpha(sample.getchannel('A'))
 draw.rectangle((330,y,520,y+72),fill='#12261e');sheet.paste(white,(345,y+8),white)
 zoom=sample.resize((sample.width*3,sample.height*3),Image.Resampling.NEAREST)
 if zoom.height>80:zoom=sample.resize((round(sample.width*80/sample.height),80),Image.Resampling.NEAREST)
 sheet.paste(zoom,(590,y),zoom)
sheet.save(directory/'size-check.png')
report={
 'source_svg_path_unchanged':True,'source_svg_sha256':geo['sourceMarkSha256'],
 'logo_has_no_fonts_or_embedded_rasters':True,'drawing_svg_ids_unique':True,
 'curve_tangencies_from_exported_paths':tangencies,'wordmark_topology':word,
 'merged_outline_checks':{'e_end_cap_to_lower_bar_tangent_error_u':union_tangent_error,'i_top_and_bar_end_share_exact_cap':True},
 'black_and_white_alpha_identical':True,'background_is_transparent':True,
 'sizes':sizes,'recommended_minimum_height_px':32,
 'limitations':['Source wordmark is only 92x25 pixels; exact original typeface and historical construction rules are unknown.','No external recognition test or print production test was performed.']
}
(directory/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))
