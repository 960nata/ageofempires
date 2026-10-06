import {GRID_SIZE,MAP_HALF,worldCell,gridIndex,cellCentre} from './map';
type Point={x:number;z:number};
class MinHeap {
 private nodes:{id:number;score:number}[]=[];
 get length(){return this.nodes.length;}
 push(id:number,score:number){const n={id,score};let i=this.nodes.length;this.nodes.push(n);while(i>0){const parent=(i-1)>>1;if(this.nodes[parent].score<=score)break;this.nodes[i]=this.nodes[parent];i=parent;}this.nodes[i]=n;}
 pop(){const first=this.nodes[0],last=this.nodes.pop()!;if(this.nodes.length){let i=0;while(i*2+1<this.nodes.length){let child=i*2+1;if(child+1<this.nodes.length&&this.nodes[child+1].score<this.nodes[child].score)child++;if(this.nodes[child].score>=last.score)break;this.nodes[i]=this.nodes[child];i=child;}this.nodes[i]=last;}return first.id;}
}
// Synchronous searches reuse buffers; no per-worker 128×128 grid allocation.
const scores=new Float32Array(GRID_SIZE*GRID_SIZE);
const parents=new Int32Array(GRID_SIZE*GRID_SIZE);
const closed=new Uint8Array(GRID_SIZE*GRID_SIZE);
const clearanceCache=new WeakMap<Set<number>,Map<number,Set<number>>>();
export function invalidatePathCache(blocked:Set<number>){clearanceCache.delete(blocked);}
function clearance(blocked:Set<number>,radius:number){
 if(radius<=0)return blocked;
 let sizes=clearanceCache.get(blocked);if(!sizes){sizes=new Map();clearanceCache.set(blocked,sizes);}
 const key=radius,cached=sizes.get(key);if(cached)return cached;
 const denied=new Set(blocked);
 {const reach=Math.ceil((radius+1)/2);for(const key of blocked){const bx=key%GRID_SIZE,bz=Math.floor(key/GRID_SIZE);for(let dz=-reach;dz<=reach;dz++)for(let dx=-reach;dx<=reach;dx++){const x=bx+dx,z=bz+dz;if(x<1||z<1||x>=GRID_SIZE-1||z>=GRID_SIZE-1)continue;const gapX=Math.max(0,Math.abs(dx)*2-1),gapZ=Math.max(0,Math.abs(dz)*2-1);if(Math.hypot(gapX,gapZ)<radius-.001)denied.add(gridIndex(x,z));}}
 }
 sizes.set(key,denied);return denied;
}
export function findPath(start:Point,goal:Point,blocked:Set<number>,radius=0):Point[]{
 const a=worldCell(start),b=worldCell(goal),denied=clearance(blocked,radius);
 const valid=(x:number,z:number)=>x>=1&&z>=1&&x<GRID_SIZE-1&&z<GRID_SIZE-1&&!denied.has(gridIndex(x,z));
 if(a.x<0||a.z<0||a.x>=GRID_SIZE||a.z>=GRID_SIZE||Math.abs(goal.x)>=MAP_HALF-2||Math.abs(goal.z)>=MAP_HALF-2)return[];
 const pointFits=(p:Point)=>[-radius,radius].every(dx=>[-radius,radius].every(dz=>{const c=worldCell({x:p.x+dx,z:p.z+dz});return valid(c.x,c.z);}));
 let tx=b.x,tz=b.z;if(!valid(tx,tz)){let best=Infinity;for(let dz=-4;dz<=4;dz++)for(let dx=-4;dx<=4;dx++){const x=b.x+dx,z=b.z+dz;if(!valid(x,z))continue;const distance=Math.hypot(cellCentre(x)-goal.x,cellCentre(z)-goal.z)+Math.hypot(cellCentre(x)-start.x,cellCentre(z)-start.z)*.01;if(distance<best){best=distance;tx=x;tz=z;}}if(best===Infinity)return[];}
 const begin=gridIndex(a.x,a.z),target=gridIndex(tx,tz),targetPoint=valid(b.x,b.z)&&pointFits(goal)?goal:{x:cellCentre(tx),z:cellCentre(tz)};if(begin===target)return[targetPoint];
 scores.fill(Infinity);parents.fill(-1);closed.fill(0);scores[begin]=0;const heap=new MinHeap();const heuristic=(x:number,z:number)=>{const dx=Math.abs(tx-x),dz=Math.abs(tz-z);return Math.max(dx,dz)+.41421356*Math.min(dx,dz);};heap.push(begin,heuristic(a.x,a.z));
 let expanded=0,closest=begin,closestH=heuristic(a.x,a.z);while(heap.length&&expanded<GRID_SIZE*GRID_SIZE){const cur=heap.pop();if(closed[cur])continue;closed[cur]=1;expanded++;const cx=cur%GRID_SIZE,cz=Math.floor(cur/GRID_SIZE),h=heuristic(cx,cz);if(h<closestH){closestH=h;closest=cur;}if(cur===target){closest=target;break;}
  const x=cur%GRID_SIZE,z=Math.floor(cur/GRID_SIZE);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(!valid(nx,nz)||dx&&dz&&(!valid(x+dx,z)||!valid(x,z+dz)))continue;const n=gridIndex(nx,nz);if(closed[n])continue;const score=scores[cur]+(dx&&dz?Math.SQRT2:1);if(score<scores[n]){scores[n]=score;parents[n]=cur;heap.push(n,score+heuristic(nx,nz));}}
 }
 if(closest===begin)return[];const path:Point[]=[];for(let n=closest;n!==begin;n=parents[n]){if(n<0)return[];path.push({x:cellCentre(n%GRID_SIZE),z:cellCentre(Math.floor(n/GRID_SIZE))});}path.reverse();
 if(closest===target&&valid(b.x,b.z)&&pointFits(goal))path.push(goal);return path;
}
