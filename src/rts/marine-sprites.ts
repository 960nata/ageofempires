import type {SceneSprite} from './scene-art';
import type {Faction} from './data';
import {navalEra} from './naval-data';
import atlasData from './naval-atlases.json';

type Atlas={file:string;fallback:string;cell:number[];columns:number;frames:number;anchor?:number;poses?:number;fps?:number};
const atlases=atlasData as Record<string,Atlas>;
export type CrewAction='idle'|'row'|'fish'|'hunt'|'attack';
export const boatWidth=(def:string,era:number)=>(def==='war-ship'?8.6:def==='transport-ship'?8:def==='whaling-boat'?7.6:def==='scout-ship'?4.7:5.8)*(1+navalEra(era)*.055);
/** Hull art and people have separate frames; stationary ships never play the rowing loop. */
export class MarineSprites {
 private images=new Map<string,HTMLImageElement>();
 private pending=new Map<string,Promise<void>>();
 readonly ready:Promise<void>;
 constructor(){this.ready=Promise.all([this.load('crew-row'),this.load('crew-fish'),this.load('prey'),this.load('whaling-v1'),this.load('fishing-v1')]).then(()=>{});}
 private load(key:string):Promise<void>{
  const existing=this.pending.get(key);if(existing)return existing;
  const meta=atlases[key],image=new Image();this.images.set(key,image);
  const shared=key==='prey'||key==='whaling-v1'||key==='fishing-v1';
  const promise=new Promise<void>((resolve,reject)=>{let fallback=false;image.onload=()=>resolve();image.onerror=()=>{if(meta&&!fallback){fallback=true;image.src=import.meta.env.BASE_URL+'assets/isometric/'+(shared?meta.fallback:'naval-v2/'+meta.fallback);}else reject(Error('Naval asset unavailable: '+key));};image.src=import.meta.env.BASE_URL+'assets/isometric/'+(shared?meta.file:'naval-v2/'+meta.file);});
  this.pending.set(key,promise);return promise;
 }
 async preloadFactions(factions:readonly string[]){
  const wanted=new Set([...factions.flatMap(f=>['fishing','war','harbor'].map(k=>f+'-'+k)),'transport-v1','whaling-v1','fishing-v1']);
  // Only the civilizations in this match remain decoded (plus the shared crew frames).
  for(const key of this.images.keys())if(!key.startsWith('crew-')&&key!=='prey'&&!wanted.has(key)){this.images.delete(key);this.pending.delete(key);}
  await Promise.all([...wanted].map(k=>this.load(k)));
 }
 private frame(key:string,index:number,width:number):SceneSprite|null{
  const image=this.images.get(key),m=atlases[key];if(!m||!image?.naturalWidth)return null;
  const [w,h]=m.cell;index=Math.max(0,Math.min(m.frames-1,index));return{image,sx:index%m.columns*w,sy:Math.floor(index/m.columns)*h,sw:w,sh:h,width,height:width*h/w,anchor:m.anchor??.9,anchorX:.5};
 }
 boat(def:string,direction:number,_phase:number,width:number,faction:Faction='roman',era=0):SceneSprite|null{
  const d=((Math.round(direction)+6)%8+8)%8;
  const atlas=def==='transport-ship'?'transport-v1':def==='whaling-boat'?'whaling-v1':def==='scout-ship'?'fishing-v1':faction+'-'+(def==='war-ship'?'war':'fishing');
  const frame=def==='whaling-boat'||def==='scout-ship'?Math.max(0,Math.min(5,Math.floor(_phase)))*8+d:navalEra(era)*8+d;
  const sprite=this.frame(atlas,frame,width);
  // Rear-quarter source views face left: reflect the three starboard headings.
  if(sprite&&d>=5)sprite.flip=true;
  return sprite;
 }
 harbor(width:number,facing=0,faction:Faction='roman',era=0):SceneSprite|null{return this.frame(faction+'-harbor',navalEra(era)*4+((Math.round(facing)%4)+4)%4,width);}
 crew(direction:number,time:number,action:CrewAction,width:number,workPhase=0):SceneSprite|null{
  const working=action==='fish'||action==='hunt',key=working?'crew-fish':'crew-row',m=atlases[key];
  const phase=working?workPhase/3.6*(m.poses??24):action==='row'?time*(m.fps??10):0;
  const index=((Math.floor(phase)%(m.poses??12))+(m.poses??12))%(m.poses??12);
  return this.frame(key,index*8+((Math.round(direction)+6)%8+8)%8,width);
 }
 drawCrew(c:CanvasRenderingContext2D,p:{x:number;y:number},hull:SceneSprite,def:string,direction:number,time:number,action:CrewAction,workPhase=0,passengers:SceneSprite[]=[],combatant?:SceneSprite|null,factionAccent?:string){
  // The whaler atlas includes complete, matching crew poses for each action.
  if(def==='whaling-boat'||def==='scout-ship')return;
  const count=def==='scout-ship'?1:def==='fishing-boat'?2:4,angle=direction*Math.PI/4;
  const dx=Math.cos(angle),dy=Math.sin(angle)*.43,deck=p.y-hull.height*.12;
  if(def==='transport-ship'&&factionAccent){const w=Math.max(3,hull.width*.075),x=p.x,y=p.y-hull.height*.82;c.save();c.fillStyle=factionAccent;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y+w*.25);c.lineTo(x,y+w*.55);c.closePath();c.fill();c.restore();}
  const entries:{x:number;y:number;s:SceneSprite}[]=[];
  for(let i=0;i<count;i++){
   const along=(i-(count-1)/2)*hull.width*(count>2?.095:.19);
   const working=(action==='fish'||action==='hunt')&&i===0;
   const job=working?action:action==='row'?'row':'idle';
   const s=this.crew(job==='row'?(direction+4)%8:direction,time+i*.12,job,hull.width*(def==='scout-ship'?.27:.23),workPhase);
   if(s)entries.push({x:p.x+dx*along,y:deck+dy*along,s});
  }
  passengers.slice(0,4).forEach((s,i)=>entries.push({x:p.x+dx*(i-1.5)*hull.width*.085-dy*hull.width*.09,y:deck+dy*(i-1.5)*hull.width*.085-hull.height*.025,s}));
  if(combatant)entries.push({x:p.x+dx*hull.width*.21,y:deck+dy*hull.width*.21,s:combatant});
  entries.sort((a,b)=>a.y-b.y);
  for(const e of entries){c.save();c.translate(e.x,e.y);if(e.s.flip)c.scale(-1,1);c.drawImage(e.s.image,e.s.sx,e.s.sy,e.s.sw,e.s.sh,-e.s.width*(e.s.anchorX??.5),-e.s.height*e.s.anchor,e.s.width,e.s.height);c.restore();}
 }
 prey(kind:'fish'|'tuna'|'whale',phase:number,width:number):SceneSprite|null{
  const image=this.images.get('prey');if(!image?.naturalWidth)return null;
  return{image,sx:Math.floor(phase)%4*128,sy:(kind==='fish'?0:kind==='tuna'?1:2)*96,sw:128,sh:96,width,height:width*.75,anchor:.72,anchorX:.5};
 }
}
