export type CrewAction='idle'|'row'|'fish'|'hunt'|'attack';
export const FISHING_SECONDS=3.6;
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
  if(p<.18)return 3;
  if(p<.4)return 3+ease((p-.18)/.22);
  if(p<.66)return 4;
  if(p<.88)return 4+ease((p-.66)/.22);
  return 5-2*ease((p-.88)/.12);
 }
 return 0;
}
export function boatFloat(time:number,id:number,scale:number){
 // A slow swell, not an independent bounce for each crew member.
 return scale*(Math.sin(time*1.12+id*.71)*.025+Math.sin(time*.53+id*.37)*.013);
}

export function marineEvent(kind:string,time:number,id:number){
 const tuna=kind==='tuna',period=tuna?31+id%5*3:46+id%4*4,duration=tuna?3.4:6.8;
 const age=unitCycle((time+id*7.37)/period)*period;
 const progress=Math.min(1,age/duration);
 return {age,progress,visible:age<duration?ease(age/.65)*ease((duration-age)/.95):0};
}
