import type {Entity} from './world';
import type {SceneSprite} from './scene-art';
import {assetUrl} from './assets';
import {poses,poseRect} from './pose-sampling';
import {unitCycle,ease as smooth,headingVector,marineEvent,FISHING_SECONDS} from './marine-motion';

type Point={x:number;y:number};
const TAU=Math.PI*2;
const netImage=new Image();netImage.src=assetUrl('cast-net-frames-v1.avif');
const swimImage=new Image();swimImage.src=assetUrl('marine-swim-v2.avif');
const netFrames=[{x:0,y:100,w:400,h:460},{x:410,y:100,w:555,h:460},{x:1010,y:125,w:635,h:435},{x:1700,y:100,w:472,h:460}];

/** Animate the painted fish atlas; no substitute white silhouettes are drawn over the sea. */
export function drawMarineLife(c:CanvasRenderingContext2D,e:Entity,p:Point,scale:number,time:number,prey:SceneSprite){
 const fish=e.def==='fish',tuna=e.def==='tuna',busy=(e.processUntil??0)>time;
 c.save();
 c.filter='brightness(.82) saturate(.9)';
 const paint=(frame:number,x:number,y:number,width:number,alpha:number)=>{
  if(alpha<=.005)return;
  const height=width*.75;
  c.globalAlpha=alpha;
  c.drawImage(prey.image,Math.max(0,Math.min(3,frame))*128,prey.sy,128,96,x-width*.5,y-height*prey.anchor,width,height);
 };
 if(fish){
  // Three independently timed atlas groups form a shoal without copying a pale placeholder fish.
  for(let i=0;i<3;i++){
   const cycle=unitCycle(time/(4.8+i*.25)+e.id*.37+i*.29)*4;
   const first=Math.floor(cycle),mix=cycle-first;
   const x=p.x+(i-1)*prey.width*.29+Math.sin(time*.22+e.id)*prey.width*.085;
   const y=p.y+(i-1)*scale*.19+Math.sin(time*.22+e.id)*scale*.07+Math.sin(time*.65+i*.4)*scale*.025;
   const width=prey.width*(i===1?.69:.62),alpha=busy?.86:.76;
   const rect=(frame:number)=>poseRect({x:frame*128,y:prey.sy,w:128,h:96,anchorY:prey.anchor});
   const sprite=poses.sample(prey.image,rect(first),rect((first+1)%4),mix,width/128);
   c.globalAlpha=alpha;c.drawImage(sprite.image,sprite.sx,sprite.sy,sprite.sw,sprite.sh,x-sprite.width*(sprite.anchorX??.5),y-sprite.height*sprite.anchor,sprite.width,sprite.height);
  }
 }else{
  const {progress,visible}=marineEvent(e.def,time,e.id),drift=Math.sin(time*.16+e.id)*scale*.2;
  // Swimming has its own anatomy and tail cycle; splash frames never sit underwater.
  if(swimImage.complete&&swimImage.naturalWidth){
   const cellW=swimImage.naturalWidth/4,cellH=swimImage.naturalHeight/4;
   const cycle=unitCycle(time/(tuna?2.8:6.4)+e.id*.17)*8,frame=Math.floor(cycle),offset=tuna?0:8;
   const rect=(f:number)=>poseRect({x:(offset+f)%4*cellW,y:Math.floor((offset+f)/4)*cellH,w:cellW,h:cellH,anchorY:.5});
   const swim=poses.sample(swimImage,rect(frame),rect((frame+1)%8),cycle-frame,prey.width/cellW);
   c.filter='brightness(.65) saturate(.68)';c.globalAlpha=(busy?.76:.62)*(1-visible);
   const y=p.y+scale*.18+Math.sin(time*.25+e.id)*scale*.04;
   c.drawImage(swim.image,swim.sx,swim.sy,swim.sw,swim.sh,p.x+drift-swim.width*(swim.anchorX??.5),y-swim.height*swim.anchor,swim.width,swim.height);
  }
  if(visible>.005){
   c.filter='brightness(.82) saturate(.9)';
   const frame=progress*3,first=Math.min(3,Math.floor(frame)),mix=smooth(frame-first);
   const leap=Math.sin(progress*Math.PI)*scale*(tuna?.32:.22);
   paint(first,p.x+drift,p.y-leap,prey.width,visible*(1-mix));
   paint(Math.min(3,first+1),p.x+drift,p.y-leap,prey.width,visible*mix);
  }
 }
 c.restore();
 const ripple=(time*.2+e.id*.19)%1;
 c.save();c.strokeStyle=`rgba(39,104,117,${.12*(1-ripple)})`;c.lineWidth=Math.max(.65,scale*.025);c.beginPath();c.ellipse(p.x,p.y+1,prey.width*(.13+ripple*.13),prey.width*(.03+ripple*.04),0,0,TAU);c.stroke();c.restore();
}

/** The wake trails the stern. Its strength follows speed, not a blinking clock. */
export function drawBoatWake(c:CanvasRenderingContext2D,p:Point,s:SceneSprite,direction:number,speed:number,rowCycle:number,scale:number){
 const strength=Math.min(1,Math.max(0,speed)/3.2);if(strength<.035)return;
 const {x:dx,y:dy}=headingVector(direction),nx=-dy,ny=dx;
 const stern={x:p.x-dx*s.width*.17,y:p.y-dy*s.width*.17};
 c.save();c.lineWidth=Math.max(.65,scale*.025);c.lineCap='round';
 for(let i=0;i<3;i++){
  const u=unitCycle(rowCycle+i/3),length=s.width*(.12+u*.34)*strength,spread=s.width*(.05+u*.08);
  c.strokeStyle=`rgba(156,202,205,${strength*(1-u)*.18})`;
  for(const side of [-1,1]){c.beginPath();c.moveTo(stern.x+nx*spread*side*.45,stern.y+ny*spread*side*.45);c.quadraticCurveTo(stern.x-dx*length*.5+nx*spread*side,stern.y-dy*length*.5+ny*spread*side,stern.x-dx*length+nx*spread*side*1.4,stern.y-dy*length+ny*spread*side*1.4);c.stroke();}
 }
 c.restore();
}

export function drawCurrent(c:CanvasRenderingContext2D,p:Point,vector:Point,scale:number,phase:number,strength=.13){
 const opacity=Math.sin(phase*Math.PI)**2*strength,length=Math.hypot(vector.x,vector.y)||1;
 const dx=vector.x/length*scale*.48,dy=vector.y/length*scale*.48;
 c.save();c.strokeStyle=`rgba(170,209,211,${opacity})`;c.lineWidth=Math.max(.6,scale*.028);c.beginPath();c.moveTo(p.x-dx,p.y-dy);c.quadraticCurveTo(p.x-dy*.1,p.y+dx*.1,p.x+dx,p.y+dy);c.stroke();c.restore();
}

/** Cast, spread, and haul the same net in the game and the animation preview. */
export function drawFishingNet(c:CanvasRenderingContext2D,p:Point,q:Point,s:SceneSprite,scale:number,workPhase:number,fish:SceneSprite|null,direction=0){
 const phase=unitCycle(workPhase/FISHING_SECONDS),vector=headingVector(direction);
 const hand={x:p.x+vector.x*s.width*.16,y:p.y+vector.y*s.width*.16-s.height*.19},reach=Math.hypot(q.x-hand.x,q.y-hand.y),limit=Math.max(scale*1.5,s.width*.95);
 const castDistance=Math.max(s.width*.64,Math.min(reach,limit)),bearing=reach>.01?{x:(q.x-hand.x)/reach,y:(q.y-hand.y)/reach}:{x:1,y:0};
 const target={x:hand.x+bearing.x*castDistance,y:hand.y+bearing.y*castDistance};
 const cast=smooth((phase-.12)/.3),haul=smooth((phase-.74)/.24),travel=cast*(1-haul);
 const x=hand.x+(target.x-hand.x)*travel,y=hand.y+(target.y-hand.y)*travel-Math.sin(Math.min(1,Math.max(0,(phase-.12)/.3))*Math.PI)*scale*.48*(1-haul);
 const opened=smooth((phase-.2)/.27)*(1-smooth((phase-.77)/.2));
 const radius=Math.max(2,scale*(.09+.62*opened)),depth=radius*(phase<.43?.9:.68),flat=phase>.42&&phase<.76;
 c.save();c.lineCap='round';c.strokeStyle='#705d3b';c.lineWidth=Math.max(.7,scale*.018);c.globalAlpha=.75;c.beginPath();c.moveTo(hand.x,hand.y);c.quadraticCurveTo((hand.x+x)/2,(hand.y+y)/2+scale*.12,x,y);c.stroke();
 if(flat){const landing=smooth((phase-.41)/.14);c.strokeStyle=`rgba(187,214,209,${.23*(1-landing)})`;c.lineWidth=Math.max(.7,scale*.027);c.beginPath();c.ellipse(x,y,radius*(1+landing*.35),radius*.42*(1+landing*.35),0,0,TAU);c.stroke();}
 if(netImage.complete&&netImage.naturalWidth){
  const frame=phase<.18?0:phase<.42?1:phase<.75?2:3,rect=netFrames[frame];
  const width=Math.max(scale*.65,radius*(frame===2?2.65:frame===1?2.2:1.9)),height=width*rect.h/rect.w;
  c.globalAlpha=frame===2?.82:.92;
  c.drawImage(netImage,rect.x,rect.y,rect.w,rect.h,x-width*.5,y-height*(frame===2?.66:.78),width,height);
  c.restore();return;
 }
 // Radial twine, sagging rings, and small rim weights read as a cast net in perspective.
 const strands=16,ry=radius*(flat?.46:.52);
 c.fillStyle='rgba(113,119,103,.16)';c.beginPath();c.moveTo(x,y-depth);c.quadraticCurveTo(x+radius*.7,y-depth*.42,x+radius,y);c.quadraticCurveTo(x+radius*.62,y+ry*.72,x,y+ry*.78);c.quadraticCurveTo(x-radius*.62,y+ry*.72,x-radius,y);c.quadraticCurveTo(x-radius*.7,y-depth*.42,x,y-depth);c.fill();
 c.strokeStyle='#bba277';c.globalAlpha=.7;c.lineWidth=Math.max(.85,scale*.021);
 for(let i=0;i<strands;i++){const a=i*TAU/strands,ex=x+Math.cos(a)*radius,ey=y+Math.sin(a)*ry;
  c.beginPath();c.moveTo(x,y-depth);c.quadraticCurveTo(x+Math.cos(a)*radius*.43,y+Math.sin(a)*ry*.43+depth*.15,ex,ey);c.stroke();
  if(i%2===0){c.fillStyle='#655943';c.globalAlpha=.85;c.beginPath();c.arc(ex,ey,Math.max(.7,scale*.025),0,TAU);c.fill();c.globalAlpha=.7;}
 }
 for(const fraction of [.38,.7,1]){c.beginPath();c.ellipse(x,y-depth*(1-fraction),radius*fraction,ry*fraction,0,0,TAU);c.stroke();}
 if(fish&&phase>.78&&phase<.96){c.globalAlpha=.55;c.drawImage(fish.image,fish.sx,fish.sy,fish.sw,fish.sh,x-fish.width*.31,y-fish.height*.47,fish.width*.62,fish.height*.62);}
 c.restore();
}
