import {MAP_HALF,isWater,isRiver,isShore,mapSpec,waterFlow,riverRocks} from './map';
import {drawCurrent} from './marine-life';
import {unitCycle} from './marine-motion';
type Point={x:number;z:number};
type Screen={x:number;y:number};
type SeaSite=Point&{depth:number;seed:number;river:boolean;rapid:boolean;flow:Point};
type ShoreSite={land:Point;water:Point;nx:number;nz:number;seed:number};
const BUCKETS=5;

/** Animated water surface: travelling swell, glints, river currents, rolling surf and shoreline reeds. */
export class WaterEffects {
 private signature='';
 private sea:SeaSite[]=[];
 private surf:ShoreSite[]=[];
 private reeds:ShoreSite[]=[];
 private coast:{land:Point;water:Point}[]=[];
 private coastKey='';
 private low=false;
 quality(quality:string){this.low=quality==='low';}

 /** Coarse land/water pairs along every coastline; beach rocks and props are placed on these. */
 shoreSites(){const key=JSON.stringify(mapSpec());if(key!==this.coastKey){this.coastKey=key;this.coast=[];for(let z=-MAP_HALF+5;z<MAP_HALF-5;z+=5)for(let x=-MAP_HALF+5;x<MAP_HALF-5;x+=5){if(!isShore(x,z))continue;const dir=[{x:1,z:0},{x:-1,z:0},{x:0,z:1},{x:0,z:-1}].find(d=>isWater(x+d.x*4,z+d.z*4));if(dir)this.coast.push({land:{x,z},water:{x:x+dir.x*2.5,z:z+dir.z*2.5}});}}return this.coast;}
 /** Open-water sites away from the shore, for leaping fish and breaching whales. */
 openWater(minDepth=.6){this.rebuild();return this.sea.filter(s=>!s.river&&s.depth>=minDepth);}

 private rebuild(){
  const signature=JSON.stringify(mapSpec());if(signature===this.signature)return;
  this.signature=signature;this.sea=[];this.surf=[];this.reeds=[];
  const hash=(x:number,z:number)=>{const v=Math.sin(x*127.1+z*311.7)*43758.5453;return v-Math.floor(v);};
  for(let z=-MAP_HALF+2;z<MAP_HALF-2;z+=3.2)for(let x=-MAP_HALF+2;x<MAP_HALF-2;x+=3.2){
   const jx=x+(hash(x,z)-.5)*1.6,jz=z+(hash(z,x)-.5)*1.6;if(!isWater(jx,jz))continue;
   // Rough distance to the shore: how far the water reaches in eight directions.
   let reach=0;for(const r of [4,8,14])if([0,1,2,3,4,5,6,7].every(k=>isWater(jx+Math.cos(k*Math.PI/4)*r,jz+Math.sin(k*Math.PI/4)*r)))reach=r;
   const rapid=riverRocks().some(k=>Math.hypot(k.x-jx,k.z-jz)<7);this.sea.push({x:jx,z:jz,depth:reach/14,seed:hash(jx,jz),river:isRiver(jx,jz),rapid,flow:waterFlow(jx,jz)});
  }
  const {biome}=mapSpec(),taken=new Set<string>();
  for(let z=-MAP_HALF+2;z<MAP_HALF-2;z+=1.8)for(let x=-MAP_HALF+2;x<MAP_HALF-2;x+=1.8){
   if(!isShore(x,z))continue;
   let nx=0,nz=0;for(let k=0;k<8;k++){const a=k*Math.PI/4,dx=Math.cos(a),dz=Math.sin(a);if(isWater(x+dx*3,z+dz*3)){nx+=dx;nz+=dz;}}
   const length=Math.hypot(nx,nz);if(length<.01)continue;nx/=length;nz/=length;
   // Walk along the normal to the exact waterline so the surf breaks on the visible edge.
   let lo=0,hi=3.2;if(!isWater(x+nx*hi,z+nz*hi))continue;for(let k=0;k<7;k++){const mid=(lo+hi)/2;if(isWater(x+nx*mid,z+nz*mid))hi=mid;else lo=mid;}
   const ex=x+nx*hi,ez=z+nz*hi,key=Math.round(ex/1.7)+','+Math.round(ez/1.7);if(taken.has(key))continue;taken.add(key);
   const site={land:{x:ex-nx*.45,z:ez-nz*.45},water:{x:ex+nx*2.4,z:ez+nz*2.4},nx,nz,seed:hash(ex,ez)};
   this.surf.push(site);
   if(biome!=='winter'&&biome!=='arid'&&site.seed<.22)this.reeds.push({...site,land:{x:ex-nx*1.1,z:ez-nz*1.1}});
  }
 }

 draw(c:CanvasRenderingContext2D,time:number,scale:number,width:number,height:number,project:(p:Point)=>Screen){
  this.rebuild();
  const margin=scale*3,visible=(p:Screen)=>p.x>-margin&&p.x<width+margin&&p.y>-margin&&p.y<height+margin;
  const {biome}=mapSpec(),winter=biome==='winter';
  const crest=winter?'232,242,246':'205,236,238',glint=winter?'255,255,255':'236,250,248';
  // Swell travels diagonally across the whole sea; each site lights up as a crest passes.
  const swell:Path2D[]=Array.from({length:BUCKETS},()=>new Path2D()),glints=new Path2D();
  const half=scale*.95,lift=scale*.16;
  for(let i=0;i<this.sea.length;i++){
   const s=this.sea[i];if(this.low&&i%2)continue;
   const p=project(s);if(!visible(p))continue;
   if(s.river){
    // Rapids churn white and fast between the boulders; calm reaches carry slow streaks.
    const flow=s.flow,phase=unitCycle(time/(s.rapid?2.2:5)+s.seed*3),age=(phase-.5)*6;
    const q={x:s.x+flow.x*age,z:s.z+flow.z*age};if(isWater(q.x,q.z))drawCurrent(c,project(q),{x:flow.x-flow.z,y:(flow.x+flow.z)*.5},scale,phase,s.rapid?.7:.32);
    if(s.rapid){const foam=unitCycle(time*.9+s.seed*7),r=scale*(.25+foam*.5);c.save();c.strokeStyle=`rgba(244,250,248,${(.55*(1-foam)).toFixed(3)})`;c.lineWidth=Math.max(.8,scale*.07);c.beginPath();c.ellipse(p.x,p.y,r,r*.45,0,0,Math.PI*2);c.stroke();c.restore();}
    continue;
   }
   // Open-sea currents: sparse streaks drifting with the longshore stream, strongest offshore.
   if(s.seed<.16&&s.depth>.3){const flow=s.flow,speed=Math.hypot(flow.x,flow.z);if(speed>.12){const phase=unitCycle(time/6+s.seed*5),age=(phase-.5)*8,q={x:s.x+flow.x*age,z:s.z+flow.z*age};if(isWater(q.x,q.z))drawCurrent(c,project(q),{x:flow.x-flow.z,y:(flow.x+flow.z)*.5},scale,phase,Math.min(.45,speed*.8));}}
   const wave=Math.sin((s.x*.62+s.z*.38)*.42-time*1.15+s.seed*1.4)*.5+.5,strength=wave**4*(.35+.65*Math.min(1,s.depth+.25));
   const bucket=Math.min(BUCKETS-1,Math.floor(strength*BUCKETS));
   if(strength>.12){const path=swell[bucket],w=half*(.7+s.seed*.6),bob=Math.sin(time*1.6+s.seed*9)*scale*.05;path.moveTo(p.x-w,p.y+bob);path.quadraticCurveTo(p.x,p.y-lift+bob,p.x+w,p.y+bob*.6);}
   // Brief sun glints, a few at a time.
   const g=unitCycle(time*.33+s.seed*17);if(g<.06&&s.depth>.2){const k=Math.sin(g/.06*Math.PI),r=scale*.22*k;glints.moveTo(p.x-r,p.y);glints.lineTo(p.x+r,p.y);glints.moveTo(p.x,p.y-r*.45);glints.lineTo(p.x,p.y+r*.45);}
  }
  c.save();c.lineCap='round';c.lineWidth=Math.max(.9,scale*.075);
  for(let b=0;b<BUCKETS;b++){c.strokeStyle=`rgba(${crest},${(.06+b*.09).toFixed(3)})`;c.stroke(swell[b]);}
  c.strokeStyle=`rgba(${glint},.75)`;c.lineWidth=Math.max(.6,scale*.03);c.stroke(glints);
  // Surf: each wave rolls from the water onto the beach, then the foam line fades back.
  const foam:Path2D[]=Array.from({length:BUCKETS},()=>new Path2D()),edge=new Path2D();
  for(let i=0;i<this.surf.length;i++){
   const s=this.surf[i];if(this.low&&i%2)continue;
   const land=project(s.land);if(!visible(land))continue;
   const water=project(s.water);
   const dx=land.x-water.x,dy=land.y-water.y,length=Math.hypot(dx,dy)||1,tx=-dy/length*scale*.95,ty=dx/length*scale*.95;
   // Neighbouring sites share the same waves, so the surf arrives as a line rather than as dots; two fronts per cycle.
   const base=time/5.2+(s.land.x*.011+s.land.z*.017)+s.seed*.06;
   for(const offset of [0,.5]){
    const phase=unitCycle(base+offset),roll=phase<.7?phase/.7:1,ease=1-(1-roll)**2;
    const x=water.x+dx*ease,y=water.y+dy*ease;
    const alpha=(phase<.7?.3+.7*Math.sin(roll*Math.PI*.5):1-(phase-.7)/.3)*(offset?.6:.95);
    const bucket=Math.min(BUCKETS-1,Math.floor(alpha*BUCKETS));
    if(alpha>.08){const path=foam[bucket];path.moveTo(x-tx,y-ty);path.quadraticCurveTo(x+dx/length*scale*.18,y+dy/length*scale*.18,x+tx,y+ty);}
   }
   // The wet edge on the sand brightens as each wave reaches it.
   const ex=land.x+(water.x-land.x)*.16,ey=land.y+(water.y-land.y)*.16;edge.moveTo(ex-tx*.85,ey-ty*.85);edge.lineTo(ex+tx*.85,ey+ty*.85);
  }
  c.lineWidth=Math.max(1.2,scale*.12);
  for(let b=0;b<BUCKETS;b++){c.strokeStyle=`rgba(${winter?'246,250,252':'240,248,240'},${(.08+b*.11).toFixed(3)})`;c.stroke(foam[b]);}
  c.lineWidth=Math.max(.9,scale*.08);c.strokeStyle=`rgba(${crest},${(.3+.12*Math.sin(time*1.2)).toFixed(3)})`;c.stroke(edge);
  c.restore();
  // Reeds sway on the wetter, milder shorelines.
  if(this.reeds.length){c.save();c.lineWidth=Math.max(.6,scale*.04);c.lineCap='round';
   const stems=[new Path2D(),new Path2D()],heads=new Path2D(),autumn=biome==='autumn';
   for(const s of this.reeds){const q=project(s.land);if(!visible(q))continue;
    for(let stem=0;stem<3;stem++){const sway=Math.sin(time*1.3+s.seed*20+stem)*scale*.06,dx=(stem-1)*scale*.11,h=scale*(.5+((s.seed*10+stem)%4)*.13),path=stems[stem%2];path.moveTo(q.x+dx,q.y);path.quadraticCurveTo(q.x+dx+sway,q.y-h*.6,q.x+dx+sway*2,q.y-h);if(stem!==1)heads.rect(q.x+dx+sway*2-scale*.035,q.y-h,scale*.07,Math.max(1.5,scale*.17));}}
   c.strokeStyle=autumn?'#8d7a45':'#667349';c.stroke(stems[0]);c.strokeStyle=autumn?'#a68c4c':'#85925a';c.stroke(stems[1]);c.fillStyle='#665039';c.fill(heads);c.restore();}
 }
}
