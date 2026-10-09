import type {SceneSprite} from './scene-art';
export const CONSTRUCTION_FRAME_COUNT=16;
/** Construction is assembled in the selected facade's coordinates, never another building's sprite. */
export class ConstructionFrames {
 private cache=new Map<string,HTMLCanvasElement>();
 readonly ready=Promise.resolve();
 frame(sprite:SceneSprite,era:number,index:number,overlay=false,def='house',facing=0){
  const phase=Math.max(0,Math.min(CONSTRUCTION_FRAME_COUNT-1,Math.floor(index)));
  const key=[sprite.image.src,sprite.sx,sprite.sy,sprite.sw,sprite.sh,sprite.width/sprite.height,sprite.anchor,sprite.anchorX??.5,era,phase,overlay,def,facing].join(':');
  const cached=this.cache.get(key);if(cached){this.cache.delete(key);this.cache.set(key,cached);return cached;}
  const result=this.makeFrame(sprite,phase,overlay,def,facing,era);this.cache.set(key,result);
  // Bounded memory even when many different factions and facades are under renovation.
  if(this.cache.size>48)this.cache.delete(this.cache.keys().next().value!);return result;
 }
 private makeFrame(s:SceneSprite,phase:number,overlay:boolean,def:string,facing:number,era:number){
  const out=document.createElement('canvas'),k=Math.min(1,384/Math.max(s.sw,s.sh));out.width=Math.max(1,Math.round(s.sw*k));out.height=Math.max(1,Math.round(s.sh*k));
  const c=out.getContext('2d')!,w=out.width,h=out.height,p=phase/(CONSTRUCTION_FRAME_COUNT-1),cx=(s.anchorX??.5)*w,gy=s.anchor*h;
  if(phase===CONSTRUCTION_FRAME_COUNT-1){if(!overlay)c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,0,0,w,h);return out;}
  const half=w*.37,depth=Math.min(w*.18,h*.2),base=[{x:cx-half,y:gy},{x:cx,y:gy-depth},{x:cx+half,y:gy},{x:cx,y:gy+depth}];
  const line=(a:{x:number;y:number},b:{x:number;y:number},color:string,width:number)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();};
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  if(!overlay){
   // Foundation courses share the finished facade's exact ground anchor.
   c.fillStyle=era===0?'#665844':'#797365';c.beginPath();base.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();c.fill();
   for(let side=0;side<4;side++){const a=base[side],b=base[(side+1)%4];line(a,b,'#3c352b',Math.max(1,w*.018));for(let j=0;j<8;j++){const t=(j+.5)/8,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;line({x:x-w*.012,y:y-w*.014},{x:x+w*.012,y:y+w*.014},'#b2a185',Math.max(1,w*.009));}}
   // Masonry rises before the roof is revealed. Final phase is the actual selected facade.
   if(phase>1){const rise=Math.min(1,Math.max(0,(p-.07)/.86)),cut=h*(1-rise);c.save();c.beginPath();c.rect(0,cut,w,h-cut);c.clip();c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,0,0,w,h);c.restore();}
  }
  const finishFade=Math.max(0,Math.min(1,(1-p)*5));if(finishFade===0)return out;
  c.globalAlpha=finishFade*(overlay?.88:1);
  const railHeight=Math.min(gy-depth*.7,h*(overlay?.75:.2+p*.65)),wood=era===0?'#74603b':'#8c7049';
  // Rear posts first, then the front platforms. A rotated entrance receives the ladder.
  for(const side of [0,1,2,3]){const a=base[side],b=base[(side+1)%4],front=side>=2;
   c.globalAlpha=finishFade*(front?1:.48)*(overlay?.88:1);
   for(let j=0;j<=3;j++){const t=j/3,q={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};line(q,{x:q.x,y:q.y-railHeight},'#453721',Math.max(1.5,w*.013));line({x:q.x+w*.004,y:q.y},{x:q.x+w*.004,y:q.y-railHeight},wood,Math.max(1,w*.006));}
   const levels=Math.max(1,Math.ceil(railHeight/(h*.21)));for(let level=1;level<=levels;level++){const lift=railHeight*level/levels,aa={x:a.x,y:a.y-lift},bb={x:b.x,y:b.y-lift};line(aa,bb,wood,Math.max(2,w*.022));if(level<levels)line(aa,{x:b.x,y:b.y-lift+railHeight/levels},'#58462f',Math.max(1,w*.006));}
   if(side===((Math.round(facing)+2)%4)){const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},top={x:mid.x+w*.035,y:mid.y-railHeight};for(const dx of [-w*.02,w*.02])line({x:mid.x+dx,y:mid.y},{x:top.x+dx,y:top.y},'#b09a6e',Math.max(1,w*.007));for(let r=0;r<7;r++){const t=r/7;line({x:mid.x+(top.x-mid.x)*t-w*.02,y:mid.y-railHeight*t},{x:mid.x+(top.x-mid.x)*t+w*.02,y:mid.y-railHeight*t},'#b09a6e',Math.max(1,w*.005));}}
  }
  c.globalAlpha=1;return out;
 }
}
