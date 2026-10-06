// One release time shared by simulation strikes and sprite timelines.
export const ATTACK_WINDUP=.5;
export function attackPose(frameCount:number,age:number){
 if(age<0)return 0;
 if(frameCount>=8){if(age<ATTACK_WINDUP)return Math.min(3,Math.floor(age/ATTACK_WINDUP*4));return age<.64?4:age<.84?5:age<1.08?6:7;}
 return age<.18?0:age<ATTACK_WINDUP?1:age<.72?2:3;
}
