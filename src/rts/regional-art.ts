import {poses,timedPose,poseRect} from './pose-sampling';
import {setSpriteSource} from './assets';
import {isolatedAtlas} from './isolated-sprites';
import {ATTACK_WINDUP} from './combat-timing';
import {eraGait} from './era-gait';
import type {SceneSprite} from './scene-art';
type Rect={x:number;y:number;w:number;h:number;cx?:number;ground?:number};
const regions:Record<string,string>={english:'english',french:'french',ayyubid:'saracen',steppe:'mongol',chinese:'chinese',japanese:'japanese',khmer:'khmer'};
export const signatures:Record<string,string>={english:'longbow',french:'knight',ayyubid:'camel-spear',steppe:'horse-archer',chinese:'repeating-crossbow',japanese:'samurai',khmer:'war-elephant'};
const SARACEN_FOOT=new Set(['militia','swordsman','heavy','spearman','pike','shield-spear','archer','dagger-fighter']);
/** Optional atlases load only for factions present in the current match. */
export class RegionalArt {
 prefers(faction:string,def:string){return signatures[faction]===def&&!(faction==='khmer'&&def==='war-elephant')||faction==='ayyubid'&&(SARACEN_FOOT.has(def)||['light-horse','faris','horse-archer'].includes(def));}
 private sheets=new Map<string,{image:HTMLImageElement;rects:Rect[];cols:number;rows:number}>();
 private pending=new Set<string>();
 private nominal=new Map<string,number>();
 private load(name:string,cols:number,rows:number){
  if(this.pending.has(name))return;this.pending.add(name);const image=new Image();
  image.onerror=()=>{this.pending.delete(name);};
  image.onload=()=>{const packed=isolatedAtlas(name);if(packed){this.sheets.set(name,{image,rects:packed.frames,cols,rows});return;}const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data,rects:Rect[]=[];
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x0=Math.floor(col*c.width/cols),x1=Math.floor((col+1)*c.width/cols),y0=Math.floor(row*c.height/rows),y1=Math.floor((row+1)*c.height/rows);let left=x1,top=y1,right=x0,bottom=y0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(a[(y*c.width+x)*4+3]>100){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}rects.push(right>left?{x:left,y:top,w:right-left+1,h:bottom-top+1}:{x:x0,y:y0,w:x1-x0,h:y1-y0});}
   this.sheets.set(name,{image,rects,cols,rows});};setSpriteSource(image,name+'.png');
 }
 private frame(name:string,cols:number,rows:number,index:number,width:number):SceneSprite|null{this.load(name,cols,rows);const sheet=this.sheets.get(name);if(!sheet)return null;const r=sheet.rects[index];return{image:sheet.image,sx:r.x,sy:r.y,sw:r.w,sh:r.h,width,height:width*r.h/r.w,anchor:r.ground===undefined?1:(r.ground-r.y)/r.h,anchorX:r.cx===undefined?.5:(r.cx-r.x)/r.w};}
 building(faction:string,index:number,facing:number,width:number,age:number){const region=regions[faction];if(!region||index<0||index>=12)return null;const s=this.frame(region+'-settlement-v1',4,3,index,width);if(s){s.anchor=1-width*.22/s.height;s.flip=facing%2===1;}return s;}
 fortification(faction:string,def:string,facing:number,open:number,width:number,age:number,tier:number):SceneSprite|null{
  const region=regions[faction]??({roman:'roman',persian:'persian',castilian:'castilian'} as Record<string,string>)[faction];if(!region||!['wall','palisade','gate'].includes(def))return null;
  const stage=def==='palisade'?0:Math.min(3,Math.max(0,Math.floor(age)));
  const position=1+Math.max(0,Math.min(1,open))*2,name=region+'-fortification-eras-v1',column=def==='gate'?Math.floor(position):0;
  const s=this.frame(name,4,4,stage*4+column,width);if(!s)return null;
  if(def==='gate'){
   // Use the closed building's scale and common ground registration across its motion samples.
   const sheet=this.sheets.get(name)!,base=sheet.rects[stage*4+1],next=Math.min(3,column+1),pixel=width/base.w;
   return poses.sample(sheet.image,poseRect(sheet.rects[stage*4+column]),poseRect(sheet.rects[stage*4+next]),position-column,pixel,facing%2===1,true);
  }else{const minimumHeight=width*(stage===0?1.05:1.2+stage*.05),factor=Math.max(1,minimumHeight/s.height);s.width*=factor;s.height*=factor;}
  s.flip=facing%2===1;return s;
 }
 gate(facing:number,open:number,width:number):SceneSprite|null{const row=((facing%4)+4)%4,col=Math.round(Math.max(0,Math.min(1,open))*4),name='gate-motion-v1';this.load(name,5,4);const sheet=this.sheets.get(name);if(!sheet)return null;
  const r=sheet.rects[row*5+col],base=sheet.rects[row*5],pixel=width/base.w;
  return{image:sheet.image,sx:r.x,sy:r.y,sw:r.w,sh:r.h,width:r.w*pixel,height:r.h*pixel,anchor:r.ground===undefined?1-width*.15/(r.h*pixel):(r.ground-r.y)/r.h,anchorX:r.cx===undefined?.5:(r.cx-r.x)/r.w};
 }
 private animated(name:string,cols:number,rows:number,row:number,sample:{from:number;to:number;mix:number},height:number,scale:number,flip=false){
  this.load(name,cols,rows);const sheet=this.sheets.get(name);if(!sheet)return null;const rect=(col:number)=>poseRect(sheet.rects[row*cols+col]);
  // Scale by the painted figure, not the cell: the French knight filled more of its cell and stood ~15% taller than other cavalry.
  let nominal=this.nominal.get(name);if(nominal===undefined){const standing=Array.from({length:rows},(_,r)=>sheet.rects[r*cols].h).sort((a,b)=>a-b);nominal=standing[Math.floor(standing.length/2)];this.nominal.set(name,nominal);}
  return poses.sample(sheet.image,rect(sample.from),rect(sample.to),sample.mix,height*scale/nominal,flip,true);
 }
 private saracenTroop(def:string,direction:number,moving:boolean,phase:number,attackAge:number,scale:number,speed:number,era:number):SceneSprite|null{
  const horses:Record<string,string>={'light-horse':'sword',faris:'shield','horse-archer':'archer'},infantry:Record<string,number>={militia:0,swordsman:1,heavy:1,spearman:2,pike:2,'shield-spear':3,archer:4,'dagger-fighter':5};
  const horse=horses[def],row=horse?direction:infantry[def];if(row===undefined)return null;const cols=horse?8:10,rows=horse?8:6,name=horse?'saracen-horse-'+horse+'-v1':'saracen-infantry-v1',base=!horse&&direction>=5&&direction<=7?5:0;
  let sample=moving?eraGait(phase,era,!!horse,!!horse&&speed>3.2,base,def):{from:base,to:base,mix:0};
  if(attackAge>=0&&attackAge<1.05)sample=timedPose(attackAge,[[0,base],[ATTACK_WINDUP-.08,base],[ATTACK_WINDUP,horse?7:base+4],[.66,horse?7:base+4],[1.05,base]]);
  return this.animated(name,cols,rows,row,sample,horse?4.1:2.8,scale,!horse&&(direction===0||direction===1||direction===7));
 }
 troop(faction:string,def:string,direction:number,moving:boolean,phase:number,attackAge:number,scale:number,speed=0,era=2){
  if(faction==='ayyubid'){const sprite=this.saracenTroop(def,direction,moving,phase,attackAge,scale,speed,era);if(sprite)return sprite;}if(signatures[faction]!==def)return null;
  const region=regions[faction],name=region+'-signature-v1';let sample=moving?eraGait(phase,era,def==='war-elephant'||def==='horse-archer'||def==='knight',false,0,def):{from:0,to:0,mix:0};
  if(attackAge>=0&&attackAge<1.05)sample=timedPose(attackAge,[[0,0],[.32,4],[ATTACK_WINDUP-.06,4],[ATTACK_WINDUP,5],[.66,5],[1.05,0]]);
  return this.animated(name,6,8,direction,sample,['english','chinese','japanese'].includes(faction)?2.8:faction==='khmer'?5.6:4.1,scale);
 }
}
