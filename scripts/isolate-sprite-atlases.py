"""Isolate legacy RTS sprites with transparent gutters and explicit ground anchors.
Never overwrite source art. Run with --root PROJECT --out STAGING; install generated metadata/assets together.
Requires Pillow, numpy and scipy. Each source is decoded once; cleaning is offline.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,json,math
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage as nd
ap=argparse.ArgumentParser();ap.add_argument('--only',default='');ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args();root=args.root;out=args.out;out.mkdir(parents=True,exist_ok=True)
public=root/'public/assets/isometric';avif=set(json.loads((root/'src/rts/avif-assets.json').read_text()));jobs={}
def add(stem,rows,cols,rects=None,kind='object',bands=None):
 if stem not in jobs:jobs[stem]=dict(rows=rows,cols=cols,rects=rects,kind=kind,bands=bands)
regions=['english','french','saracen','mongol','chinese','japanese','khmer']
for region in regions:add(region+'-settlement-v1',3,4,kind='building');add(region+'-signature-v1',8,6,kind='unit')
for region in regions+['roman','persian','castilian']:add(region+'-fortification-eras-v1',4,4,kind='building')
add('gate-motion-v1',4,5,kind='building')
for stem in ['villager-male-locomotion-v1','villager-female-locomotion-v1','villager-hijab-locomotion-v1']:add(stem,8,6,kind='unit')
for stem in ['villager-female-actions-v1','villager-hijab-actions-v1']:add(stem,5,8,kind='unit')
for name in ['sword','shield','archer']:add('saracen-horse-'+name+'-v1',8,8,kind='unit')
add('saracen-infantry-v1',6,10,kind='unit')
for group in ['walking','combat','faction-animation']:
 data=json.loads((root/f'src/rts/{group}-frames.json').read_text())
 for key,d in data.items():add(Path(d['file']).stem,len(d['frames']),len(d['frames'][0]),d['frames'],'unit')
for group in ['scene','era']:
 data=json.loads((root/f'src/rts/{group}-frames.json').read_text())
 for key,rs in data.items():
  cols=4 if len(rs)>1 else 1;add(key,math.ceil(len(rs)/cols),cols,[rs[i:i+cols] for i in range(0,len(rs),cols)],'effect' if 'fx' in key else 'building' if any(x in key for x in ['settlement','fortification','utilities','landmark','roman-','persian-']) else 'object')
for stem,cols,bands in [('worker-actions-v1',8,[0,258,520,763,982,1254]),('resource-states-v1',4,[0,255,492,720,1024]),('siege-actions-v1',4,[0,251,514,748,1024]),('production-atlas-v1',4,[0,341,678,1024]),('institutions-v1',4,[0,433,887])]:add(stem,len(bands)-1,cols,kind='unit' if stem.startswith('worker') else 'building' if stem.startswith(('production','institutions')) else 'object',bands=bands)
for stem,bands in [('people-directions-v2',[0,186,364,544,736,924,1254]),('persian-directions-v2',[0,173,333,515,690,862,1027,1254]),('mounted-directions-v2',[0,189,350,520,720,910,1120,1254])]:add(stem,len(bands)-1,8,kind='unit',bands=bands)
add('world-atlas-v1',4,4,kind='object');add('units-atlas-v1',8,4,kind='unit',bands=[0,.108,.222,.335,.435,.583,.735,.865,1])
# Tree-fall poses intentionally contain detached trunks/stumps: leave those composite effects unchanged.
# Composite nature/effect art intentionally contains disconnected pieces.
for stem in ['ruins-v1', 'woodland-v2', 'orchard-grasses-v3', 'gold-directions-v3', 'quarry-directions-v3', 'rock-formations-v1', 'disaster-fx-v1', 'resource-states-v1']:jobs.pop(stem,None)
def source(stem):
 for p in [public/(stem+'.png'),root/'art-src/isometric'/(stem+'.png'),public/(stem+('.avif' if stem in avif else '.webp')),public/(stem+'.webp'),public/(stem+'.avif')]:
  if p.exists():return p
 raise FileNotFoundError(stem)
def cut(profile,guess,span):
 lo=max(1,int(guess-span));hi=min(len(profile)-1,int(guess+span));smooth=nd.uniform_filter1d(profile.astype(float),3);v=smooth[lo:hi];score=v+np.abs(np.arange(lo,hi)-guess)*.018
 return lo+int(np.argmin(score))
def isolate(tile,kind):
 alpha=tile[:,:,3];solid=alpha>85;labels,n=nd.label(solid,structure=np.ones((3,3)));sizes=np.bincount(labels.ravel());sizes[0]=0
 if not n:return tile,0
 main=labels==int(sizes.argmax());keep=main.copy();distance=nd.distance_transform_edt(~main);reach=max(6,min(22,max(tile.shape[:2])*.055))
 if kind=='effect':keep=solid
 else:
  for ident,sl in enumerate(nd.find_objects(labels),1):
   if sl is None or sizes[ident]<3:continue
   piece=labels[sl]==ident
   edge=sl[0].start==0 or sl[1].start==0 or sl[0].stop==tile.shape[0] or sl[1].stop==tile.shape[1]
   near=6 if kind=='building' else reach
   if ident==int(sizes.argmax()) or (not(kind=='building' and (edge or sizes[ident]>sizes.max()*.15)) and np.any(distance[sl][piece]<=near)):keep[sl]|=piece
 # Keep soft edge pixels only when connected to retained opaque components. No alpha haze or distant fragments.
 keep=nd.binary_dilation(keep,iterations=2)&(alpha>4);clean=tile.copy();removed=int(np.count_nonzero(solid&~keep));clean[~keep]=0
 return clean,removed

def process(item):
 stem,j=item
 try:p=source(stem)
 except FileNotFoundError:return stem,None,{'missing':stem},[]
 rgba=np.array(Image.open(p).convert('RGBA'));H,W=rgba.shape[:2];a=rgba[:,:,3]>85;rows,cols=j['rows'],j['cols'];pieces=[];report=[];proof=[]
 global_labels,global_n=nd.label(a,structure=np.ones((3,3))) if j['kind']=='unit' else (None,0)
 global_slices=nd.find_objects(global_labels) if global_n else []
 if j['rects'] is None:
  ys=j['bands']
  if ys is not None:
   factor=H/ys[-1];ys=[round(y*factor) for y in ys]
   ys=[0]+[cut(a.sum(1),y,min((ys[i+1]-ys[i-1])*.11,H/rows*.22)) for i,y in enumerate(ys[1:-1],1)]+[H]
  else:ys=[0]+[cut(a.sum(1),r*H/rows,H/rows*.22) for r in range(1,rows)]+[H]
  rects=[]
  for row in range(rows):
   y0,y1=ys[row:row+2];profile=a[y0:y1].sum(0);xs=[0]+[cut(profile,c*W/cols,W/cols*.23) for c in range(1,cols)]+[W]
   rects.append([dict(x=xs[c],y=y0,w=xs[c+1]-xs[c],h=y1-y0) for c in range(cols)])
 else:rects=j['rects']
 for row,rs in enumerate(rects):
  for col,r in enumerate(rs):
   x0=max(0,int(r['x']));y0=max(0,int(r['y']));x1=min(W,math.ceil(r['x']+r['w']));y1=min(H,math.ceil(r['y']+r['h']));tile=rgba[y0:y1,x0:x1].copy()
   if not tile.size:raise ValueError(f'Invalid crop {stem} {row}:{col}')
   before=tile.copy();old_x,old_y=x0,y0
   # Recover a complete body even when the old rectangle cuts through its head/weapon.
   # Choosing the dominant connected body excludes the neighbouring pose's detached head.
   if global_n:
    counts=np.bincount(global_labels[y0:y1,x0:x1].ravel(),minlength=global_n+1);counts[0]=0;ident=int(counts.argmax());sl=global_slices[ident-1] if ident else None
    if sl and sl[1].stop-sl[1].start<W/cols*1.85 and sl[0].stop-sl[0].start<H/rows*1.6:
     x0=max(0,sl[1].start-8);x1=min(W,sl[1].stop+8);y0=max(0,sl[0].start-8);y1=min(H,sl[0].stop+8);tile=rgba[y0:y1,x0:x1].copy()
   clean,removed=isolate(tile,j['kind']);solid=clean[:,:,3]>85;yy,xx=np.where(solid)
   if not len(xx):
    # Preserve explicit empty slots as transparent; never borrow a neighbouring object.
    pieces.append((row,col,Image.new('RGBA',(1,1)),0,0));report.append({'row':row,'col':col,'empty':True});continue
   soft=np.where(clean[:,:,3]>0);left=max(0,int(soft[1].min()));top=max(0,int(soft[0].min()));right=int(soft[1].max())+1;bottom=int(soft[0].max())+1
   ground=r.get('ground',old_y+r.get('anchorY',1)*r['h'])-y0
   cx=r.get('cx',old_x+r.get('anchorX',.5)*r['w'])-x0
   if ground>yy.max()+5 or ground<yy.min():ground=float(yy.max()+1)
   if cx<xx.min()-5 or cx>xx.max()+5:cx=float(np.median(xx[yy>=yy.max()-max(3,(yy.max()-yy.min())*.1)]))
   if j['rects'] is None:ground=float(yy.max()+1);cx=float((xx.min()+xx.max()+1)/2)
   cropped=Image.fromarray(clean[top:bottom,left:right]);pieces.append((row,col,cropped,cx-left,ground-top))
   if removed>20:
    report.append({'row':row,'col':col,'removedPixels':removed,'keptPixels':int(solid.sum())})
    if len(proof)<3:proof.append((stem,row,col,Image.fromarray(before),Image.fromarray(clean),removed))
 cw=max(im.width for _,_,im,_,_ in pieces)+12;ch=max(im.height for _,_,im,_,_ in pieces)+12
 sheet=Image.new('RGBA',(cw*cols,ch*rows));frames=[]
 for row,col,im,cx,ground in pieces:
  x=col*cw+6;y=row*ch+6;sheet.alpha_composite(im,(x,y));frames.append(dict(x=x-4,y=y-4,w=im.width+8,h=im.height+8,cx=x+cx,ground=y+ground))
 # Four clear pixels inside every rect plus two outside prevent filtering into the adjacent frame.
 dest=out/'assets';dest.mkdir(exist_ok=True);sheet.save(dest/(stem+'.avif'),quality=86,speed=8,subsampling='4:4:4');sheet.save(dest/(stem+'.webp'),quality=90,method=4)
 edge_runs=[]
 if rows==1 and cols==1 and j['kind']=='building':
  mask=np.array(pieces[0][2])[:,:,3]>85
  for edge in [mask[:,0],mask[:,-1]]:
   lab,num=nd.label(edge);edge_runs.append(max(np.bincount(lab)[1:],default=0))
  # Pre-cropped sources with long straight cut edges cannot supply a complete building.
  complete=max(edge_runs,default=0)<max(18,mask.shape[0]*.2)
 else:complete=True
 meta={'suspectSourceCrop':not bool(complete),'complete':stem not in ['roman-feudal-10','roman-feudal-11','persian-dark-west-10'],'file':'isolated-v1/'+stem+'.avif','fallback':'isolated-v1/'+stem+'.webp','rows':rows,'cols':cols,'sourceWidth':W,'sourceHeight':H,'frames':frames}
 audit={'atlas':stem,'source':str(p.relative_to(root)),'frames':len(frames),'removedPixels':sum(v.get('removedPixels',0) for v in report),'details':report,'bytes':(dest/(stem+'.avif')).stat().st_size}
 return stem,meta,audit,proof
manifest=json.loads((out/'isolated-sprites.json').read_text()) if args.only else {};audit=json.loads((out/'atlas-isolation-report.json').read_text()) if args.only else [];proofs=[]
if args.only:
 jobs={k:v for k,v in jobs.items() if any(t in k for t in args.only.split(','))};audit=[a for a in audit if a.get('atlas') not in jobs]
with ThreadPoolExecutor(max_workers=3) as pool:
 for i,(stem,meta,row,proof) in enumerate(pool.map(process,jobs.items())):
  if meta:manifest[stem]=meta
  audit.append(row);proofs+=proof
  if i%25==0:print(f'Processed {i+1}/{len(jobs)}: {stem}',flush=True)
(out/'isolated-sprites.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');(out/'atlas-isolation-report.json').write_text(json.dumps(audit,indent=2)+'\n')
# Before/after contact sheets expose the actual removed fragments, at an identical image scale.
selected=sorted(proofs,key=lambda q:q[5],reverse=True)[:24]
for page in range(math.ceil(len(selected)/8)):
 preview=Image.new('RGB',(1200,1120),'#343b38');d=ImageDraw.Draw(preview)
 for i,(stem,row,col,before,after,lost) in enumerate(selected[page*8:page*8+8]):
  x=(i%2)*600;y=(i//2)*280;d.text((x+8,y+5),f'{stem} [{row},{col}] -{lost}px',fill='white');f=min(280/max(before.width,after.width),244/max(before.height,after.height))
  for j,im in enumerate([before,after]):
   im=im.resize((round(im.width*f),round(im.height*f)));preview.paste(im,(x+j*300+8,y+28),im)
 preview.save(out/f'audit-{page+1}.jpg')
print('READY',len(manifest),'atlases',sum(len(m['frames']) for m in manifest.values()),'frames',sum(a.get('bytes',0) for a in audit)//1024,'KiB AVIF',flush=True)
