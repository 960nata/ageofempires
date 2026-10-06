import {assetUrl} from './assets';
import type {SceneSprite} from './scene-art';
export const CONSTRUCTION_FRAME_COUNT=16;
interface CachedFrames {frames:(HTMLCanvasElement|undefined)[];}
type Cell={x:number;y:number;w:number;h:number};
export class ConstructionFrames {
 private cache=new Map<string,CachedFrames>();private atlas=new Image();private cells:Cell[][]=[];readonly ready:Promise<void>;
 constructor(){this.ready=new Promise((resolve,reject)=>{this.atlas.onload=()=>{try{const c=document.createElement('canvas');c.width=this.atlas.width;c.height=this.atlas.height;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(this.atlas,0,0);const alpha=ctx.getImageData(0,0,c.width,c.height).data,cw=c.width/4,ch=c.height/4;for(let row=0;row<4;row++){this.cells[row]=[];for(let col=0;col<4;col++){const x0=Math.round(col*cw),y0=Math.round(row*ch),x1=Math.round((col+1)*cw),y1=Math.round((row+1)*ch);let l=x1,t=y1,r=x0,b=y0;for(let y=y0+2;y<y1-2;y++)for(let x=x0+2;x<x1-2;x++)if(alpha[(y*c.width+x)*4+3]>200){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}this.cells[row][col]=r>l&&b>t?{x:l,y:t,w:r-l+1,h:b-t+1}:{x:x0,y:y0,w:x1-x0,h:y1-y0};}}resolve();}catch(e){reject(e);}};this.atlas.onerror=()=>reject(Error('Construction stage atlas failed to load'));this.atlas.src=assetUrl('construction-stages-v1.png');});}
 private family(def:string){if(['keep','tower','archer-tower','cannon-tower','wall','gate','palisade'].includes(def))return 3;if(['town','landmark','academy','government','healing','specialist'].includes(def))return 2;if(['barracks','range','stable','camel','siege','lumber','mine','smithy','mill','market'].includes(def))return 1;return 0;}
 frame(sprite:SceneSprite,era:number,index:number,overlay=false,def='house'){
  const phase=Math.max(0,Math.min(15,index)),family=this.family(def),stage=Math.min(3,Math.floor(phase/4)),key=`${sprite.sw}:${sprite.sh}:${family}:${stage}:${overlay}`;let entry=this.cache.get(key);if(!entry){entry={frames:Array(1)};this.cache.set(key,entry);if(this.cache.size>32)this.cache.delete(this.cache.keys().next().value!);}else{this.cache.delete(key);this.cache.set(key,entry);}
  return entry.frames[0]??(entry.frames[0]=this.makeFrame(sprite,family,stage));
 }
 private makeFrame(sprite:SceneSprite,family:number,stage:number){
  const out=document.createElement('canvas');out.width=Math.max(1,Math.round(sprite.sw));out.height=Math.max(1,Math.round(sprite.sh));const c=out.getContext('2d')!,cell=this.cells[family]?.[stage];if(!cell)return out;
  const iw=this.atlas.width,scale=Math.min((out.width*.96)/cell.w,(out.height*.91)/cell.h),w=cell.w*scale,h=cell.h*scale;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(this.atlas,cell.x,cell.y,cell.w,cell.h,(out.width-w)/2,out.height-h,w,h);
  return out;
 }
}
