"""Fill missing AVIF equivalents without changing sprite dimensions or frame rectangles."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'public/assets/isometric'
sources=sorted(p for p in ASSETS.rglob('*.webp') if not p.with_suffix('.avif').exists())
def convert(src):
 target=src.with_suffix('.avif')
 with Image.open(src) as source:
  source.convert('RGBA').save(target,format='AVIF',quality=85,speed=8,subsampling='4:4:4',max_threads=1)
  with Image.open(target) as encoded:
   assert encoded.size==source.size,(src,'frame geometry changed')
 return src.stat().st_size,target.stat().st_size
before=after=0
with ThreadPoolExecutor(max_workers=2) as pool:
 for i,(old,new) in enumerate(pool.map(convert,sources),1):
  before+=old;after+=new
  if i%30==0 or i==len(sources):print(f'AVIF {i}/{len(sources)}',flush=True)
manifest=ROOT/'src/rts/avif-assets.json'
names=sorted(set(json.loads(manifest.read_text()))|{str(p.relative_to(ASSETS).with_suffix('')) for p in ASSETS.rglob('*.avif')})
manifest.write_text(json.dumps(names,indent=1)+'\n')
print(f'Converted {len(sources)} atlases, {before/1e6:.1f} MB → {after/1e6:.1f} MB. Geometry preserved.',flush=True)
