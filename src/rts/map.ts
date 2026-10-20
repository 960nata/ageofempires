// One map contract shared by navigation, fog, saves, rendering and camera controls.
// The terrain itself is generated per match by configureMap(); 'borderlands' reproduces the original hand-made map.
// 512 gives six realms room to breathe; render buffers scale down per unit so memory stays below the old 384 map.
export const MAP_SIZE=512;
// Map features are authored on the original 256 map and scaled up; cliff and ravine walls keep their width.
export const MAP_SCALE=MAP_SIZE/256;
export const MAP_HALF=MAP_SIZE/2;
export const CELL_SIZE=2;
export const GRID_SIZE=MAP_SIZE/CELL_SIZE;
export const gridIndex=(x:number,z:number)=>z*GRID_SIZE+x;
export const worldCell=(p:{x:number;z:number})=>({x:Math.floor((p.x+MAP_HALF)/CELL_SIZE),z:Math.floor((p.z+MAP_HALF)/CELL_SIZE)});
export const cellCentre=(x:number)=>x*CELL_SIZE-MAP_HALF+CELL_SIZE/2;

export type MapType='borderlands'|'coastal'|'archipelago'|'lakes'|'river'|'highlands'|'wetlands'|'delta';
export type Biome='temperate'|'arid'|'autumn'|'winter';
/** `realms` (kingdom count) only shapes maps that are built around home sites, such as the archipelago. */
export interface MapSpec {type:MapType;biome:Biome;seed:number;realms?:number;}
export const MAP_TYPES:Record<MapType,string>={borderlands:'Borderlands (classic)',coastal:'Coastal',archipelago:'Archipelago · island chain',lakes:'Lakes',river:'River Valley',highlands:'Highlands',wetlands:'Wetlands · swamp streams',delta:'River Delta · rapids, swamp & deep sea'};
export const BIOMES:Record<Biome,string>={temperate:'Temperate',arid:'Arid',autumn:'Autumn',winter:'Winter'};

type Hill={x:number;z:number;r:number;h:number;ramp?:boolean};
type Pool={x:number;z:number;r:number;p:number};
type Island={x:number;z:number;rx:number;rz:number;phase:number;};
type River={points:{x:number;z:number}[];width:number;phase:number};
type Rock={x:number;z:number;r:number};
interface Terrain {
 coast?:{base:number;a1:number;f1:number;p1:number;a2:number;f2:number;p2:number};
 islands?:Island[];ravine:boolean;hills:Hill[];lakes:Pool[];marshes:Pool[];
 // Rivers share one distance field; rocks are boulders standing in the stream (rapids), fords are shallow crossings.
 rivers:River[];rocks:Rock[];fords:{x:number;z:number;r:number}[];
 homes?:{x:number;z:number}[];
}

const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const K=MAP_SCALE;
// Mulberry32: small, fast and identical on every browser, so a seed always rebuilds the same map.
function seeded(seed:number){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

const BORDERLANDS:Terrain={coast:{base:83,a1:9,f1:.045,p1:0,a2:4,f2:.083,p2:0},ravine:true,lakes:[],marshes:[],fords:[],rivers:[],rocks:[],
 hills:[{x:-54,z:-65,r:10,h:5},{x:49,z:3,r:11,h:5},{x:-82,z:0,r:19,h:7},{x:-8,z:48,r:23,h:9},{x:27,z:-63,r:20,h:8},{x:-47,z:-90,r:17,h:6}].map(h=>({x:h.x*K,z:h.z*K,r:h.r*K,h:h.h}))};

let spec:MapSpec={type:'borderlands',biome:'temperate',seed:42};
let T:Terrain=BORDERLANDS;
/** Live binding for renderers that decorate hill rims. */
export let HIGHLANDS:Hill[]=T.hills;
export const mapSpec=()=>spec;
export const hasSea=()=>!!T.coast||!!T.islands;
/** Boulders standing in rivers, for rendering. */
export const riverRocks=()=>T.rocks;
/** Home islands in fair pick order, when the map is built around them. */
export const homeIslands=()=>T.homes;
export const hasRavine=()=>T.ravine;
export const mapLakes=()=>T.lakes;

function generate(s:MapSpec):Terrain{
 if(s.type==='borderlands')return BORDERLANDS;
 const r=seeded(s.seed*7919+s.type.length*131),span=(a:number,b:number)=>a+r()*(b-a),edge=MAP_HALF-24;
 const t:Terrain={ravine:false,hills:[],lakes:[],marshes:[],fords:[],rivers:[],rocks:[]};
 const clear=(x:number,z:number,gap:number)=>t.hills.every(h=>Math.hypot(h.x-x,h.z-z)>h.r+gap)&&t.lakes.every(l=>Math.hypot(l.x-x,l.z-z)>l.r+gap);
 const scatter=(n:number,make:(x:number,z:number)=>void,gap:number,limit=edge-20)=>{for(let i=0,tries=0;i<n&&tries<n*40;tries++){const x=span(-limit,limit),z=span(-limit,limit);if(!clear(x,z,gap))continue;make(x,z);i++;}};
 const hills=(n:number)=>scatter(n,(x,z)=>t.hills.push({x,z,r:span(10,22)*K,h:Math.round(span(5,9))}),30*K);
 const lakes=(n:number,min:number,max:number)=>scatter(n,(x,z)=>t.lakes.push({x,z,r:span(min,max)*K,p:r()*6}),26*K,edge-40);
 if(s.type==='coastal'){t.coast={base:span(70,92),a1:span(5,14),f1:span(.03,.06),p1:r()*6,a2:span(2,6),f2:span(.07,.11),p2:r()*6};hills(4);if(r()<.6)lakes(1,8,13);}
 if(s.type==='archipelago'){
  // Roomy, irregular home islands keep settlements buildable while narrow channels
  // and smaller outer islets make scouting and transport ships useful. Five or six realms get a 3×2 island grid.
  const six=(s.realms??2)>4;
  const homes=six?[{x:-88,z:-70},{x:88,z:70},{x:88,z:-70},{x:-88,z:70},{x:0,z:-78},{x:0,z:78}]:[{x:-82,z:-70},{x:82,z:70},{x:82,z:-70},{x:-82,z:70}];
  const [rx,rz]=six?[40,50]:[70,60];
  t.islands=homes.map(h=>({x:h.x*K,z:h.z*K,rx:rx*K,rz:rz*K,phase:r()*6}));
  const islets=six?[{x:-44,z:0,rx:16,rz:12},{x:44,z:0,rx:16,rz:12},{x:-145,z:0,rx:14,rz:24},{x:145,z:0,rx:14,rz:24}]:[{x:0,z:0,rx:25,rz:21},{x:-18,z:139,rx:25,rz:18},{x:18,z:-139,rx:25,rz:18},{x:145,z:5,rx:22,rz:30},{x:-145,z:-5,rx:22,rz:30}];
  for(const i of islets)t.islands.push({x:i.x*K,z:i.z*K,rx:i.rx*K,rz:i.rz*K,phase:r()*6});
  t.homes=homes.map(h=>({x:h.x*K,z:h.z*K}));
  // Keep each main island's town footprint and approach clear of steep hill cuts.
  for(let i=0,tries=0;i<12&&tries<480;tries++){const x=span(-edge+20,edge-20),z=span(-edge+20,edge-20);if(t.homes.some(h=>Math.hypot(h.x-x,h.z-z)<46*K)||!clear(x,z,30*K))continue;t.hills.push({x,z,r:span(10,22)*K,h:Math.round(span(5,9))});i++;}
 }
 if(s.type==='lakes'){lakes(5,11,22);hills(2);}
 // A meandering course from a to b. `taper` pins both ends (tributaries meeting a river or the sea).
 const meander=(a:{x:number;z:number},b:{x:number;z:number},amp:number,phase:number,taper=false)=>{const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,points:{x:number;z:number}[]=[];
  for(let i=0;i<=16;i++){const q=i/16,envelope=taper?Math.sin(q*Math.PI)**.6:1,drift=amp*envelope*(Math.sin(q*Math.PI*2+phase)*.64+.24*Math.sin(q*Math.PI*4-phase*.7)+.10*Math.sin(q*Math.PI*6+phase*.4));points.push({x:a.x+dx*q+nx*drift,z:a.z+dz*q+nz*drift});}return points;};
 const along=(rv:River,q:number)=>{const f=q*(rv.points.length-1),i=Math.min(rv.points.length-2,Math.floor(f)),u=f-i,a=rv.points[i],b=rv.points[i+1];return{x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,tx:(b.x-a.x),tz:(b.z-a.z)};};
 const ford=(rv:River,q:number,r=6.5)=>{const p=along(rv,q);t.fords.push({x:p.x,z:p.z,r});};
 // Rapids: a run of boulders across the stream with channels left between them, so small boats can still thread through.
 const rapids=(rv:River,q:number,count:number)=>{for(let k=0;k<count;k++){const p=along(rv,q+(k-count/2)*.006),length=Math.hypot(p.tx,p.tz)||1,nx=-p.tz/length,nz=p.tx/length,side=(r()*2-1)*rv.width*.36,x=p.x+nx*side,z=p.z+nz*side;if(t.fords.some(f=>Math.hypot(f.x-x,f.z-z)<f.r+3))continue;t.rocks.push({x,z,r:span(.8,1.5)});}};
 if(s.type==='river'){
  // Broad, seeded S-bend with softly changing banks instead of a jagged random walk.
  // The same curve drives ground, water, collision and ford placement. A tributary joins from one side.
  const vertical=r()<.5,phase=r()*Math.PI*2,amp=span(34,49)*K,offset=span(-10,10)*K,end=MAP_HALF+12;
  const a=vertical?{x:offset,z:-end}:{x:-end,z:offset},b=vertical?{x:offset,z:end}:{x:end,z:offset};
  const main:River={points:meander(a,b,amp,phase),width:span(8,11),phase:r()*6};t.rivers.push(main);
  const join=along(main,span(.35,.65)),side=r()<.5?-1:1,source=vertical?{x:side*end,z:join.z+span(-80,80)*K}:{x:join.x+span(-80,80)*K,z:side*end};
  const tributary:River={points:meander(source,join,span(14,22)*K,r()*6,true),width:span(5,6.5),phase:r()*6};t.rivers.push(tributary);
  for(const q of [.16,.38,.62,.85])ford(main,q);ford(tributary,.45,5.5);
  rapids(main,.27,9);rapids(main,.73,8);rapids(tributary,.25,5);
  hills(4);scatter(2,(x,z)=>t.marshes.push({x,z,r:span(12,18)*K,p:r()*6}),20*K,edge-30);
 }
 if(s.type==='highlands'){
  // A ridge of steep hills across the map; two passes are the only way through the middle.
  const angle=r()*Math.PI,dx=Math.cos(angle),dz=Math.sin(angle),off=span(-25,25)*K,ox=-dz*off,oz=dx*off,count=14,passes=[Math.floor(span(2,5)),Math.floor(span(8,12))];
  for(let i=0;i<count;i++){if(passes.some(p=>Math.abs(i-p)<1))continue;const u=(i/(count-1)-.5)*(MAP_SIZE-30);t.hills.push({x:ox+dx*u+span(-4,4),z:oz+dz*u+span(-4,4),r:span(13,16)*K,h:Math.round(span(7,10)),ramp:false});}
  hills(5);if(r()<.5)lakes(1,7,11);
 }
 if(s.type==='wetlands'){lakes(4,7,13);scatter(8,(x,z)=>t.marshes.push({x,z,r:span(16,30)*K,p:r()*6}),10*K,edge-30);hills(2);
  // A slow, narrow stream winds through the swamp with several shallow crossings.
  const vertical=r()<.5,end=MAP_HALF+12,o=span(-40,40)*K,stream:River={points:meander(vertical?{x:o,z:-end}:{x:-end,z:o},vertical?{x:-o,z:end}:{x:end,z:-o},span(40,60)*K,r()*6),width:span(5,6.5),phase:r()*6};
  t.rivers.push(stream);for(const q of [.12,.3,.5,.7,.88])ford(stream,q,5.5);
  for(let i=0;i<5;i++){const p=along(stream,span(.1,.9));t.marshes.push({x:p.x,z:p.z,r:span(14,24)*K,p:r()*6});}
 }
 if(s.type==='delta'){
  // Sea to the east with a deep offshore shelf; a river runs down from the western hills,
  // breaks over rapids, then fans into swampy channels before reaching the coast.
  t.coast={base:span(84,96),a1:span(4,9),f1:span(.03,.05),p1:r()*6,a2:span(2,4),f2:span(.07,.1),p2:r()*6};
  const c=t.coast,shoreAt=(z:number)=>K*(c.base+Math.sin(z/K*c.f1+c.p1)*c.a1+Math.cos(z/K*c.f2+c.p2)*c.a2);
  const mouthZ=span(-40,40)*K,mouthX=shoreAt(mouthZ)+14;
  const main:River={points:meander({x:-MAP_HALF-12,z:span(-60,60)*K},{x:mouthX,z:mouthZ},span(26,38)*K,r()*6),width:span(9,11),phase:r()*6};t.rivers.push(main);
  const split=along(main,.62);
  for(const dz of [-1,1]){const tz=mouthZ+dz*span(34,48)*K,target={x:shoreAt(tz)+12,z:tz};t.rivers.push({points:meander(split,target,span(10,16)*K,r()*6,true),width:span(5.5,7),phase:r()*6});}
  for(const q of [.14,.34,.5])ford(main,q);ford(t.rivers[1],.5,5);ford(t.rivers[2],.5,5);
  rapids(main,.24,10);rapids(main,.42,7);
  // Swamp between the distributaries and along the coast.
  for(let i=0,tries=0;i<7&&tries<120;tries++){const x=split.x+span(-10,90)*K*.5,z=split.z+span(-70,70)*K*.6;if(Math.abs(x)>edge-20||Math.abs(z)>edge-20)continue;t.marshes.push({x,z,r:span(14,26)*K,p:r()*6});i++;}
  hills(3);if(r()<.6)lakes(1,7,10);
 }
 return t;
}

/** Selects the terrain for a match and resets every cache derived from it. */
export function configureMap(next:MapSpec){
 if(next.type===spec.type&&next.biome===spec.biome&&next.seed===spec.seed&&(next.realms??2)===(spec.realms??2))return;
 spec={...next};T=generate(spec);HIGHLANDS=T.hills;lattice.fill(NaN);terrainBlockedCache=undefined;regionCache=undefined;
}

export const coastX=(z:number)=>{const c=T.coast;return c?K*(c.base+Math.sin(z/K*c.f1+c.p1)*c.a1+Math.cos(z/K*c.f2+c.p2)*c.a2):Infinity;};
export const ravineX=(z:number)=>-107*K+Math.sin(z/K*.055)*3;
const inPool=(p:Pool,x:number,z:number,grow=0)=>{const dx=x-p.x,dz=z-p.z,a=Math.atan2(dz,dx);return Math.hypot(dx,dz)<p.r*(1+.16*Math.sin(a*3+p.p)+.08*Math.cos(a*5+p.p*2))+grow;};
function islandRadius(i:Island,x:number,z:number){const dx=(x-i.x)/i.rx,dz=(z-i.z)/i.rz,a=Math.atan2(dz,dx),rough=1+.045*Math.sin(a*3+i.phase)+.025*Math.cos(a*7-i.phase*.7)+.012*Math.sin(a*11+i.phase*1.3);return Math.hypot(dx,dz)/rough;}
const onIsland=(x:number,z:number)=>!!T.islands?.some(i=>islandRadius(i,x,z)<1);
/** Dry shoreline edge, shared by vegetation, beach rocks and surf decoration. */
export const isShore=(x:number,z:number)=>!isWater(x,z)&&([[-2.8,0],[2.8,0],[0,-2.8],[0,2.8]] as const).some(([dx,dz])=>isWater(x+dx,z+dz));
// Nearest river, the distance to its centreline, and where along it the point lies (segment index + fraction).
function nearestRiver(x:number,z:number){let best=Infinity,river:River|undefined,segment=0,fraction=0;
 for(const rv of T.rivers){const pts=rv.points;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],vx=b.x-a.x,vz=b.z-a.z,u=Math.max(0,Math.min(1,((x-a.x)*vx+(z-a.z)*vz)/(vx*vx+vz*vz))),d=Math.hypot(x-a.x-vx*u,z-a.z-vz*u);if(d<best){best=d;river=rv;segment=i;fraction=u;}}}
 return{distance:best,river,segment,fraction};}
export const isFord=(x:number,z:number)=>T.fords.some(f=>Math.hypot(f.x-x,f.z-z)<f.r);
export const isRiverRock=(x:number,z:number)=>T.rocks.some(k=>Math.hypot(k.x-x,k.z-z)<k.r);
export const isRiver=(x:number,z:number)=>{if(!T.rivers.length)return false;const {distance,river}=nearestRiver(x,z);return!!river&&distance<river.width/2*(1+.22*Math.sin((x+z)*.07+river.phase))&&!isRiverRock(x,z);};
/** Water current at a point: river tangents (faster over rapids), a longshore current with an offshore stream,
 *  and a slow circulation around archipelago channels. Ships sail faster with it and slower against it. */
export function waterFlow(x:number,z:number){
 if(T.rivers.length&&isRiver(x,z)){
  const {river,segment,fraction}=nearestRiver(x,z),points=river!.points;
  const tangent=(i:number)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z);return {x:(b.x-a.x)/length,z:(b.z-a.z)/length};};
  const a=tangent(segment),b=tangent(segment+1),rapid=T.rocks.some(k=>Math.hypot(k.x-x,k.z-z)<9)?1.7:1,strength=.48*rapid*(river!.width<7?.75:1);
  return {x:(a.x+(b.x-a.x)*fraction)*strength,z:(a.z+(b.z-a.z)*fraction)*strength};
 }
 if(T.coast&&x>coastX(z)){const offshore=x-coastX(z),stream=smooth((offshore-18)/16)*smooth((95-offshore)/30),swirl=Math.sin(z*.021+x*.013);
  return {x:.07*swirl,z:.14+.42*stream+.06*Math.sin(x*.05)};}
 if(T.islands){const r=Math.hypot(x,z)||1;return {x:-z/r*.22+.05*Math.sin(z*.03),z:x/r*.22+.05*Math.cos(x*.03)};}
 return {x:.05,z:.025};
}
/** Rough open-water depth class: 0 shallow shelf, 1 deep sea. Rendering and wildlife use it; navigation does not. */
export function seaDepth(x:number,z:number){
 if(T.coast&&x>coastX(z))return smooth((x-coastX(z)-14)/46);
 if(T.islands){const radial=Math.min(...T.islands.map(i=>islandRadius(i,x,z)));return smooth((radial-1.12)/.7);}
 return 0;
}
export const isWater=(x:number,z:number)=>T.islands?(!onIsland(x,z)||T.lakes.some(l=>inPool(l,x,z))||isRiver(x,z)&&!isFord(x,z)):x>coastX(z)||T.lakes.some(l=>inPool(l,x,z))||isRiver(x,z)&&!isFord(x,z);
/** Marsh is walkable but slow. */
export const isMarsh=(x:number,z:number)=>T.marshes.some(m=>inPool(m,x,z))&&!isWater(x,z);
/** Standing swamp water inside a marsh: still walkable, but knee deep and slower than the marsh itself. */
export const isSwamp=(x:number,z:number)=>{if(!T.marshes.some(m=>inPool(m,x,z,-3)))return false;const n=Math.sin(x*.21+z*.07)*Math.cos(z*.19-x*.11)+.5*Math.sin((x+z)*.33+1.7);return n>.45&&!isWater(x,z);};

// Flat settlement basins and high limestone shelves with a broad eastern ramp (ridge hills have none).
export function elevation(x:number,z:number){
 let h=0;for(const hill of T.hills){const dx=x-hill.x,dz=z-hill.z,d=Math.hypot(dx,dz);if(d>hill.r*1.2+20)continue;const a=Math.atan2(dz,dx);const ramp=hill.ramp===false?0:smooth((.7-Math.abs(a))/.4),rim=hill.r*(1+.10*Math.sin(a*3+hill.x*.1)+.055*Math.cos(a*7+hill.z*.2));h=Math.max(h,hill.h*smooth((rim-d)/(3.6+ramp*16)));}
 let ravine=0;if(T.ravine){const ravineEnds=smooth((z/K+100)/14)*smooth((26-z/K)/14);ravine=5.5*ravineEnds*smooth((7-Math.abs(x-ravineX(z)))/3.8);}
 if(T.islands){const radial=Math.min(...T.islands.map(i=>islandRadius(i,x,z)));const shelf=1.15*smooth((.99-radial)/.22);return(h+shelf-ravine)*smooth((1.045-radial)/.12);}
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
export function terrainBlockedCells(){if(!terrainBlockedCache){terrainBlockedCache=[];for(let z=0;z<GRID_SIZE;z++)for(let x=0;x<GRID_SIZE;x++){const wx=cellCentre(x),wz=cellCentre(z);if(isWater(wx,wz)||isCliff(wx,wz)||isRiverRock(wx,wz))terrainBlockedCache.push(gridIndex(x,z));}}return terrainBlockedCache;}
/** Connected land regions of the static terrain (4-neighbour flood fill); -1 on water, cliffs and rocks.
 *  Two points in different regions can never be joined by a land path, so searches can skip them up front. */
let regionCache:Int32Array|undefined;
export function landRegions(){if(regionCache)return regionCache;const region=new Int32Array(GRID_SIZE*GRID_SIZE).fill(0);for(const i of terrainBlockedCells())region[i]=-1;
 let next=1;const stack:number[]=[];for(let start=0;start<region.length;start++){if(region[start]!==0)continue;region[start]=next;stack.push(start);
  while(stack.length){const k=stack.pop()!,x=k%GRID_SIZE,z=(k-x)/GRID_SIZE;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=GRID_SIZE||nz>=GRID_SIZE)continue;const n=nz*GRID_SIZE+nx;if(region[n]===0){region[n]=next;stack.push(n);}}}next++;}
 return regionCache=region;}
export function flatSite(x:number,z:number,r:number){const heights:number[]=[];for(let dz=-r;dz<=r+.001;dz+=Math.max(.5,r/3))for(let dx=-r;dx<=r+.001;dx+=Math.max(.5,r/3)){if(isWater(x+dx,z+dz)||isCliff(x+dx,z+dz))return false;heights.push(elevation(x+dx,z+dz));}return Math.max(...heights)-Math.min(...heights)<.35;}
/** Nearest dry, non-cliff point within `reach`, searched on growing rings; the input point if none is found. */
export function landNear(x:number,z:number,reach=12){if(!isWater(x,z)&&!isCliff(x,z))return{x,z};for(let r=1.5;r<=reach;r+=1.5)for(let i=0;i<12;i++){const a=i*Math.PI/6,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(Math.abs(px)<MAP_HALF-4&&Math.abs(pz)<MAP_HALF-4&&!isWater(px,pz)&&!isCliff(px,pz))return{x:px,z:pz};}return{x,z};}
