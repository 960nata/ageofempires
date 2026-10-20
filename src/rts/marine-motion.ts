export type CrewAction='idle'|'row'|'fish'|'hunt'|'attack';
export const FISHING_SECONDS=3.6;
export const rowingRate=(speed:number)=>.48+Math.min(Math.max(speed,0),5)*.09;
export const unitCycle=(value:number)=>((value%1)+1)%1;
export const ease=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export const headingVector=(direction:number)=>({x:Math.cos(direction*Math.PI/4),y:Math.sin(direction*Math.PI/4)});

/** Every part of a vessel consumes the same movement or work cycle. */
export function crewAction(def:string,state:string,moving:boolean):CrewAction {
 if(moving)return 'row';
 if(state==='fish'&&(def==='fishing-boat'||def==='whaling-boat'))return 'fish';
 if(state==='hunt'&&def==='whaling-boat')return 'hunt';
 if((state==='attack'||state==='recover')&&def==='war-ship')return 'attack';
 return 'idle';
}
export function boatPose(action:CrewAction,rowCycle:number,workSeconds:number){
 if(action==='row'){
  const p=unitCycle(rowCycle);
  // The power stroke is shorter than the recovery; neither endpoint snaps.
  return 1+(p<.43?ease(p/.43):1-ease((p-.43)/.57));
 }
 if(action==='fish'||action==='hunt'){
  const p=unitCycle(workSeconds/FISHING_SECONDS);
  if(p<.12)return 3;
  if(p<.32)return 3+ease((p-.12)/.2);
  if(p<.52)return 4;
  if(p<.72)return 4+ease((p-.52)/.2);
  if(p<.86)return 5-ease((p-.72)/.14);
  return 4-ease((p-.86)/.14);
 }
 return 0;
}
// Phase of the swell drawn by WaterEffects at a world point, so hulls ride the crests the player sees.
const swellPhase=(time:number,x:number,z:number)=>(x*.62+z*.38)*.42-time*1.15;
export function boatFloat(time:number,id:number,scale:number,speed=0,x=id*3.1,z=id*1.7){
 // Heave: the passing swell plus a slower ground swell. Underway hulls cut through and heave a little less.
 const motion=Math.min(1,Math.max(0,speed/4)),swell=Math.sin(swellPhase(time,x,z));
 return scale*(swell*(.12-motion*.03)+Math.sin(time*.53+id*.37)*.05);
}
export function boatRock(time:number,id:number,speed=0,x=id*3.1,z=id*1.7){
 // Roll leads heave by a quarter wave (the hull tilts down the face of the crest), about ±3° at rest.
 const motion=Math.min(1,Math.max(0,speed/4)),slope=Math.cos(swellPhase(time,x,z));
 return slope*(.05-motion*.015)+Math.sin(time*.83+id*.71)*.018+Math.sin(time*1.71+id*.23)*.006;
}
/** Water lapping at the hull: rings swell outward in time with the heave. */
export function hullRipple(c:CanvasRenderingContext2D,p:{x:number;y:number},width:number,time:number,id:number,scale:number,speed=0,x=id*3.1,z=id*1.7){
 const calm=1-Math.min(1,Math.max(0,speed/3));if(calm<.05)return;
 c.save();c.lineCap='round';
 for(let i=0;i<2;i++){
  const u=unitCycle(-swellPhase(time,x,z)/(Math.PI*2)+i*.5),rx=width*(.32+u*.22),ry=rx*.36;
  c.strokeStyle=`rgba(214,230,220,${(calm*.32*(1-u)).toFixed(3)})`;c.lineWidth=Math.max(.7,scale*.05*(1-u*.5));
  c.beginPath();c.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);c.stroke();
 }
 c.restore();
}

export function marineEvent(kind:string,time:number,id:number){
 const tuna=kind==='tuna',period=tuna?31+id%5*3:46+id%4*4,duration=tuna?3.4:6.8;
 const age=unitCycle((time+id*7.37)/period)*period;
 const progress=Math.min(1,age/duration);
 return {age,progress,visible:age<duration?ease(age/.65)*ease((duration-age)/.95):0};
}
