import {assetUrl} from './assets';
import type {SceneSprite} from './scene-art';
type Rect={x:number;y:number;w:number;h:number};
export class TreeFallSprites{
 private images=[new Image(),new Image()];private rects:Rect[][]=[];readonly ready:Promise<void>;
 constructor(){this.ready=Promise.all([this.load(this.images[0],assetUrl('tree-fall-v1.png'),2,0),this.load(this.images[1],assetUrl('palm-fall-v1.png'),1,2)]).then(()=>{});}
 private load(image:HTMLImageElement,url:string,rows:number,rowOffset:number){return new Promise<void>((resolve,reject)=>{image.onload=()=>{try{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(image,0,0);const a=x.getImageData(0,0,c.width,c.height).data,w=c.width/6,h=c.height/rows;for(let row=0;row<rows;row++){this.rects[row+rowOffset]=[];for(let col=0;col<6;col++){const x0=Math.floor(col*w),y0=Math.floor(row*h),x1=Math.floor((col+1)*w),y1=Math.floor((row+1)*h);let l=x1,t=y1,r=x0,b=y0;for(let py=y0+2;py<y1-2;py++)for(let px=x0+2;px<x1-2;px++)if(a[(py*c.width+px)*4+3]>200){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}this.rects[row+rowOffset][col]=r>l&&b>t?{x:l,y:t,w:r-l+1,h:b-t+1}:{x:x0,y:y0,w:w,h:h};}}resolve();}catch(e){reject(e);}};image.onerror=()=>reject(Error('Tree-fall atlas failed to load: '+url));image.src=url;});}
 sprite(family:number,progress:number,scale:number):SceneSprite|null{const image=this.images[family===2?1:0];if(!image.naturalWidth)return null;const row=Math.min(2,Math.max(0,family)),frame=Math.min(5,Math.max(0,Math.floor(progress*6))),r=this.rects[row]?.[frame];if(!r)return null;const width=(row===2?8.8:8.4)*scale;return{image,sx:r.x,sy:r.y,sw:r.w,sh:r.h,width,height:width*r.h/r.w,anchor:.94};}
 rootFraction(progress:number){return [.50,.50,.49,.46,.33,.17][Math.min(5,Math.floor(progress*6))];}
}
