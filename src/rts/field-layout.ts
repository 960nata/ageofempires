import type {Entity,Point} from './world';
export const isField=(def:string)=>def==='farm'||def==='orchard';
export function fieldPoint(field:Pick<Entity,'x'|'z'|'facing'>,x:number,z:number):Point{const a=(field.facing??0)*Math.PI/2;return{x:field.x+x*Math.cos(a)+z*Math.sin(a),z:field.z-x*Math.sin(a)+z*Math.cos(a)};}
export function fieldPlots(field:Entity){const orchard=field.def==='orchard',n=orchard?3:7,spacing=orchard?1.55:.76;return Array.from({length:n*n},(_,index)=>({index,...fieldPoint(field,(index%n-(n-1)/2)*spacing,(Math.floor(index/n)-(n-1)/2)*spacing)}));}
export function harvestedPlots(field:Entity){const total=field.def==='orchard'?9:49;return Math.min(total,Math.floor((1-field.amount/(field.initialAmount??(field.def==='orchard'?420:360)))*total));}
export function fieldWorkPoint(field:Entity,workerId:number){const plots=fieldPlots(field),index=Math.min(plots.length-1,harvestedPlots(field)+(workerId%3)),p=plots[index];return{x:p.x+.5,z:p.z+.5};}
export const TREE_FALL_SECONDS=2.15;
