"""Pack isolated naval hulls and offline crew animation. No runtime image warping.
Install: Python Pillow + numpy + opencv. Run from any working directory.
Sources are original generated art; alpha isolation removes disconnected neighbours.
"""
from pathlib import Path
import json,cv2,numpy as np
from scipy.signal import find_peaks
import sys
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art-src/isometric/naval-v2';OUT=ROOT/'public/assets/isometric/naval-v2';OUT.mkdir(parents=True,exist_ok=True)
manifest={};report={}
if '--hulls-only' in sys.argv:
 manifest=json.loads((ROOT/'src/rts/naval-atlases.json').read_text());report=json.loads((OUT/'packing-report.json').read_text())
def cuts(v,n):
 out=[0];L=len(v)
 for i in range(1,n):
  mid=L*i/n;lo=int(mid-L/n*.29);hi=int(mid+L/n*.29)
  score=v[lo:hi]+abs(np.arange(lo,hi)-mid)*.045
  out.append(lo+int(score.argmin()))
 return out+[L]
def pieces(path,rows,cols=4):
 a=np.array(Image.open(path).convert('RGBA'));alpha=a[:,:,3];xs=cuts((alpha>110).sum(0),cols);frames={};warnings=[]
 # Hull mass peaks locate actual rows; fixed grid slicing can cut through a large late-era hull.
 peaks=None
 if any(k in path.stem for k in ['fishing','war']):
  signal=cv2.GaussianBlur((alpha>100).sum(1).astype(float).reshape(-1,1),(1,15),4).ravel()
  peaks,_=find_peaks(signal,distance=len(signal)/(rows+3),prominence=signal.max()*.25)
  if len(peaks)!=rows:raise ValueError(f'{path.stem}: expected {rows} hull rows, found {len(peaks)}')
 for col in range(cols):
  x0,x1=xs[col:col+2];signal=(alpha[:,x0:x1]>110).sum(1);ys=cuts(signal,rows)
  if peaks is not None:
   ys=[0]
   for a0,b0 in zip(peaks[:-1],peaks[1:]):
    lo=int(a0+(b0-a0)*.12);hi=int(b0-(b0-a0)*.30);ys.append(lo+int(signal[lo:hi].argmin()))
   ys.append(len(signal))
  for row in range(rows):
   y0,y1=ys[row:row+2];crop=a[y0:y1,x0:x1].copy();mask=(crop[:,:,3]>100).astype('uint8');n,labels,stats,centers=cv2.connectedComponentsWithStats(mask,8)
   if n<2:raise ValueError(f'Empty frame {path} {row} {col}')
   main=1+int(stats[1:,4].argmax());sx,sy,sw,sh,area=stats[main];keep=(labels==main).astype('uint8')
   # Include detached ropes/flags within the object's bounds, not neighbouring hull fragments.
   for k in range(1,n):
    if k==main:continue
    x,y,w,h,size=stats[k]
    if size>12 and x>=sx-4 and x+w<=sx+sw+4 and y>=sy and y+h<=sy+sh:keep[labels==k]=1
   keep=cv2.dilate(keep,np.ones((3,3),np.uint8));crop[:,:,3]=np.where(keep,crop[:,:,3],0)
   # Feather source boundary alpha at narrow mast contacts; never include another hull.
   for edge in range(2):
    crop[edge,:,3]=(crop[edge,:,3].astype('uint16')*(edge+1)//3).astype('uint8');crop[-edge-1,:,3]=(crop[-edge-1,:,3].astype('uint16')*(edge+1)//3).astype('uint8')
   im=Image.fromarray(crop);box=im.getbbox()
   if box is None:raise ValueError('No visible pixels')
   frames[row*cols+col]=im.crop(box)
 return [frames[i] for i in range(rows*cols)]
def save(name,atlas,cell,frames,extra=None):
 atlas.save(OUT/(name+'.avif'),quality=72,speed=6)
 atlas.save(OUT/(name+'.webp'),quality=84,method=6)
 manifest[name]={'file':name+'.avif','fallback':name+'.webp','cell':list(cell),'columns':atlas.width//cell[0],'frames':frames,**(extra or {})}
 report[name]={'frames':frames,'bytes':(OUT/(name+'.avif')).stat().st_size,'decodedBytes':atlas.width*atlas.height*4}
def pack(name,rows,cell):
 path=SRC/(name+'-fixed.png');path=path if path.exists() else SRC/(name+'.png')
 source_rows=7 if name in ['persian-fishing','persian-war','roman-war','castilian-war'] else 9 if name=='castilian-fishing' else rows
 ps=pieces(path,source_rows)
 if source_rows==7:
  ps=ps[:24]+pieces(SRC/(name+'-imperial.png'),2)
 elif source_rows==9:
  ps=ps[:24]+ps[-8:]
 cw,ch=cell;atlas=Image.new('RGBA',(cw*4,ch*rows))
 # Common scale within each era prevents orientation changes resizing the hull.
 group=4 if 'harbor' in name else 8
 for start in range(0,len(ps),group):
  scale=min((cw-24)/max(p.width for p in ps[start:start+group]),(ch-24)/max(p.height for p in ps[start:start+group]))
  for i in range(start,min(len(ps),start+group)):
   p=ps[i];p=p.resize((max(1,round(p.width*scale)),max(1,round(p.height*scale))),Image.Resampling.LANCZOS)
   atlas.alpha_composite(p,(i%4*cw+(cw-p.width)//2,i//4*ch+ch-p.height-12))
 save(name,atlas,cell,len(ps),{'anchor':.90 if 'harbor' not in name else .84})
 return atlas
for faction in ['roman','persian','english','french','castilian','ayyubid','steppe','chinese','japanese','khmer']:
 for family in ['fishing','war','harbor']:
  pack(faction+'-'+family,4 if family=='harbor' else 8,(288,256) if family=='harbor' else (192,176))
 print('packed',faction,flush=True)
# A dedicated troop-carrier silhouette: cargo boats should not reuse the fisher hull.
transport=SRC/'troop-transport-v1.png'
if transport.exists():
 ps=pieces(transport,8)
 cell=(192,176);atlas=Image.new('RGBA',(cell[0]*4,cell[1]*8))
 for start in range(0,len(ps),8):
  scale=min((cell[0]-24)/max(p.width for p in ps[start:start+8]),(cell[1]-24)/max(p.height for p in ps[start:start+8]))
  for i in range(start,min(len(ps),start+8)):
   p=ps[i].resize((max(1,round(ps[i].width*scale)),max(1,round(ps[i].height*scale))),Image.Resampling.LANCZOS)
   atlas.alpha_composite(p,(i%4*cell[0]+(cell[0]-p.width)//2,i//4*cell[1]+cell[1]-p.height-12))
 save('transport-v1',atlas,cell,len(ps),{'anchor':.90,'sharedAcrossFactions':True})
 print('packed dedicated troop transport',flush=True)
if '--hulls-only' in sys.argv:
 manifest['prey']={'file':'marine-prey-v1.webp','fallback':'marine-prey-v1.webp','cell':[128,96],'columns':4,'frames':12,'anchor':.72}
 manifest['whaling-v1']={'file':'whaling-boat-frames-v1.webp','fallback':'whaling-boat-frames-v1.webp','cell':[256,192],'columns':4,'frames':48,'poses':6,'anchor':.90}
 manifest['fishing-v1']={'file':'fishing-boat-frames-v1.webp','fallback':'fishing-boat-frames-v1.webp','cell':[192,192],'columns':4,'frames':48,'poses':6,'anchor':.90}
 (ROOT/'src/rts/naval-atlases.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/'packing-report.json').write_text(json.dumps(report,indent=2)+'\n');sys.exit(0)
# Four key poses, eight directions, normalized foot pivots. All pose frames retain alpha padding.
ps=pieces(SRC/'crew.png',8);N=128;keys=[]
scale=min(106/max(p.width for p in ps),106/max(p.height for p in ps))
for p in ps:
 im=p.resize((max(1,round(p.width*scale)),max(1,round(p.height*scale))),Image.Resampling.LANCZOS);f=Image.new('RGBA',(N,N));f.alpha_composite(im,((N-im.width)//2,N-im.height-12));keys.append(np.array(f))
# Dense motion interpolation is baked once at authoring time, never recomputed per ship.
flow=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
y,x=np.mgrid[:N,:N].astype('float32')
def between(a,b,t):
 if t==0:return a
 if t==1:return b
 ga=cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2GRAY);gb=cv2.cvtColor(b[:,:,:3],cv2.COLOR_RGB2GRAY)
 fa=flow.calc(ga,gb,None);fb=flow.calc(gb,ga,None)
 aa=a.astype('float32')/255;bb=b.astype('float32')/255;aa[:,:,:3]*=aa[:,:,3:];bb[:,:,:3]*=bb[:,:,3:]
 wa=cv2.remap(aa,x-fa[:,:,0]*t,y-fa[:,:,1]*t,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT);wb=cv2.remap(bb,x-fb[:,:,0]*(1-t),y-fb[:,:,1]*(1-t),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 c=wa*(1-t)+wb*t;c[:,:,:3]/=np.maximum(c[:,:,3:],.001);c[:10,:,3]=0;c[-10:,:,3]=0;c[:,:10,3]=0;c[:,-10:,3]=0
 return np.clip(c*255,0,255).astype('uint8')
for action,sequence,steps in [('row',[0,1,0],6),('fish',[0,2,3,0],8)]:
 count=(len(sequence)-1)*steps;atlas=Image.new('RGBA',(N*8,N*count))
 for frame in range(count):
  segment=frame//steps;t=(frame%steps)/steps;t=t*t*(3-2*t)
  for direction in range(8):
   a=keys[sequence[segment]*8+direction];b=keys[sequence[segment+1]*8+direction]
   atlas.alpha_composite(Image.fromarray(between(a,b,t)),(direction*N,frame*N))
 save('crew-'+action,atlas,(N,N),count*8,{'poses':count,'anchor':.90,'fps':10 if action=='row' else count/3.6})
 print('crew',action,count,'frames per direction',flush=True)
# School fish, tuna and whale frames are packed separately by pack-marine-atlases.py.
manifest['prey']={'file':'marine-prey-v1.webp','fallback':'marine-prey-v1.webp','cell':[128,96],'columns':4,'frames':12,'anchor':.72}
manifest['whaling-v1']={'file':'whaling-boat-frames-v1.webp','fallback':'whaling-boat-frames-v1.webp','cell':[256,192],'columns':4,'frames':48,'poses':6,'anchor':.90}
manifest['fishing-v1']={'file':'fishing-boat-frames-v1.webp','fallback':'fishing-boat-frames-v1.webp','cell':[192,192],'columns':4,'frames':48,'poses':6,'anchor':.90}
(ROOT/'src/rts/naval-atlases.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'packing-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('Total AVIF bytes',sum(v['bytes'] for v in report.values()),flush=True)
