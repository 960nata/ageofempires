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
export function boatFloat(time:number,id:number,scale:number,speed=0){
 // Hull follows two overlapping swells; underway boats ride a slightly broader wave.
 const motion=Math.min(1,Math.max(0,speed/4));
 return scale*(Math.sin(time*1.12+id*.71)*(.032+motion*.014)+Math.sin(time*.53+id*.37)*(.018+motion*.008));
}
export function boatRock(time:number,id:number,speed=0){
 const motion=Math.min(1,Math.max(0,speed/4));
 return Math.sin(time*.83+id*.71)*(.014+motion*.008)+Math.sin(time*1.71+id*.23)*(.004+motion*.003);
}

export function marineEvent(kind:string,time:number,id:number){
 const tuna=kind==='tuna',period=tuna?31+id%5*3:46+id%4*4,duration=tuna?3.4:6.8;
 const age=unitCycle((time+id*7.37)/period)*period;
 const progress=Math.min(1,age/duration);
 return {age,progress,visible:age<duration?ease(age/.65)*ease((duration-age)/.95):0};
}
