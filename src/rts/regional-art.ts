import {assetUrl} from './assets';
import type {SceneSprite} from './scene-art';
type Rect={x:number;y:number;w:number;h:number};
const regions:Record<string,string>={english:'english',french:'french',ayyubid:'saracen',steppe:'mongol'};
const signatures:Record<string,string>={english:'longbow',french:'knight',ayyubid:'camel-spear',steppe:'horse-archer'};
/** Optional atlases load only for factions present in the current match. */
export class RegionalArt {
 private sheets=new Map<string,{image:HTMLImageElement;rects:Rect[];cols:number;rows:number}>();
 private pending=new Set<string>();
 private load(name:string,cols:number,rows:number){
  if(this.pending.has(name))return;this.pending.add(name);const image=new Image();
  image.onload=()=>{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data,rects:Rect[]=[];
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x0=Math.floor(col*c.width/cols),x1=Math.floor((col+1)*c.width/cols),y0=Math.floor(row*c.height/rows),y1=Math.floor((row+1)*c.height/rows);let left=x1,top=y1,right=x0,bottom=y0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(a[(y*c.width+x)*4+3]>100){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}rects.push(right>left?{x:left,y:top,w:right-left+1,h:bottom-top+1}:{x:x0,y:y0,w:x1-x0,h:y1-y0});}
   this.sheets.set(name,{image,rects,cols,rows});};image.src=assetUrl(name+'.png');
 }
 private frame(name:string,cols:number,rows:number,index:number,width:number):SceneSprite|null{this.load(name,cols,rows);const sheet=this.sheets.get(name);if(!sheet)return null;const r=sheet.rects[index];return{image:sheet.image,sx:r.x,sy:r.y,sw:r.w,sh:r.h,width,height:width*r.h/r.w,anchor:1};}
 building(faction:string,index:number,facing:number,width:number,age:number){const region=regions[faction];if(!region||index<0||index>=12||age!==2)return null;const s=this.frame(region+'-settlement-v1',4,3,index,width);if(s){s.anchor=1-width*.22/s.height;s.flip=facing%2===1;}return s;}
 gate(facing:number,open:number,width:number):SceneSprite|null{const row=((facing%4)+4)%4,col=Math.round(Math.max(0,Math.min(1,open))*4),name='gate-motion-v1';this.load(name,5,4);const sheet=this.sheets.get(name);if(!sheet)return null;
  // One common rectangle per facing keeps the gatehouse fixed while the grille moves.
  const cw=sheet.image.width/5,ch=sheet.image.height/4,rs=sheet.rects.slice(row*5,row*5+5);const left=Math.min(...rs.map((r,i)=>r.x-i*cw)),top=Math.min(...rs.map(r=>r.y-row*ch)),right=Math.max(...rs.map((r,i)=>r.x+r.w-i*cw)),bottom=Math.max(...rs.map(r=>r.y+r.h-row*ch));const sw=right-left,sh=bottom-top,height=width*sh/sw;
  return{image:sheet.image,sx:col*cw+left,sy:row*ch+top,sw,sh,width,height,anchor:1-width*.15/height};
 }
 troop(faction:string,def:string,direction:number,moving:boolean,phase:number,attackAge:number,scale:number){if(signatures[faction]!==def)return null;const region=regions[faction],col=attackAge>=0&&attackAge<.8?(attackAge<.3?4:5):moving?1+[0,1,2,1][Math.floor(phase*4)%4]:0,name=region+'-signature-v1',s=this.frame(name,6,8,direction*6+col,1);if(!s)return null;
  const sheet=this.sheets.get(name)!,ch=sheet.image.height/8,cw=sheet.image.width/6,pixel=(faction==='english'?2.8:4.1)*scale/(ch*.9);s.width=s.sw*pixel;s.height=s.sh*pixel;s.anchor=(direction*ch+ch*.97-s.sy)/s.sh;s.anchorX=((col+.5)*cw-s.sx)/s.sw;return s;
 }
}
