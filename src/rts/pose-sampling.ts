import {isolatedAtlas,type IsolatedRect} from './isolated-sprites';
import type {SceneSprite} from './scene-art';
export interface PoseRect {x:number;y:number;w:number;h:number;cx:number;ground:number;}
type MeasuredRect={x:number;y:number;w:number;h:number;cx?:number;ground?:number;anchorX?:number;anchorY?:number};
export const poseRect=(r:MeasuredRect):PoseRect=>({...r,cx:r.cx??r.x+(r.anchorX??.5)*r.w,ground:r.ground??r.y+(r.anchorY??1)*r.h});
const ease=(t:number)=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
/** Brief holds preserve readable silhouettes; transitions use the same ground pivot. */
export function cyclePose(position:number,sequence:readonly number[]){const p=((position%sequence.length)+sequence.length)%sequence.length,i=Math.floor(p);return{from:sequence[i],to:sequence[(i+1)%sequence.length],mix:ease((p-i-.25)/.75)};}
export function timedPose(age:number,keys:readonly (readonly [number,number])[]){if(age<=keys[0][0])return{from:keys[0][1],to:keys[0][1],mix:0};for(let i=1;i<keys.length;i++){const [end,to]=keys[i],[start,from]=keys[i-1];if(age<end)return{from,to,mix:ease((age-start)/(end-start))};}const last=keys[keys.length-1][1];return{from:last,to:last,mix:0};}
interface MotionAtlas {renderScale:number;file:string;fallback:string;frames:Record<string,IsolatedRect>;bytes:number;}
let motionData:Record<string,MotionAtlas>={};let motionLoading:Promise<void>|undefined;
export function prepareMotionFrames(){return motionLoading??=import('./motion-frames.json').then(({default:data})=>{motionData=data as Record<string,MotionAtlas>;});}

class MotionImages {
 private sheets=new Map<string,HTMLImageElement>();
 clear(){this.sheets.clear();}
 frame(source:HTMLImageElement,a:PoseRect,b:PoseRect,sample:number):{image:HTMLImageElement;rect:IsolatedRect}|undefined{
  const stem=source.src.split('?')[0].split('/').pop()?.replace(/\.(png|webp|avif)$/,'');if(!stem||!isolatedAtlas(stem))return;
  if(window.matchMedia('(pointer:coarse)').matches)return;if(!motionLoading)void prepareMotionFrames();const data=motionData[stem];if(!data)return;
  const direct=`${a.x},${a.y}:${b.x},${b.y}:${sample}`;const reverse=`${b.x},${b.y}:${a.x},${a.y}:${8-sample}`;
  const rect=data.frames[direct]??data.frames[reverse];if(!rect)return;
  let image=this.sheets.get(stem);if(!image){image=new Image();let failed=false;image.onerror=()=>{if(!failed){failed=true;image!.src=import.meta.env.BASE_URL+'assets/isometric/'+data.fallback;}};image.src=import.meta.env.BASE_URL+'assets/isometric/'+data.file;this.sheets.set(stem,image);}
  if(image.complete&&image.naturalWidth){this.sheets.delete(stem);this.sheets.set(stem,image);let bytes=0;for(const entry of this.sheets.values())bytes+=entry.naturalWidth*entry.naturalHeight*4;while(bytes>96*1024*1024&&this.sheets.size>1){const oldest=this.sheets.keys().next().value!;const evicted=this.sheets.get(oldest)!;this.sheets.delete(oldest);bytes-=evicted.naturalWidth*evicted.naturalHeight*4;}return{image,rect};}return undefined;
 }
}
const motionImages=new MotionImages();
interface CachedPose {image:HTMLCanvasElement;left:number;top:number;bytes:number;}
/** Shared across units; camera zoom is not part of the cache key. No extra source art is loaded. */
class PoseCache {
 private cache=new Map<string,CachedPose>();private identities=new WeakMap<HTMLImageElement,number>();private nextId=1;private bytes=0;
 private blends=new WeakSet<HTMLImageElement>();private alpha=new WeakMap<HTMLImageElement,Uint8Array>();
 clear(){this.cache.clear();this.bytes=0;this.alpha=new WeakMap();motionImages.clear();}
 opaque(image:HTMLImageElement,x:number,y:number){if(!this.blends.has(image))return undefined;let mask=this.alpha.get(image);if(!mask){const c=(image as unknown as HTMLCanvasElement).getContext('2d')!,rgba=c.getImageData(0,0,image.width,image.height).data;mask=new Uint8Array(image.width*image.height);for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4+3];this.alpha.set(image,mask);}return mask[Math.floor(y)*image.width+Math.floor(x)]>70;}
 sample(image:HTMLImageElement,a:PoseRect,b:PoseRect,mix:number,pixel:number,flip=false):SceneSprite{
  const frame=(r:PoseRect):SceneSprite=>({image,sx:r.x,sy:r.y,sw:r.w,sh:r.h,width:r.w*pixel,height:r.h*pixel,anchor:(r.ground-r.y)/r.h,anchorX:(r.cx-r.x)/r.w,flip});
  const sample=Math.round(Math.max(0,Math.min(1,mix))*8);if(sample===0||a.x===b.x&&a.y===b.y)return frame(a);if(sample===8)return frame(b);
  const inbetween=motionImages.frame(image,a,b,sample);if(inbetween){const {image:mid,rect:r}=inbetween;const stem=image.src.split('?')[0].split('/').pop()!.replace(/\.(png|webp|avif)$/,'');const density=motionData[stem]?.renderScale??1;return{image:mid,sx:r.x,sy:r.y,sw:r.w,sh:r.h,width:r.w*pixel/density,height:r.h*pixel/density,anchor:(r.ground-r.y)/r.h,anchorX:(r.cx-r.x)/r.w,flip};}
  let identity=this.identities.get(image);if(identity===undefined){identity=this.nextId++;this.identities.set(image,identity);}const key=[identity,a.x,a.y,a.w,a.h,a.cx,a.ground,b.x,b.y,b.w,b.h,b.cx,b.ground,sample].join(':');let cached=this.cache.get(key);
  if(cached){this.cache.delete(key);this.cache.set(key,cached);}else{
   const left=Math.floor(Math.min(a.x-a.cx,b.x-b.cx)),top=Math.floor(Math.min(a.y-a.ground,b.y-b.ground)),right=Math.ceil(Math.max(a.x+a.w-a.cx,b.x+b.w-b.cx)),bottom=Math.ceil(Math.max(a.y+a.h-a.ground,b.y+b.h-b.ground));
   const canvas=document.createElement('canvas');canvas.width=right-left;canvas.height=bottom-top;const c=canvas.getContext('2d')!,t=sample/8;c.globalAlpha=1-t;c.drawImage(image,a.x,a.y,a.w,a.h,a.x-a.cx-left,a.y-a.ground-top,a.w,a.h);c.globalCompositeOperation='lighter';c.globalAlpha=t;c.drawImage(image,b.x,b.y,b.w,b.h,b.x-b.cx-left,b.y-b.ground-top,b.w,b.h);
   Object.defineProperty(canvas,'naturalWidth',{value:canvas.width});Object.defineProperty(canvas,'complete',{value:true});this.blends.add(canvas as unknown as HTMLImageElement);cached={image:canvas,left,top,bytes:canvas.width*canvas.height*5};this.cache.set(key,cached);this.bytes+=cached.bytes;
   while(this.cache.size>384||this.bytes>12*1024*1024){const oldest=this.cache.keys().next().value!;this.bytes-=this.cache.get(oldest)!.bytes;this.cache.delete(oldest);}
  }
  return{image:cached.image as unknown as HTMLImageElement,sx:0,sy:0,sw:cached.image.width,sh:cached.image.height,width:cached.image.width*pixel,height:cached.image.height*pixel,anchor:-cached.top/cached.image.height,anchorX:-cached.left/cached.image.width,flip};
 }
}
export const poses=new PoseCache();
