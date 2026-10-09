from pathlib import Path
from PIL import Image
from scipy import ndimage as nd
import numpy as np,json
root=Path(__file__).resolve().parents[1];out=root/'public/assets/isometric';out.mkdir(exist_ok=True)
factions=['roman','persian','english','french','ayyubid','chinese','japanese','khmer','castilian','steppe']
manifest={};stats=[]
def cut(profile,guess,span):
 lo=max(1,int(guess-span));hi=min(len(profile)-1,int(guess+span));v=nd.uniform_filter1d(profile.astype(float),3);part=v[lo:hi];score=part+np.abs(np.arange(lo,hi)-guess)*.015;return lo+int(np.argmin(score))
for faction in factions:
 manifest[faction]={}
 for kind,cols,stem in [('facades',12,'settlement-era-facades'),('town',8,'town-era-lifecycle')]:
  source=root/'public/assets/isometric'/f'{faction}-{stem}-v1.png';rgba=np.array(Image.open(source).convert('RGBA'));h,w=rgba.shape[:2];alpha=rgba[:,:,3];rows=4
  ys=[0]+[cut((alpha>85).sum(axis=1),r*h/rows,h/rows*.15) for r in range(1,rows)]+[h];objects=[]
  for row in range(rows):
   y0,y1=ys[row:row+2];band=alpha[y0:y1];xs=[0]+[cut((band>85).sum(axis=0),c*w/cols,w/cols*.18) for c in range(1,cols)]+[w]
   for col in range(cols):
    x0,x1=xs[col:col+2];tile=rgba[y0:y1,x0:x1].copy();solid=tile[:,:,3]>85;labels,n=nd.label(solid);sizes=np.bincount(labels.ravel());sizes[0]=0
    if n==0:raise RuntimeError(f'Empty {faction} {kind} {row} {col}')
    main=int(sizes.argmax());body=labels==main;near=nd.distance_transform_edt(~body)<9
    keep=body.copy()
    for ident in range(1,n+1):
     if ident==main or sizes[ident]<5:continue
     component=labels==ident
     if np.any(component&near):keep|=component
    keep=nd.binary_dilation(keep,iterations=1)&(tile[:,:,3]>8);tile[:,:,3][~keep]=0
    yy,xx=np.where(keep);tile=tile[yy.min():yy.max()+1,xx.min():xx.max()+1];objects.append(Image.fromarray(tile))
  cw,ch,ground=192,224,184;sheet=Image.new('RGBA',(cols*cw,rows*ch));rects=[]
  # Share scale down each era column; lifecycle stages share the same scale within each era row.
  for i,im in enumerate(objects):
   row,col=divmod(i,cols);family=[objects[r*cols+col] for r in range(rows)] if kind=='facades' else objects[row*cols:(row+1)*cols]
   factor=min(1,176/max(o.width for o in family),176/max(o.height for o in family));nw,nh=max(1,round(im.width*factor)),max(1,round(im.height*factor));small=im.resize((nw,nh),Image.Resampling.LANCZOS)
   x=col*cw+(cw-nw)//2;y=row*ch+round(ground+nw*.16)-nh;sheet.alpha_composite(small,(x,y));rects.append(dict(x=col*cw,y=row*ch,w=cw,h=ch,cx=col*cw+cw/2,ground=row*ch+ground))
  name=f'{faction}-{stem}-packed-v2';sheet.save(out/(name+'.avif'),quality=83,speed=6);sheet.save(out/(name+'.webp'),quality=86,method=5)
  manifest[faction][kind]={'file':name+'.avif','fallback':name+'.webp','columns':cols,'rows':rows,'frames':rects}
  stats.append({'faction':faction,'kind':kind,'frames':len(rects),'avifBytes':(out/(name+'.avif')).stat().st_size})
  if faction=='steppe' and kind=='facades':sheet.save(out/'steppe-preview.png')
(root/'src/rts/building-atlases.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');(root/'docs/building-atlas-report.json').write_text(json.dumps(stats,indent=2));print('Packed',sum(x['frames'] for x in stats),'building states;',round(sum(x['avifBytes'] for x in stats)/1024),'KiB AVIF')
