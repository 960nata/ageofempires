import {atlasGutters} from './atlas-gutters';
import {poses,timedPose,poseRect,prepareMotionFrames} from './pose-sampling';
import {setSpriteSource,assetUrl} from './assets';
import {isolatedAtlas} from './isolated-sprites';
import {ATTACK_WINDUP} from './combat-timing';
import {eraGait} from './era-gait';
import frames from './faction-animation-frames.json';
import type {SceneSprite} from './scene-art';

// Explicit equipment matches: a shielded swordsman atlas must not replace a spear or unshielded unit.
const SPEAR={spearman:'spear','shield-spear':'spear',pike:'spear'};
const EARLY={militia:'infantry',javelin:'spear'};
const HORSE={scout:'cavalry','light-horse':'cavalry',lancer:'cavalry'};
export const FACTION_ANIMATION_UNITS:Record<string,Record<string,string>>={
 roman:{...EARLY,...HORSE,legionary:'infantry',centurion:'infantry',swordsman:'infantry',heavy:'infantry',archer:'archer',equites:'cavalry',...SPEAR},
 persian:{javelin:'spear',...HORSE,immortal:'infantry','shield-spear':'infantry',archer:'archer','royal-archer':'archer',cataphract:'cavalry',spearman:'spear',pike:'spear'},
 english:{...EARLY,...HORSE,swordsman:'infantry',heavy:'infantry',archer:'archer',longbow:'archer',knight:'cavalry',...SPEAR},
 french:{...EARLY,...HORSE,swordsman:'infantry',heavy:'infantry',archer:'archer',knight:'cavalry',...SPEAR},
 chinese:{...EARLY,...HORSE,archer:'archer',swordsman:'infantry',heavy:'infantry','repeating-crossbow':'archer',...SPEAR},
 // The Mongol cavalry sheet is a horse archer drawing a bow; lance and sword riders borrow the Chinese
 // lamellar cavalry rather than shooting arrows in melee.
 steppe:{...EARLY,scout:'chinese-cavalry','light-horse':'chinese-cavalry',lancer:'chinese-cavalry',swordsman:'infantry',heavy:'infantry',archer:'archer',crossbow:'archer',knight:'chinese-cavalry','horse-archer':'cavalry',...SPEAR},
 ayyubid:{...EARLY,...HORSE,swordsman:'infantry',heavy:'infantry',archer:'archer',...SPEAR},
 japanese:{...EARLY,...HORSE,samurai:'infantry',archer:'archer',...SPEAR},
 khmer:{...EARLY,swordsman:'infantry',heavy:'infantry',archer:'archer','war-elephant':'cavalry',...SPEAR},
 castilian:{...EARLY,...HORSE,swordsman:'infantry',heavy:'infantry',archer:'archer',knight:'cavalry',...SPEAR},
};
type Atlas=typeof frames[keyof typeof frames];
// A family is normally the faction's own sheet ('cavalry' → 'steppe-cavalry'); a full key borrows another faction's.
const sheetKey=(faction:string,family:string)=>family.includes('-')?family:faction+'-'+family;
// Some sheets reuse the strike cell as the hit cell; flinching into a sword swing reads as an attack, so those skip the hit pose.
const sameCell=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const HAS_HIT=new Set(Object.entries(frames).filter(([,data])=>!data.frames.every(row=>sameCell(row[9],row[8]))).map(([key])=>key));
const ERA_ATLASES:Record<string,Partial<Record<number,string>>>={
 'roman-cavalry':{0:'roman-cavalry-dark-v1',1:'roman-cavalry-feudal-v1',3:'roman-cavalry-imperial-v1'},
 'roman-infantry':{0:'roman-infantry-dark-v1',1:'roman-infantry-feudal-v1',3:'roman-infantry-imperial-v1'},
 'steppe-infantry':{0:'steppe-infantry-dark-v1',1:'steppe-infantry-feudal-v1',3:'steppe-infantry-imperial-v1'},
 'steppe-cavalry':{0:'steppe-cavalry-dark-v1',1:'steppe-cavalry-feudal-v1',3:'steppe-cavalry-imperial-v1'},
 'steppe-archer':{0:'steppe-archer-dark-v1',1:'steppe-archer-feudal-v1',3:'steppe-archer-imperial-v1'},
 'chinese-infantry':{0:'chinese-infantry-dark-v1'},
};
// Generated sheets rarely honour the requested row order (right, down-right, down, down-left,
// left, up-left, up, up-right): several show a back view where a side view belongs, or lack
// a left profile. Each entry is the visually confirmed [row, mirrored] per screen direction.
// Mirroring swaps equipment handedness but keeps the body facing its direction of travel.
// Era sheets reuse the base row layout, so one table serves every age. Unlisted sheets keep data.directions.
type Facing=readonly (readonly [number,0|1])[];
const FACING:Record<string,Facing>={
 'roman-infantry':[[7,0],[0,0],[2,0],[0,1],[7,1],[4,0],[5,0],[4,1]],
 'roman-archer':[[0,0],[1,0],[2,0],[1,1],[0,1],[4,0],[5,0],[4,1]],
 'roman-spear':[[0,0],[1,0],[2,0],[3,0],[0,1],[4,0],[6,0],[7,0]],
 'steppe-infantry':[[3,1],[1,0],[2,0],[0,0],[3,0],[4,0],[5,0],[6,0]],
 'steppe-archer':[[3,1],[1,0],[2,0],[0,0],[3,0],[4,0],[5,0],[4,1]],
 'chinese-infantry':[[3,1],[0,1],[2,0],[0,0],[3,0],[4,0],[5,0],[7,0]],
 'persian-infantry':[[3,1],[0,1],[2,0],[0,0],[3,0],[4,0],[5,0],[4,1]],
 'english-infantry':[[0,0],[1,0],[2,0],[1,1],[3,0],[4,0],[5,0],[6,0]],
 'french-infantry':[[0,0],[1,0],[2,0],[1,1],[3,0],[4,0],[6,0],[7,0]],
 'khmer-infantry':[[0,0],[1,0],[2,0],[1,1],[3,0],[4,0],[5,0],[7,0]],
 'khmer-spear':[[0,0],[1,0],[2,0],[3,0],[0,1],[4,0],[5,0],[7,0]],
 'khmer-archer':[[0,0],[7,0],[1,0],[7,1],[0,1],[3,0],[2,0],[3,1]],
 'castilian-infantry':[[0,0],[1,0],[2,0],[1,1],[0,1],[4,0],[5,0],[7,0]],
 'castilian-archer':[[0,0],[1,0],[2,0],[3,0],[0,1],[4,0],[5,0],[7,0]],
 'chinese-cavalry':[[0,0],[1,0],[2,0],[3,0],[4,0],[7,1],[5,0],[7,0]],
 'persian-cavalry':[[0,0],[1,0],[2,0],[3,0],[4,0],[7,1],[5,0],[7,0]],
 'english-cavalry':[[0,0],[1,0],[2,0],[3,0],[4,0],[6,1],[5,0],[6,0]],
 'japanese-cavalry':[[0,0],[1,0],[2,0],[3,0],[0,1],[5,0],[6,0],[7,0]],
 'khmer-cavalry':[[0,0],[1,0],[2,0],[3,0],[4,0],[6,1],[5,0],[6,0]],
 'ayyubid-cavalry':[[2,1],[1,0],[0,0],[6,0],[2,0],[4,1],[3,0],[4,0]],
 'castilian-cavalry':[[0,0],[1,0],[2,0],[3,0],[0,1],[4,0],[5,0],[7,0]],
};
export class FactionAnimations {
 private images=new Map<string,HTMLImageElement>();
 private alpha=new Map<HTMLImageElement,Uint8Array>();
 private pending=new Map<string,Promise<void>>();
 private eraImages=new Map<string,{image:HTMLImageElement;rects:ReturnType<typeof poseRect>[][];ratio:number}>();
 private eraPending=new Set<string>();
 private eraFailed=new Set<string>();
 hasEra(faction:string,unit:string,era:number){const family=FACTION_ANIMATION_UNITS[faction]?.[unit];return !!family&&!!ERA_ATLASES[sheetKey(faction,family)]?.[era];}
 has(faction:string,unit:string){return !!FACTION_ANIMATION_UNITS[faction]?.[unit];}
 private load(key:string,data:Atlas){const pending=this.pending.get(key);if(pending)return pending;const promise=new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d')!;c.drawImage(image,0,0);const rgba=c.getImageData(0,0,image.width,image.height).data,a=new Uint8Array(image.width*image.height);for(let i=0;i<a.length;i++)a[i]=rgba[i*4+3];this.alpha.set(image,a);this.images.set(key,image);resolve();};image.onerror=()=>{this.pending.delete(key);reject(Error('Unit atlas unavailable: '+key));};setSpriteSource(image,data.file);});this.pending.set(key,promise);return promise;}
 private loadEra(file:string,data:Atlas){if(this.eraImages.has(file)||this.eraPending.has(file)||this.eraFailed.has(file))return;this.eraPending.add(file);const image=new Image();let fallback=false;image.onerror=()=>{if(!fallback){fallback=true;image.src=assetUrl(file+'.webp');return;}this.eraPending.delete(file);this.eraFailed.add(file);};image.onload=()=>{
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,image.width,image.height).data,a=new Uint8Array(image.width*image.height),rects:ReturnType<typeof poseRect>[][]=[];
  for(let i=0;i<a.length;i++)a[i]=rgba[i*4+3];this.alpha.set(image,a);
  const rows=data.frames.length,cols=data.frames[0].length;
  const cells=atlasGutters(a,image.width,image.height,rows,cols);if(!cells){this.eraPending.delete(file);this.eraFailed.add(file);console.warn('Era atlas has overlapping cells:',file);return;}
  for(let row=0;row<rows;row++){const result:ReturnType<typeof poseRect>[]=[];for(let col=0;col<cols;col++){
   const {x0,x1,y0,y1}=cells[row][col];let left=x1,top=y1,right=x0,bottom=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(a[y*image.width+x]>70){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<left||bottom<top){this.eraPending.delete(file);this.eraFailed.add(file);return;}
   const old=data.frames[row][col];
   const cx=left+(old.cx-old.x)/old.w*(right-left+1),ground=top+(old.ground-old.y)/old.h*(bottom-top+1);
   result.push({x:left,y:top,w:right-left+1,h:bottom-top+1,cx:Math.max(left,Math.min(right,cx)),ground:Math.max(top,Math.min(bottom+1,ground))});
  }rects.push(result);}
  const standing=rects.flatMap(row=>row.slice(0,7)),nominal=standing.reduce((total,r)=>total+r.h,0)/standing.length;this.eraImages.set(file,{image,rects,ratio:nominal/data.nominal});this.eraPending.delete(file);
 };setSpriteSource(image,file+'.png');}
 preload(factions:string[]){if(factions.some(f=>Object.values(FACTION_ANIMATION_UNITS[f]??{}).some(family=>family.endsWith('cavalry'))))void prepareMotionFrames();return Promise.all([...new Set(factions)].flatMap(f=>[...new Set(Object.values(FACTION_ANIMATION_UNITS[f]??{}))].map(family=>{const key=sheetKey(f,family),data=frames[key as keyof typeof frames];return data?this.load(key,data):Promise.resolve();})));}
 opaque(image:HTMLImageElement,x:number,y:number){const a=this.alpha.get(image);return a?a[y*image.width+x]>70:undefined;}
 sprite(faction:string,unit:string,direction:number,phase:number,speed:number,attackAge:number,hitAge:number,deathAge:number,scale:number,era=2):SceneSprite|null{
  const family=FACTION_ANIMATION_UNITS[faction]?.[unit];if(!family)return null;
  const key=sheetKey(faction,family),data=frames[key as keyof typeof frames];if(!data)return null;void this.load(key,data).catch(()=>{});
  const eraFile=ERA_ATLASES[key]?.[era];if(eraFile)this.loadEra(eraFile,data);
  const eraArt=eraFile?this.eraImages.get(eraFile):undefined,image=eraArt?.image??this.images.get(key);if(!image)return null;
  const moving=speed>.16,run=speed>3.2&&family.endsWith('cavalry')&&unit!=='war-elephant';
  let sample={from:0,to:0,mix:0};
  if(deathAge>=0)sample=timedPose(deathAge,[[0,10],[.48,11]]);
  else if(attackAge>=0&&attackAge<1.05)sample=timedPose(attackAge,[[0,0],[.34,7],[ATTACK_WINDUP-.06,7],[ATTACK_WINDUP,8],[.66,8],[1.05,0]]);
  else if(hitAge>=0&&hitAge<.22&&!moving&&HAS_HIT.has(key))sample=timedPose(hitAge,[[0,9],[.07,9],[.22,0]]);
  else if(moving)sample=eraGait(phase,era,family.endsWith('cavalry'),run,0,unit);
  const heading=(direction+8)%8,[row,mirror]=FACING[key]?.[heading]??[data.directions[heading],0],packed=isolatedAtlas(data.file),rect=(column:number)=>eraArt?.rects[row][column]??poseRect(packed?.frames[row*packed.cols+column]??data.frames[row][column]);
  return {...poses.sample(image,rect(sample.from),rect(sample.to),sample.mix,data.size*scale/(data.nominal*(eraArt?.ratio??1)),!!mirror,true),eraSpecific:!!eraArt};
 }
}
