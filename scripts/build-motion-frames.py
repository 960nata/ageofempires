"""Generate optically warped mounted and worker intermediary poses from original project art.
No outside art; originals and their frame coordinates remain untouched.
"""
from pathlib import Path
from PIL import Image
import cv2,numpy as np,json,argparse,math
from concurrent.futures import ThreadPoolExecutor
ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--only',default='');args=ap.parse_args();root=args.root;out=args.out;out.mkdir(parents=True,exist_ok=True)
m=json.loads((root/'src/rts/isolated-sprites.json').read_text());f=json.loads((root/'src/rts/faction-animation-frames.json').read_text());w=json.loads((root/'src/rts/walking-frames.json').read_text());jobs={}
for name,d in f.items():
 if name.endswith('-cavalry'):jobs[Path(d['file']).stem]=[(r,[(1,2),(2,3),(4,5),(5,6)]) for r in range(len(d['frames']))]
for name in ['horse','camel','camel-sword','horse-archer','war-elephant','chariot']:
 d=w[name];jobs[Path(d['file']).stem]=[(r,[(i,(i+1)%8) for i in range(8)]) for r in range(len(d['frames']))]
for stem in ['saracen-horse-sword-v1','saracen-horse-shield-v1','saracen-horse-archer-v1']:
 jobs[stem]=[(r,[(1,2),(2,3),(4,5),(5,6)]) for r in range(8)]
for stem in ['worker-actions-v1','villager-female-actions-v1','villager-hijab-actions-v1']:
 jobs[stem]=[(r,[(i,(i+1)%4) for i in range(4)]+[(i,4+(i-3)%4) for i in range(4,8)]) for r in range(5)]
if args.only:jobs={k:v for k,v in jobs.items() if any(x in k for x in args.only.split(','))}
# The flow needs a consistent opaque background; transparent pixels are excluded again afterward.
def make_pair(src,fa,fb):
 left=math.floor(min(fa['x']-fa['cx'],fb['x']-fb['cx']))-6
 top=math.floor(min(fa['y']-fa['ground'],fb['y']-fb['ground']))-6
 right=math.ceil(max(fa['x']+fa['w']-fa['cx'],fb['x']+fb['w']-fb['cx']))+6
 bottom=math.ceil(max(fa['y']+fa['h']-fa['ground'],fb['y']+fb['h']-fb['ground']))+6
 H,W=bottom-top,right-left
 def put(f):
  base=np.zeros((H,W,4),dtype=np.uint8);x=round(f['x']-f['cx']-left);y=round(f['y']-f['ground']-top);tile=src[f['y']:f['y']+f['h'],f['x']:f['x']+f['w']]
  yy=max(0,y);xx=max(0,x);base[yy:min(H,y+len(tile)),xx:min(W,x+len(tile[0]))]=tile[yy-y:min(H,y+len(tile))-y,xx-x:min(W,x+len(tile[0]))-x];return base
 a,b=put(fa),put(fb);background=np.array([68,75,70],dtype=np.float32)
 def gray(v):
  alpha=v[:,:,3:4].astype(np.float32)/255;rgb=v[:,:,:3].astype(np.float32)*alpha+background*(1-alpha);return cv2.cvtColor(rgb.astype(np.uint8),cv2.COLOR_RGB2GRAY)
 dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_FAST);ab=dis.calc(gray(a),gray(b),None);ba=dis.calc(gray(b),gray(a),None)
 # Limit gross mismatches while allowing limb displacement. Poor matches should not stretch far across the sprite.
 ab=np.clip(ab,-22,22);ba=np.clip(ba,-22,22);ys,xs=np.mgrid[0:H,0:W].astype(np.float32);frames=[]
 for t in [i/8 for i in range(1,8)]:
  wa=cv2.remap(a,xs-ab[:,:,0]*t,ys-ab[:,:,1]*t,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
  wb=cv2.remap(b,xs-ba[:,:,0]*(1-t),ys-ba[:,:,1]*(1-t),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
  aa=wa[:,:,3:4].astype(np.float32)/255;bb=wb[:,:,3:4].astype(np.float32)/255;alpha=(1-t)*aa+t*bb;rgb=((1-t)*wa[:,:,:3].astype(np.float32)*aa+t*wb[:,:,:3].astype(np.float32)*bb)/np.maximum(.005,alpha)
  full=np.concatenate([np.clip(rgb,0,255),np.clip(alpha*255,0,255)],axis=2).astype(np.uint8)
  nz=np.where(full[:,:,3]>5)
  if len(nz[0]):x0=max(0,int(nz[1].min())-2);y0=max(0,int(nz[0].min())-2);x1=min(W,int(nz[1].max())+3);y1=min(H,int(nz[0].max())+3)
  else:x0=y0=0;x1=y1=1
  frames.append((Image.fromarray(full[y0:y1,x0:x1]),-left-x0,-top-y0))
 return frames

def process(job):
 stem,pairs=job;meta=m.get(stem)
 if not meta:return stem,None
 src=np.array(Image.open(root/'public/assets/isometric'/meta['file']).convert('RGBA'));generated=[]
 for row,transitions in pairs:
  for col,nextcol in transitions:
   a=meta['frames'][row*meta['cols']+col];b=meta['frames'][row*meta['cols']+nextcol]
   for step,(image,cx,ground) in enumerate(make_pair(src,a,b),1):generated.append((f'{a["x"]},{a["y"]}:{b["x"]},{b["y"]}:{step}',image,cx,ground))
 cw=max(image.width for _,image,_,_ in generated)+12;ch=max(image.height for _,image,_,_ in generated)+12;columns=12;sheet=Image.new('RGBA',(cw*columns,ch*math.ceil(len(generated)/columns)));rects={}
 for i,(key,image,cx,ground) in enumerate(generated):
  x=(i%columns)*cw+6;y=(i//columns)*ch+6;sheet.alpha_composite(image,(x,y));rects[key]=dict(x=x-4,y=y-4,w=image.width+8,h=image.height+8,cx=x+cx,ground=y+ground)
 # Most on-screen cavalry are <100 px high. Three-quarter-size intermediates keep decoded memory down.
 render_scale=.75;sheet=sheet.resize((round(sheet.width*render_scale),round(sheet.height*render_scale)),Image.Resampling.LANCZOS)
 rects={key:{field:round(value*render_scale,3) for field,value in rect.items()} for key,rect in rects.items()}
 assets=out/'assets';assets.mkdir(exist_ok=True);sheet.save(assets/(stem+'.avif'),quality=80,speed=8,subsampling='4:4:4');sheet.save(assets/(stem+'.webp'),quality=86,method=4)
 return stem,dict(renderScale=render_scale,file='motion-v1/'+stem+'.avif',fallback='motion-v1/'+stem+'.webp',frames=rects,bytes=(assets/(stem+'.avif')).stat().st_size)
results={}
with ThreadPoolExecutor(max_workers=2) as pool:
 for i,(stem,data) in enumerate(pool.map(process,jobs.items())):
  if data:results[stem]=data
  print(f'Prepared {i+1}/{len(jobs)} {stem}',flush=True)
(out/'motion-frames.json').write_text(json.dumps(results,separators=(',',':'))+'\n')
print('READY',len(results),'atlases',sum(len(d['frames']) for d in results.values()),'in-betweens',round(sum(d['bytes'] for d in results.values())/1024/1024,2),'MiB AVIF',flush=True)
