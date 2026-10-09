// One map contract shared by navigation, fog, saves, rendering and camera controls.
// The terrain itself is generated per match by configureMap(); 'borderlands' reproduces the original hand-made map.
export const MAP_SIZE=384;
// Map features are authored on the original 256 map and scaled up; cliff and ravine walls keep their width.
export const MAP_SCALE=MAP_SIZE/256;
export const MAP_HALF=MAP_SIZE/2;
export const CELL_SIZE=2;
export const GRID_SIZE=MAP_SIZE/CELL_SIZE;
export const gridIndex=(x:number,z:number)=>z*GRID_SIZE+x;
export const worldCell=(p:{x:number;z:number})=>({x:Math.floor((p.x+MAP_HALF)/CELL_SIZE),z:Math.floor((p.z+MAP_HALF)/CELL_SIZE)});
export const cellCentre=(x:number)=>x*CELL_SIZE-MAP_HALF+CELL_SIZE/2;

export type MapType='borderlands'|'coastal'|'lakes'|'river'|'highlands'|'wetlands';
export type Biome='temperate'|'arid'|'autumn'|'winter';
export interface MapSpec {type:MapType;biome:Biome;seed:number;}
export const MAP_TYPES:Record<MapType,string>={borderlands:'Borderlands (classic)',coastal:'Coastal',lakes:'Lakes',river:'River Valley',highlands:'Highlands',wetlands:'Wetlands'};
export const BIOMES:Record<Biome,string>={temperate:'Temperate',arid:'Arid',autumn:'Autumn',winter:'Winter'};

type Hill={x:number;z:number;r:number;h:number;ramp?:boolean};
type Pool={x:number;z:number;r:number;p:number};
interface Terrain {
 coast?:{base:number;a1:number;f1:number;p1:number;a2:number;f2:number;p2:number};
 ravine:boolean;hills:Hill[];lakes:Pool[];marshes:Pool[];
 river?:{points:{x:number;z:number}[];width:number;phase:number};fords:{x:number;z:number;r:number}[];
}

const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const K=MAP_SCALE;
// Mulberry32: small, fast and identical on every browser, so a seed always rebuilds the same map.
function seeded(seed:number){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

const BORDERLANDS:Terrain={coast:{base:83,a1:9,f1:.045,p1:0,a2:4,f2:.083,p2:0},ravine:true,lakes:[],marshes:[],fords:[],
 hills:[{x:-54,z:-65,r:10,h:5},{x:49,z:3,r:11,h:5},{x:-82,z:0,r:19,h:7},{x:-8,z:48,r:23,h:9},{x:27,z:-63,r:20,h:8},{x:-47,z:-90,r:17,h:6}].map(h=>({x:h.x*K,z:h.z*K,r:h.r*K,h:h.h}))};

let spec:MapSpec={type:'borderlands',biome:'temperate',seed:42};
let T:Terrain=BORDERLANDS;
/** Live binding for renderers that decorate hill rims. */
export let HIGHLANDS:Hill[]=T.hills;
export const mapSpec=()=>spec;
export const hasSea=()=>!!T.coast;
export const hasRavine=()=>T.ravine;
export const mapLakes=()=>T.lakes;

function generate(s:MapSpec):Terrain{
 if(s.type==='borderlands')return BORDERLANDS;
 const r=seeded(s.seed*7919+s.type.length*131),span=(a:number,b:number)=>a+r()*(b-a),edge=MAP_HALF-24;
 const t:Terrain={ravine:false,hills:[],lakes:[],marshes:[],fords:[]};
 const clear=(x:number,z:number,gap:number)=>t.hills.every(h=>Math.hypot(h.x-x,h.z-z)>h.r+gap)&&t.lakes.every(l=>Math.hypot(l.x-x,l.z-z)>l.r+gap);
 const scatter=(n:number,make:(x:number,z:number)=>void,gap:number,limit=edge-20)=>{for(let i=0,tries=0;i<n&&tries<n*40;tries++){const x=span(-limit,limit),z=span(-limit,limit);if(!clear(x,z,gap))continue;make(x,z);i++;}};
 const hills=(n:number)=>scatter(n,(x,z)=>t.hills.push({x,z,r:span(10,22)*K,h:Math.round(span(5,9))}),30*K);
 const lakes=(n:number,min:number,max:number)=>scatter(n,(x,z)=>t.lakes.push({x,z,r:span(min,max)*K,p:r()*6}),26*K,edge-40);
 if(s.type==='coastal'){t.coast={base:span(70,92),a1:span(5,14),f1:span(.03,.06),p1:r()*6,a2:span(2,6),f2:span(.07,.11),p2:r()*6};hills(4);if(r()<.6)lakes(1,8,13);}
 if(s.type==='lakes'){lakes(5,11,22);hills(2);}
 if(s.type==='river'){
  // Broad, seeded S-bend with softly changing banks instead of a jagged random walk.
  // The same curve drives ground, water, collision and ford placement.
  const vertical=r()<.5,points:{x:number;z:number}[]=[],phase=r()*Math.PI*2,amp=span(34,49)*K,offset=span(-10,10)*K;
  for(let i=0;i<=16;i++){const u=-MAP_HALF-12+i*(MAP_SIZE+24)/16,q=(u+MAP_HALF)/MAP_SIZE;
   const drift=offset+amp*Math.sin(q*Math.PI*2+phase)*.64+amp*.24*Math.sin(q*Math.PI*4-phase*.7)+amp*.10*Math.sin(q*Math.PI*6+phase*.4);
   points.push(vertical?{x:drift,z:u}:{x:u,z:drift});}
  t.river={points,width:span(8,11),phase:r()*6};
  for(const at of [.25,.5,.75]){const i=Math.round(at*16),p=points[i];t.fords.push({x:p.x,z:p.z,r:6.5});}
  hills(3);
 }
 if(s.type==='highlands'){
  // A ridge of steep hills across the map; two passes are the only way through the middle.
  const angle=r()*Math.PI,dx=Math.cos(angle),dz=Math.sin(angle),off=span(-25,25)*K,ox=-dz*off,oz=dx*off,count=14,passes=[Math.floor(span(2,5)),Math.floor(span(8,12))];
  for(let i=0;i<count;i++){if(passes.some(p=>Math.abs(i-p)<1))continue;const u=(i/(count-1)-.5)*(MAP_SIZE-30);t.hills.push({x:ox+dx*u+span(-4,4),z:oz+dz*u+span(-4,4),r:span(13,16)*K,h:Math.round(span(7,10)),ramp:false});}
  hills(5);if(r()<.5)lakes(1,7,11);
 }
 if(s.type==='wetlands'){lakes(4,7,13);scatter(6,(x,z)=>t.marshes.push({x,z,r:span(16,30)*K,p:r()*6}),10*K,edge-30);hills(2);}
 return t;
}

/** Selects the terrain for a match and resets every cache derived from it. */
export function configureMap(next:MapSpec){
 if(next.type===spec.type&&next.biome===spec.biome&&next.seed===spec.seed)return;
 spec={...next};T=generate(spec);HIGHLANDS=T.hills;lattice.fill(NaN);terrainBlockedCache=undefined;
}

export const coastX=(z:number)=>{const c=T.coast;return c?K*(c.base+Math.sin(z/K*c.f1+c.p1)*c.a1+Math.cos(z/K*c.f2+c.p2)*c.a2):Infinity;};
export const ravineX=(z:number)=>-107*K+Math.sin(z/K*.055)*3;
const inPool=(p:Pool,x:number,z:number,grow=0)=>{const dx=x-p.x,dz=z-p.z,a=Math.atan2(dz,dx);return Math.hypot(dx,dz)<p.r*(1+.16*Math.sin(a*3+p.p)+.08*Math.cos(a*5+p.p*2))+grow;};
function riverDistance(x:number,z:number){const rv=T.river;if(!rv)return Infinity;let best=Infinity;const pts=rv.points;
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],vx=b.x-a.x,vz=b.z-a.z,u=Math.max(0,Math.min(1,((x-a.x)*vx+(z-a.z)*vz)/(vx*vx+vz*vz)));best=Math.min(best,Math.hypot(x-a.x-vx*u,z-a.z-vz*u));}return best;}
export const isFord=(x:number,z:number)=>T.fords.some(f=>Math.hypot(f.x-x,f.z-z)<f.r);
export const isRiver=(x:number,z:number)=>{const rv=T.river;return!!rv&&riverDistance(x,z)<rv.width/2*(1+.22*Math.sin((x+z)*.07+rv.phase));};
export const isWater=(x:number,z:number)=>x>coastX(z)||T.lakes.some(l=>inPool(l,x,z))||isRiver(x,z)&&!isFord(x,z);
/** Marsh is walkable but slow. */
export const isMarsh=(x:number,z:number)=>T.marshes.some(m=>inPool(m,x,z))&&!isWater(x,z);

// Flat settlement basins and high limestone shelves with a broad eastern ramp (ridge hills have none).
export function elevation(x:number,z:number){
 let h=0;for(const hill of T.hills){const dx=x-hill.x,dz=z-hill.z,d=Math.hypot(dx,dz);if(d>hill.r*1.2+20)continue;const a=Math.atan2(dz,dx);const ramp=hill.ramp===false?0:smooth((.7-Math.abs(a))/.4),rim=hill.r*(1+.10*Math.sin(a*3+hill.x*.1)+.055*Math.cos(a*7+hill.z*.2));h=Math.max(h,hill.h*smooth((rim-d)/(3.6+ramp*16)));}
 let ravine=0;if(T.ravine){const ravineEnds=smooth((z/K+100)/14)*smooth((26-z/K)/14);ravine=5.5*ravineEnds*smooth((7-Math.abs(x-ravineX(z)))/3.8);}
 return (h-ravine)*smooth((coastX(z)-x)/8);
}
// Render-side elevation: exact samples on a 0.5-unit lattice, filled on demand, bilinear in between.
// The simulation keeps the exact elevation() so gameplay results do not change.
const LATTICE_STEP=.5,LATTICE_N=MAP_SIZE/LATTICE_STEP+1,lattice=new Float32Array(LATTICE_N*LATTICE_N).fill(NaN);
const latticeAt=(i:number,j:number)=>{const k=j*LATTICE_N+i;let h=lattice[k];if(h!==h)h=lattice[k]=elevation(i*LATTICE_STEP-MAP_HALF,j*LATTICE_STEP-MAP_HALF);return h;};
export function elevationFast(x:number,z:number){const fx=(Math.max(-MAP_HALF,Math.min(MAP_HALF-.001,x))+MAP_HALF)/LATTICE_STEP,fz=(Math.max(-MAP_HALF,Math.min(MAP_HALF-.001,z))+MAP_HALF)/LATTICE_STEP,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;return(latticeAt(i,j)*(1-u)+latticeAt(i+1,j)*u)*(1-v)+(latticeAt(i,j+1)*(1-u)+latticeAt(i+1,j+1)*u)*v;}
export function isCliff(x:number,z:number){return Math.hypot((elevation(x+1,z)-elevation(x-1,z))/2,(elevation(x,z+1)-elevation(x,z-1))/2)>.9;}
// Water and cliff cells never change during a match, so navigation computes them once per map.
let terrainBlockedCache:number[]|undefined;
export function terrainBlockedCells(){if(!terrainBlockedCache){terrainBlockedCache=[];for(let z=0;z<GRID_SIZE;z++)for(let x=0;x<GRID_SIZE;x++){const wx=cellCentre(x),wz=cellCentre(z);if(isWater(wx,wz)||isCliff(wx,wz))terrainBlockedCache.push(gridIndex(x,z));}}return terrainBlockedCache;}
export function flatSite(x:number,z:number,r:number){const heights:number[]=[];for(let dz=-r;dz<=r+.001;dz+=Math.max(.5,r/3))for(let dx=-r;dx<=r+.001;dx+=Math.max(.5,r/3)){if(isWater(x+dx,z+dz)||isCliff(x+dx,z+dz))return false;heights.push(elevation(x+dx,z+dz));}return Math.max(...heights)-Math.min(...heights)<.35;}
/** Nearest dry, non-cliff point within `reach`, searched on growing rings; the input point if none is found. */
export function landNear(x:number,z:number,reach=12){if(!isWater(x,z)&&!isCliff(x,z))return{x,z};for(let r=1.5;r<=reach;r+=1.5)for(let i=0;i<12;i++){const a=i*Math.PI/6,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(Math.abs(px)<MAP_HALF-4&&Math.abs(pz)<MAP_HALF-4&&!isWater(px,pz)&&!isCliff(px,pz))return{x:px,z:pz};}return{x,z};}
