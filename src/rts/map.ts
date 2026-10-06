// One map contract shared by navigation, fog, saves, rendering and camera controls.
export const MAP_SIZE=256;
export const MAP_HALF=MAP_SIZE/2;
export const CELL_SIZE=2;
export const GRID_SIZE=MAP_SIZE/CELL_SIZE;
export const coastX=(z:number)=>83+Math.sin(z*.045)*9+Math.cos(z*.083)*4;
export const isWater=(x:number,z:number)=>x>coastX(z);
export const gridIndex=(x:number,z:number)=>z*GRID_SIZE+x;
export const worldCell=(p:{x:number;z:number})=>({x:Math.floor((p.x+MAP_HALF)/CELL_SIZE),z:Math.floor((p.z+MAP_HALF)/CELL_SIZE)});
export const cellCentre=(x:number)=>x*CELL_SIZE-MAP_HALF+CELL_SIZE/2;

const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export const ravineX=(z:number)=>-107+Math.sin(z*.055)*3;
export const HIGHLANDS=[{x:-54,z:-65,r:10,h:5},{x:49,z:3,r:11,h:5},{x:-82,z:0,r:19,h:7},{x:-8,z:48,r:23,h:9},{x:27,z:-63,r:20,h:8},{x:-47,z:-90,r:17,h:6}];
// Flat settlement basins and high limestone shelves with a broad eastern ramp.
export function elevation(x:number,z:number){
 let h=0;for(const hill of HIGHLANDS){const dx=x-hill.x,dz=z-hill.z,d=Math.hypot(dx,dz),a=Math.atan2(dz,dx);const ramp=smooth((.7-Math.abs(a))/.4),rim=hill.r*(1+.10*Math.sin(a*3+hill.x*.1)+.055*Math.cos(a*7+hill.z*.2));h=Math.max(h,hill.h*smooth((rim-d)/(3.6+ramp*16)));}
 const ravineEnds=smooth((z+100)/14)*smooth((26-z)/14),ravine=5.5*ravineEnds*smooth((7-Math.abs(x-ravineX(z)))/3.8);
 return (h-ravine)*smooth((coastX(z)-x)/8);
}
// Render-side elevation: exact samples on a 0.5-unit lattice, filled on demand, bilinear in between.
// The simulation keeps the exact elevation() so gameplay results do not change.
const LATTICE_STEP=.5,LATTICE_N=MAP_SIZE/LATTICE_STEP+1,lattice=new Float32Array(LATTICE_N*LATTICE_N).fill(NaN);
const latticeAt=(i:number,j:number)=>{const k=j*LATTICE_N+i;let h=lattice[k];if(h!==h)h=lattice[k]=elevation(i*LATTICE_STEP-MAP_HALF,j*LATTICE_STEP-MAP_HALF);return h;};
export function elevationFast(x:number,z:number){const fx=(Math.max(-MAP_HALF,Math.min(MAP_HALF-.001,x))+MAP_HALF)/LATTICE_STEP,fz=(Math.max(-MAP_HALF,Math.min(MAP_HALF-.001,z))+MAP_HALF)/LATTICE_STEP,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;return(latticeAt(i,j)*(1-u)+latticeAt(i+1,j)*u)*(1-v)+(latticeAt(i,j+1)*(1-u)+latticeAt(i+1,j+1)*u)*v;}
export function isCliff(x:number,z:number){return Math.hypot((elevation(x+1,z)-elevation(x-1,z))/2,(elevation(x,z+1)-elevation(x,z-1))/2)>.9;}
export function flatSite(x:number,z:number,r:number){const heights:number[]=[];for(let dz=-r;dz<=r+.001;dz+=Math.max(.5,r/3))for(let dx=-r;dx<=r+.001;dx+=Math.max(.5,r/3)){if(isWater(x+dx,z+dz)||isCliff(x+dx,z+dz))return false;heights.push(elevation(x+dx,z+dz));}return Math.max(...heights)-Math.min(...heights)<.35;}
