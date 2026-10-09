import {poses,cyclePose,timedPose,poseRect,prepareMotionFrames} from './pose-sampling';
import {setSpriteSource} from './assets';
import {isolatedAtlas} from './isolated-sprites';
import {ATTACK_WINDUP} from './combat-timing';
import frames from './faction-animation-frames.json';
import type {SceneSprite} from './scene-art';

// Explicit equipment matches: a shielded swordsman atlas must not replace a spear or unshielded unit.
const SPEAR={spearman:'spear','shield-spear':'spear',pike:'spear'};
export const FACTION_ANIMATION_UNITS:Record<string,Record<string,string>>={
 roman:{legionary:'infantry',centurion:'infantry',swordsman:'infantry',heavy:'infantry',archer:'archer',equites:'cavalry','light-horse':'cavalry',...SPEAR},
 persian:{immortal:'infantry','shield-spear':'infantry',archer:'archer','royal-archer':'archer',cataphract:'cavalry',spearman:'spear',pike:'spear'},
 english:{swordsman:'infantry',heavy:'infantry',archer:'archer',longbow:'archer',knight:'cavalry',...SPEAR},
 french:{swordsman:'infantry',heavy:'infantry',archer:'archer',knight:'cavalry',...SPEAR},
 chinese:{swordsman:'infantry',heavy:'infantry','repeating-crossbow':'archer','light-horse':'cavalry',...SPEAR},
 steppe:{militia:'infantry',swordsman:'infantry',heavy:'infantry',archer:'archer',crossbow:'archer',javelin:'archer',scout:'cavalry','light-horse':'cavalry',lancer:'cavalry',knight:'cavalry','horse-archer':'cavalry',...SPEAR},
 ayyubid:{swordsman:'infantry',heavy:'infantry',archer:'archer','light-horse':'cavalry',...SPEAR},
 japanese:{samurai:'infantry',archer:'archer','light-horse':'cavalry',...SPEAR},
 khmer:{swordsman:'infantry',heavy:'infantry',archer:'archer','war-elephant':'cavalry',...SPEAR},
 castilian:{swordsman:'infantry',heavy:'infantry',archer:'archer',knight:'cavalry',...SPEAR},
};
type Atlas=typeof frames[keyof typeof frames];
export class FactionAnimations {
 private images=new Map<string,HTMLImageElement>();
 private alpha=new Map<HTMLImageElement,Uint8Array>();
 private pending=new Map<string,Promise<void>>();
 has(faction:string,unit:string){return !!FACTION_ANIMATION_UNITS[faction]?.[unit];}
 private load(key:string,data:Atlas){const pending=this.pending.get(key);if(pending)return pending;const promise=new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d')!;c.drawImage(image,0,0);const rgba=c.getImageData(0,0,image.width,image.height).data,a=new Uint8Array(image.width*image.height);for(let i=0;i<a.length;i++)a[i]=rgba[i*4+3];this.alpha.set(image,a);this.images.set(key,image);resolve();};image.onerror=()=>{this.pending.delete(key);reject(Error('Unit atlas unavailable: '+key));};setSpriteSource(image,data.file);});this.pending.set(key,promise);return promise;}
 preload(factions:string[]){if(factions.some(f=>Object.values(FACTION_ANIMATION_UNITS[f]??{}).includes('cavalry')))void prepareMotionFrames();return Promise.all([...new Set(factions)].flatMap(f=>[...new Set(Object.values(FACTION_ANIMATION_UNITS[f]??{}))].map(family=>{const key=f+'-'+family,data=frames[key as keyof typeof frames];return data?this.load(key,data):Promise.resolve();})));}
 opaque(image:HTMLImageElement,x:number,y:number){const a=this.alpha.get(image);return a?a[y*image.width+x]>70:undefined;}
 sprite(faction:string,unit:string,direction:number,phase:number,speed:number,attackAge:number,hitAge:number,deathAge:number,scale:number):SceneSprite|null{
  const family=FACTION_ANIMATION_UNITS[faction]?.[unit];if(!family)return null;
  const key=faction+'-'+family,data=frames[key as keyof typeof frames];if(!data)return null;void this.load(key,data).catch(()=>{});const image=this.images.get(key);if(!image)return null;
  const moving=speed>.16,run=speed>3.2&&family==='cavalry'&&unit!=='war-elephant';
  let sample={from:0,to:0,mix:0};
  if(deathAge>=0)sample=timedPose(deathAge,[[0,10],[.48,11]]);
  else if(attackAge>=0&&attackAge<1.05)sample=timedPose(attackAge,[[0,0],[.34,7],[ATTACK_WINDUP-.06,7],[ATTACK_WINDUP,8],[.66,8],[1.05,0]]);
  else if(hitAge>=0&&hitAge<.22&&!moving)sample=timedPose(hitAge,[[0,9],[.07,9],[.22,0]]);
  else if(moving)sample=cyclePose(phase*4,run?[4,5,6,5]:[1,2,3,2]);
  const row=data.directions[(direction+8)%8],packed=isolatedAtlas(data.file),rect=(column:number)=>poseRect(packed?.frames[row*packed.cols+column]??data.frames[row][column]);
  return poses.sample(image,rect(sample.from),rect(sample.to),sample.mix,data.size*scale/data.nominal);
 }
}
