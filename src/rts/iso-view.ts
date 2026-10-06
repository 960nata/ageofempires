import {SceneArt} from './scene-art';
import {ConstructionFrames,CONSTRUCTION_FRAME_COUNT} from './construction-frames';
import {TreeFallSprites} from './tree-fall-sprites';
import {fieldPlots,harvestedPlots,TREE_FALL_SECONDS,isField} from './field-layout';
import {mountedArt} from './mounted-art';
import {WalkingSprites} from './walking-sprites';
import {VillagerSprites} from './villager-sprites';
import {paintGround,terrainPattern} from './ground-materials';
import {CombatSprites} from './combat-sprites';
import {TerrainSurface} from './terrain-surface';
import {MAP_HALF,MAP_SIZE,GRID_SIZE,worldCell,gridIndex,coastX,elevation,HIGHLANDS,isCliff,isWater,ravineX} from './map';
import {BUILDINGS,UNITS} from './data';
import {World,type Entity,type Point} from './world';

interface Sprite {image:HTMLImageElement;sx:number;sy:number;sw:number;sh:number;width:number;height:number;anchor:number;anchorX?:number;flip?:boolean;}
interface Motion {x:number;z:number;phase:number;direction:number;speed:number;heading:number;}
interface Hit {entity:Entity;x:number;y:number;width:number;height:number;sprite:Sprite;constructionFrame?:HTMLCanvasElement;}
class Focus {x=-52;y=0;z=-34;set(x:number,y:number,z:number){this.x=x;this.y=y;this.z=z;}}
export class Battlefield {
 world:World;canvas=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private width=800;private height=600;private ratio=1;private shadows=true;
 focus=new Focus();distance=48;selected=new Set<number>();placement={visible:false,x:0,z:0,radius:3,valid:true,def:"",facing:0};private hits:Hit[]=[];
 private scene=new SceneArt();private construction=new ConstructionFrames();private treeFall=new TreeFallSprites();private wilds:{x:number;z:number;index:number;width:number}[]=[];private damageCache=new Map<string,HTMLCanvasElement>();private rocks:{x:number;z:number;index:number;width:number}[]=[];private walking=new WalkingSprites();private villagers=new VillagerSprites();private groundImage=new Image();private previousPositions=new Map<number,Point>();private interpolation=1;private visualTime=0;
 private rotors=new Map<number,{angle:number;speed:number;time:number}>();
 private combat=new CombatSprites();roadPreview:{from:Point;to:Point;kind?:string}|null=null;private institutionsImage=new Image();private surface=new TerrainSurface();private productionImage=new Image();private workImage=new Image();private resourceImage=new Image();private siegeImage=new Image();private worldImage=new Image();private unitImage=new Image();private loading:Promise<void>;private peopleImage=new Image();private persianImage=new Image();private mountedImage=new Image();private frameBounds=new Map<string,{x:number;y:number;w:number;h:number}>();private motion=new Map<number,Motion>();private alphaData=new Map<HTMLImageElement,{width:number;data:Uint8ClampedArray}>();private fogClock=1;private terrain=document.createElement('canvas');
 constructor(host:HTMLElement,world:World){this.world=world;host.append(this.canvas);this.canvas.setAttribute('aria-label','Isometric battlefield');this.ctx=this.canvas.getContext('2d',{alpha:false})!;this.loading=Promise.all([[this.groundImage,'terrain-materials-v1.png'],[this.worldImage,'world-atlas-v1.png'],[this.unitImage,'units-atlas-v1.png'],[this.peopleImage,'people-directions-v2.png'],[this.persianImage,'persian-directions-v2.png'],[this.mountedImage,'mounted-directions-v2.png'],[this.workImage,'worker-actions-v1.png'],[this.resourceImage,'resource-states-v1.png'],[this.siegeImage,'siege-actions-v1.png'],[this.productionImage,'production-atlas-v1.png'],[this.institutionsImage,'institutions-v1.png']].map(([image,file])=>new Promise<void>((resolve,reject)=>{const i=image as HTMLImageElement;i.onload=()=>resolve();i.onerror=()=>reject(Error('Sprite atlas unavailable'));i.src='/assets/isometric/'+file;}))).then(()=>{for(const image of [this.peopleImage,this.persianImage,this.mountedImage])this.measureFrames(image);for(const image of [this.worldImage,this.unitImage])this.readAlpha(image);this.measureGrid(this.workImage,8,[0,258,520,763,982,1254]);this.measureGrid(this.resourceImage,4,[0,255,492,720,1024]);this.measureGrid(this.siegeImage,4,[0,251,514,748,1024]);this.measureGrid(this.productionImage,4,[0,341,678,1024]);this.measureGrid(this.institutionsImage,4,[0,433,887]);this.paintTerrain();});new ResizeObserver(()=>{this.width=host.clientWidth;this.height=host.clientHeight;this.resize();}).observe(host);this.paintTerrain();}
 private resize(){this.canvas.width=Math.round(this.width*this.ratio);this.canvas.height=Math.round(this.height*this.ratio);this.canvas.style.width=this.width+'px';this.canvas.style.height=this.height+'px';}
 setQuality(quality:string,shadows:boolean){this.ratio=Math.min(devicePixelRatio,quality==='high'?2:quality==='medium'?1.5:1);this.shadows=shadows;this.resize();}
 setWorld(world:World){this.world=world;this.visualTime=world.time;this.selected.clear();const town=world.alive(0,'building').find(e=>e.def==='town');this.focus.set(town?.x??-52,0,town?.z??-34);this.distance=world.mode==='empires'?42:45;this.motion.clear();this.previousPositions.clear();this.rotors.clear();this.fogClock=1;this.paintTerrain();}
 async preload(progress:(n:number,total:number)=>void){const total=11+this.combat.count+this.walking.count+this.villagers.count+this.scene.count;progress(0,total);await Promise.all([this.loading,this.combat.ready,this.walking.ready,this.villagers.ready,this.scene.ready,this.construction.ready,this.treeFall.ready]);progress(total,total);}
 get scale(){return 10*48/this.distance;}
 positionCamera(){this.focus.x=Math.max(-MAP_HALF+8,Math.min(MAP_HALF-8,this.focus.x));this.focus.z=Math.max(-MAP_HALF+8,Math.min(MAP_HALF-8,this.focus.z));}
 pan(dx:number,dz:number){this.focus.x+=dx*.7+dz;this.focus.z+=-dx*.7+dz;this.positionCamera();}
 zoom(d:number){this.distance=Math.max(25,Math.min(145,this.distance+d));}
 zoomAt(d:number,x:number,y:number){const before=this.groundPoint(x,y);this.zoom(d);const after=this.groundPoint(x,y);this.focus.x+=before.x-after.x;this.focus.z+=before.z-after.z;this.positionCamera();}
 dragCamera(dx:number,dy:number){this.focus.x-=(dx/this.scale+dy/(this.scale*.5))/2;this.focus.z-=(dy/(this.scale*.5)-dx/this.scale)/2;this.positionCamera();}
 private project(p:Point){return{x:this.width/2+((p.x-this.focus.x)-(p.z-this.focus.z))*this.scale,y:this.height*.53+((p.x-this.focus.x)+(p.z-this.focus.z))*this.scale*.5-elevation(p.x,p.z)*this.scale};}
 screenPoint(p:Point){const s=this.project(p),b=this.canvas.getBoundingClientRect();return{x:s.x+b.left,y:s.y+b.top};}
 groundPoint(clientX:number,clientY:number):Point {const b=this.canvas.getBoundingClientRect(),a=(clientX-b.left-this.width/2)/this.scale,v=(clientY-b.top-this.height*.53)/(this.scale*.5);let h=0,p={x:0,z:0};for(let i=0;i<12;i++){p={x:this.focus.x+(a+v)/2+h,z:this.focus.z+(v-a)/2+h};h=h*.4+elevation(p.x,p.z)*.6;}return p;}
 private readAlpha(image:HTMLImageElement){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0);this.alphaData.set(image,{width:image.width,data:c.getImageData(0,0,image.width,image.height).data});}
 pick(clientX:number,clientY:number){const b=this.canvas.getBoundingClientRect(),x=clientX-b.left,y=clientY-b.top;const hit=(h:Hit)=>{if(x<h.x||x>h.x+h.width||y<h.y||y>h.y+h.height)return false;if(h.constructionFrame){const frame=h.constructionFrame,px=Math.min(frame.width-1,Math.max(0,Math.floor((x-h.x)/h.width*frame.width))),py=Math.min(frame.height-1,Math.max(0,Math.floor((y-h.y)/h.height*frame.height)));return frame.getContext('2d')!.getImageData(px,py,1,1).data[3]>50;}const s=h.sprite,data=this.alphaData.get(s.image);if(h.entity.def==='road')return true;const u=(x-h.x)/h.width,v=(y-h.y)/h.height,sx=Math.min(s.image.width-1,Math.floor(s.sx+(s.flip?1-u:u)*s.sw)),sy=Math.min(s.image.height-1,Math.floor(s.sy+v*s.sh));return data?data.data[(sy*data.width+sx)*4+3]>70:this.scene.opaque(s.image,sx,sy)??this.walking.opaque(s.image,sx,sy)??this.villagers.opaque(s.image,sx,sy)??this.combat.opaque(s.image,sx,sy)??true;};for(const h of [...this.hits].reverse())if(h.entity.type==='unit'&&hit(h))return h.entity;for(const h of [...this.hits].reverse())if(hit(h))return h.entity;const ground=this.groundPoint(clientX,clientY);return this.world.entities.find(e=>isField(e.def)&&e.hp>0&&e.progress>=1&&this.world.explored[0].has(gridIndex(worldCell(e).x,worldCell(e).z))&&Math.abs(ground.x-e.x)<=BUILDINGS[e.def].radius&&Math.abs(ground.z-e.z)<=BUILDINGS[e.def].radius);}
 private paintTerrain(){const t=this.terrain;t.width=t.height=2048;const c=t.getContext('2d')!;let seed=847;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const px=(n:number)=>(n+MAP_HALF)*8;
 paintGround(c,this.groundImage);
 const roadTexture=terrainPattern(c,this.groundImage,2,96);
 // Layer translucent local soil over the existing terrain: no opaque circular island.
 for(const tree of this.world.entities){if(tree.resource!=='wood')continue;const x=px(tree.x),y=px(tree.z),pine=tree.z<-45,coastal=tree.x>coastX(tree.z)-19;
  for(let patch=0;patch<4;patch++){const angle=tree.id*2.399+patch*1.9,offset=patch?6+patch*2:0,cx=x+Math.cos(angle)*offset,cy=y+Math.sin(angle)*offset,radius=(patch?15:24)+(tree.id%5)*2;const g=c.createRadialGradient(cx,cy,0,cx,cy,radius);g.addColorStop(0,coastal?'#78644424':pine?'#554c352d':'#4653372c');g.addColorStop(.45,pine?'#64503918':'#55603b18');g.addColorStop(1,'#55603b00');c.fillStyle=g;c.fillRect(cx-radius,cy-radius,radius*2,radius*2);}
  const contact=c.createRadialGradient(x,y,0,x,y,7);contact.addColorStop(0,'#302e2460');contact.addColorStop(1,'#302e2400');c.fillStyle=contact;c.fillRect(x-7,y-7,14,14);
  for(let k=0;k<20;k++){const a=k*2.399+tree.id,rr=3+Math.sqrt((k*13%23)/23)*22,cx=x+Math.cos(a)*rr,cy=y+Math.sin(a)*rr;c.strokeStyle=pine?'#84704c50':k%3?'#8c79524a':'#56633d48';c.lineWidth=pine?.55:.9;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*1.8,cy+Math.sin(a)*1.8);c.stroke();}
 }

 const drawRoad=(a:Point,b:Point,width:number)=>{const route=this.world.path(a,b);if(!route.length)return;const points=[a,...route.filter((_,i)=>i%3===0),route[route.length-1]];for(const [extra,color]of [[12,'#82744712'],[6,'#af98612b'],[0,'#b29b70a0']]as const){c.strokeStyle=extra===0&&roadTexture?roadTexture:color;c.lineWidth=width+extra;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(px(a.x),px(a.z));for(let i=1;i<points.length;i++){const p=points[i],q=points[Math.min(i+1,points.length-1)],wobble=Math.sin(p.x*.48+p.z*.31)*.45;c.quadraticCurveTo(px(p.x+wobble),px(p.z-wobble),px((p.x+q.x)/2),px((p.z+q.z)/2));}c.stroke();}};
 const towns=this.world.entities.filter(e=>e.type==='building'&&e.def==='town');const entrances=towns.map(t=>({x:t.x+6,z:t.z+6}));
 if(entrances.length===2){const waypoints=[entrances[0],{x:-33,z:-12},{x:6,z:5},{x:28,z:10},entrances[1]];for(let i=1;i<waypoints.length;i++)drawRoad(waypoints[i-1],waypoints[i],10);}
 for(const side of [0,1]as const){const buildings=this.world.alive(side,'building'),town=buildings.find(b=>b.def==='town');if(!town)continue;const junctions=[{x:town.x-9,z:town.z-8},{x:town.x+7,z:town.z+7},{x:town.x+15,z:town.z-5}];for(let i=1;i<junctions.length;i++)drawRoad(junctions[i-1],junctions[i],8);for(const b of buildings){if(b.def==='farm')continue;const entrance={x:b.x+BUILDINGS[b.def].radius+1.5,z:b.z+2};const near=[...junctions].sort((a,b)=>Math.hypot(a.x-entrance.x,a.z-entrance.z)-Math.hypot(b.x-entrance.x,b.z-entrance.z))[0];drawRoad(near,entrance,4);const g=c.createRadialGradient(px(b.x),px(b.z),0,px(b.x),px(b.z),(BUILDINGS[b.def].radius+2)*8);g.addColorStop(0,'#95846428');g.addColorStop(1,'#95846400');c.fillStyle=g;c.fillRect(px(b.x)-55,px(b.z)-55,110,110);}}
 // Coast shares the same boundary as the navigation grid.
 for(let z=-MAP_HALF;z<MAP_HALF;z+=.25){const y=px(z),shore=px(coastX(z)),depth=c.createLinearGradient(shore-20,0,shore+180,0);depth.addColorStop(0,'#c9ba8e');depth.addColorStop(.13,'#5caca8');depth.addColorStop(.38,'#258ea6');depth.addColorStop(1,'#123b61');c.fillStyle=depth;c.fillRect(shore-15,y,2048-shore+15,3);}
 for(let i=0;i<4200;i++){const z=r()*MAP_SIZE-MAP_HALF,x=coastX(z)+1+r()*38;if(x>MAP_HALF)continue;c.strokeStyle=i%3?'#b4e4d336':'#16596e45';c.lineWidth=.6;c.beginPath();c.moveTo(px(x),px(z));c.lineTo(px(x)+3+r()*9,px(z)+1);c.stroke();}
 for(let i=0;i<75;i++){const z=42+i*.74,x=coastX(z)-3.5-Math.sin(i*1.7)*1.2;if(this.world.entities.some(e=>e.type==='building'&&Math.hypot(e.x-x,e.z-z)<BUILDINGS[e.def].radius+3))continue;const radius=12+(i%4)*5,g=c.createRadialGradient(px(x),px(z),0,px(x),px(z),radius);g.addColorStop(0,i%3?'#4c513688':'#493c2d99');g.addColorStop(1,'#64734700');c.fillStyle=g;c.fillRect(px(x)-radius,px(z)-radius,radius*2,radius*2);}
 this.surface.rebuild(this.terrain,this.groundImage);
 this.rocks=[];this.wilds=[];
 for(const hill of HIGHLANDS)for(let i=0;i<19;i++){const angle=i*2.399+hill.x,r=hill.r*(.85+(i%4)*.035),x=hill.x+Math.cos(angle)*r,z=hill.z+Math.sin(angle)*r;if(!isCliff(x,z)||this.world.entities.some(e=>e.type==='building'&&Math.hypot(e.x-x,e.z-z)<BUILDINGS[e.def].radius+5))continue;this.rocks.push({x,z,index:8+(i%3),width:4.5+(i%4)*.8});}
 for(let gz=0;gz<50;gz++)for(let gx=0;gx<50;gx++){const x=-118+gx*4.8,z=-118+gz*4.8,seed=Math.abs(Math.sin(gx*127.1+gz*311.7)*43758.5453)%1;if(seed>.24||isWater(x,z)||isCliff(x,z)||Math.hypot(x+52,z+34)<34||Math.hypot(x-52,z-34)<34||this.world.entities.some(e=>e.type==='resource'&&Math.hypot(e.x-x,e.z-z)<3.5)||this.world.entities.some(e=>e.type==='building'&&Math.hypot(e.x-x,e.z-z)<BUILDINGS[e.def].radius+2))continue;this.wilds.push({x:x+(seed-.5)*2.2,z:z+(Math.sin(seed*88)-.5)*2,index:Math.floor(seed*4),width:.68+seed*.38});if(this.wilds.length>=210)break;}
 // Sparse understory uses existing original ground-cover sprites and stable positions.
 const trees=this.world.entities.filter(e=>e.resource==='wood'&&e.amount>0&&e.felledAt===undefined);
 for(const tree of trees){if(tree.id%3!==0)continue;for(let n=0;n<2;n++){const angle=tree.id*2.399+n*2.7,spread=1.25+(tree.id%4)*.28,x=tree.x+Math.cos(angle)*spread,z=tree.z+Math.sin(angle)*spread;if(isWater(x,z)||isCliff(x,z)||this.world.entities.some(e=>e.type==='building'&&e.hp>0&&Math.hypot(e.x-x,e.z-z)<BUILDINGS[e.def].radius+1))continue;this.wilds.push({x,z,index:(tree.id+n)%4,width:.42+(tree.id%4)*.07});}}
 for(let i=0;i<21;i++){const z=-89+i*4.9;for(const side of [-1,1])this.rocks.push({x:ravineX(z)+side*5.5,z,index:side<0?8:9,width:4.3+(i%3)*.3});}
 for(let i=0;i<46;i++){const z=-120+i*5.2,x=coastX(z)+.25+(i%3)*.25;this.rocks.push({x,z,index:i%4,width:2.2+(i%4)*.5});}

 }
 private measureFrames(image:HTMLImageElement){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0);const pixels=c.getImageData(0,0,image.width,image.height).data;this.alphaData.set(image,{width:image.width,data:pixels});
 const bands=image===this.peopleImage?[[22,174],[198,353],[374,530],[559,724],[747,912],[933,1099]]:image===this.persianImage?[[10,171],[174,332],[333,502],[529,678],[700,855],[868,1019],[1034,1198]]:[[26,185],[191,348],[351,514],[526,718],[720,910],[908,1092]];for(let row=0;row<bands.length;row++)for(let col=0;col<8;col++){const x0=Math.floor(col*image.width/8),x1=Math.floor((col+1)*image.width/8),y0=Math.floor(bands[row][0]*image.height/1254),y1=Math.floor(bands[row][1]*image.height/1254);let left=x1,right=x0,top=y1,bottom=y0;for(let y=y0+2;y<y1-2;y++)for(let x=x0+2;x<x1-2;x++)if(pixels[(y*image.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right>left&&bottom>top)this.frameBounds.set(image.src+':'+row+':'+col,{x:left,y:top,w:right-left+1,h:bottom-top+1});}
 }
 private facing(angle:number){const dx=Math.sin(angle),dz=Math.cos(angle);return (Math.round(Math.atan2((dx+dz)*.5,dx-dz)/(Math.PI/4))+8)%8;}
 captureStep(){this.previousPositions.clear();for(const e of this.world.entities)if(e.type==='unit'&&e.hp>0)this.previousPositions.set(e.id,{x:e.x,z:e.z});}
 private updateMotion(e:Entity,dt:number){
  let m=this.motion.get(e.id);if(!m){m={x:e.x,z:e.z,phase:(e.id*.173)%1,direction:this.facing(e.angle),speed:0,heading:this.facing(e.angle)*Math.PI/4};this.motion.set(e.id,m);}
  if(dt<=0)return m;
  if(e.inside&&e.entryPoint){const b=this.world.get(e.inside);if(b){const t=Math.max(0,Math.min(1,(this.visualTime-(e.enteredAt??0))/.65)),to={x:b.x+Math.sin((b.facing??0)*Math.PI/2)*BUILDINGS[b.def].radius*.8,z:b.z+Math.cos((b.facing??0)*Math.PI/2)*BUILDINGS[b.def].radius*.8};m.x=e.entryPoint.x+(to.x-e.entryPoint.x)*t;m.z=e.entryPoint.z+(to.z-e.entryPoint.z)*t;m.direction=this.facing(Math.atan2(to.x-e.entryPoint.x,to.z-e.entryPoint.z));m.speed=2;m.phase+=dt;return m;}}
  const prev=this.previousPositions.get(e.id)??e,blend=this.interpolation;
  const x=prev.x+(e.x-prev.x)*blend,z=prev.z+(e.z-prev.z)*blend,dx=x-m.x,dz=z-m.z,distance=Math.hypot(dx,dz);
  m.x=x;m.z=z;m.speed+=(distance/dt-m.speed)*(1-Math.exp(-dt*16));
  if(UNITS[e.def].role==='worker'){
   const walking=(e.state==='walk'||e.state==='deposit')&&(e.moveSpeed??0)>.05;
   if(walking&&distance>.0005&&distance<8)m.phase+=distance/(UNITS[e.def].stride??2.6);
   // Separation nudges must not rotate a working villager or animate walking in place.
   const vx=Math.sin(e.angle),vz=Math.cos(e.angle),angle=Math.atan2((vx+vz)*.5,vx-vz),delta=Math.atan2(Math.sin(angle-m.heading),Math.cos(angle-m.heading));
   m.heading+=Math.max(-dt*9,Math.min(dt*9,delta));
   const previous=m.direction*Math.PI/4;
   if(Math.abs(Math.atan2(Math.sin(m.heading-previous),Math.cos(m.heading-previous)))>Math.PI/8+.08)m.direction=(Math.round(m.heading/(Math.PI/4))+8)%8;
   if(!walking)m.speed=0;
   return m;
  }
  if(distance>.0005&&distance<8){
   m.phase+=distance/(UNITS[e.def].stride??(UNITS[e.def].mounted?3.8:2.6));
   const angle=Math.atan2((dx+dz)*.5,dx-dz),delta=Math.atan2(Math.sin(angle-m.heading),Math.cos(angle-m.heading));
   m.heading+=Math.max(-dt*9,Math.min(dt*9,delta));
   const previous=m.direction*Math.PI/4;
   if(Math.abs(Math.atan2(Math.sin(m.heading-previous),Math.cos(m.heading-previous)))>Math.PI/8+.08)m.direction=(Math.round(m.heading/(Math.PI/4))+8)%8;
  }else if(['turn','attack','recover','deploy','gather','cultivate','build','repair-tools','waiting-seed','heal'].includes(e.state))m.direction=this.facing(e.angle);
  if(['attack','recover','deploy'].includes(e.state)){m.direction=this.facing(e.angle);m.heading=m.direction*Math.PI/4;}return m;
 }
 private drawFog(dt:number){this.fogClock+=dt;if(this.fogClock>.3){this.fogClock=0;this.surface.updateFog(this.world);}this.surface.draw(this.ctx,this.focus,this.width,this.height,this.scale,true);}
 private measureGrid(image:HTMLImageElement,columns:number,bands:number[]){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0);const data=c.getImageData(0,0,image.width,image.height).data;this.alphaData.set(image,{width:image.width,data});for(let row=0;row<bands.length-1;row++)for(let col=0;col<columns;col++){const x0=Math.floor(col*image.width/columns),x1=Math.floor((col+1)*image.width/columns),y0=bands[row],y1=bands[row+1];let x=x1,y=y1,right=x0,bottom=y0;for(let py=y0;py<y1;py++)for(let px=x0+1;px<x1-1;px++)if(data[(py*image.width+px)*4+3]>100){x=Math.min(x,px);y=Math.min(y,py);right=Math.max(right,px);bottom=Math.max(bottom,py);}if(right>x&&bottom>y)this.frameBounds.set(image.src+':'+row+':'+col,{x,y,w:right-x+1,h:bottom-y+1});}}
 private atlasSprite(image:HTMLImageElement,row:number,col:number,width:number,anchor=.94):Sprite{const rect=this.frameBounds.get(image.src+':'+row+':'+col)??{x:col*image.width/4,y:row*image.height/4,w:image.width/4,h:image.height/4};return{image,sx:rect.x,sy:rect.y,sw:rect.w,sh:rect.h,width,height:width*rect.h/rect.w,anchor};}
 private diamond(p:Point,r:number,color:string,stroke?:string){const c=this.ctx;const points=[{x:p.x-r,z:p.z-r},{x:p.x+r,z:p.z-r},{x:p.x+r,z:p.z+r},{x:p.x-r,z:p.z+r}].map(v=>this.project(v));c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.3;c.stroke();}}
 private sprite(e:Entity):Sprite {
  if(e.type==='unit'){
   const d=UNITS[e.def],m=this.motion.get(e.id),worker=d.role==='worker';const moving=!!m&&m.speed>.16&&(!worker||e.state==='walk'||e.state==='deposit');const frame=moving?Math.floor((m?.phase??0)*4)%4:0,direction=m?.direction??this.facing(e.angle);
   const target=this.world.get(e.order?.target);
   if(worker&&!moving&&['gather','cultivate','build','repair-tools'].includes(e.state)){
    const row=e.state==='build'||e.state==='repair-tools'?3:target?.def==='orchard'?4:e.state==='cultivate'?2:target?.resource==='wood'?0:target?.resource==='gold'||target?.resource==='stone'?1:target?.def==='farm'?2:4;
    const cycle=row===0?1.25:row===1?1.4:1.3,phase=e.state==='build'||e.state==='repair-tools'||e.state==='cultivate'?this.visualTime+e.id*.17:Math.max(0,(e.workPhase??0)+this.visualTime-this.world.time+cycle)%cycle;
    const back=direction>=5&&direction<=7,pose=Math.floor(phase/cycle*4)%4,col=(back?4:0)+pose;
    const femaleAction=this.villagers.action(e.appearance??(e.id%2===0?'female':'male'),row===0?'chop':row===1?'mine':row===2?'farm':row===3?'build':'orchard',direction,pose,this.scale);if(femaleAction)return femaleAction;
    const rect=this.frameBounds.get(this.workImage.src+':'+row+':'+col);if(rect){const pixel=2.65*this.scale/180;return{image:this.workImage,sx:rect.x,sy:rect.y,sw:rect.w,sh:rect.h,width:rect.w*pixel,height:rect.h*pixel,anchor:1,anchorX:((col+.5)*this.workImage.width/8-rect.x)/rect.w,flip:direction>=3&&direction<=5};}
   }
   if(worker){const villager=this.villagers.locomotion(e.appearance??(e.id%2===0?'female':'male'),direction,moving?Math.floor((m?.phase??0)*5)%5:null,this.scale);if(villager)return villager;}
   const attacking=e.lastAttackAt!==undefined&&['attack','recover','deploy'].includes(e.state)&&this.visualTime>=e.lastAttackAt&&this.visualTime-e.lastAttackAt<UNITS[e.def].cooldown;
   const dedicatedMounted=mountedArt(e.def);const unsupportedMounted=d.mounted&&!dedicatedMounted&&d.range>3;
   const combatFamily=dedicatedMounted?dedicatedMounted.attack:e.def==='ram'?'ram':e.def==='mangonel'||e.def==='trebuchet'?'mangonel':e.def==='ballista'?'ballista':d.mounted&&d.range<=3&&!e.def.startsWith('camel')?'horse':!d.mounted&&d.range>3?'archer':d.role==='spear'||this.world.players[e.owner].faction==='persian'?'spear':'sword';
   if(d.siege||attacking&&!moving&&d.role!=='worker'&&!unsupportedMounted){
    const age=this.visualTime-(e.lastAttackAt??-100),pose=attacking&&!moving?this.combat.pose(combatFamily,age):0;
    const attackSprite=this.combat.sprite(combatFamily,direction,pose,this.scale);if(attackSprite)return attackSprite;
   }
   if(d.siege||attacking&&['legionary','centurion','swordsman','heavy'].includes(e.def)){
    const row=d.siege?(e.def==='ram'?0:e.def==='ballista'?2:1):3;
    const age=this.visualTime-(e.lastAttackAt??-100),pose=attacking?(age<.2?0:age<.5?1:age<.8?2:3):0;
    const s=this.atlasSprite(this.siegeImage,row,pose,(d.siege?5.4:3)*this.scale);const pixel=(d.siege?5.4/340:2.65/225)*this.scale;s.width=s.sw*pixel;s.height=s.sh*pixel;s.anchorX=((pose+.5)*this.siegeImage.width/4-s.sx)/s.sw;s.flip=direction>=3&&direction<=5;return s;
   }
   if(dedicatedMounted&&!moving){const rest=this.combat.sprite(dedicatedMounted.attack,direction,0,this.scale);if(rest)return rest;}
   if(!d.siege&&d.role!=='trader'){
    const civilian=['worker','scout','healer'].includes(d.role),persian=this.world.players[e.owner].faction==='persian';
    const family=dedicatedMounted?.walk??(d.mounted?(e.def.startsWith('camel')?'camel':'horse'):civilian?'worker':d.range>3?'archer':d.role==='spear'||persian?'spear':'sword');
    const walk=this.walking.sprite(family,direction,Math.floor((m?.phase??0)*8)%8,this.scale);if(walk)return walk;
   }
   if(!d.siege&&d.role!=='trader'){
    const civilian=d.role==='worker'||d.role==='scout'||d.role==='healer';const ranged=d.range>3;const persian=this.world.players[e.owner].faction==='persian';
    const image=d.mounted?this.mountedImage:ranged||persian&&!civilian?this.persianImage:this.peopleImage;
    const base=d.mounted?(e.def.startsWith('camel')?3:0):image===this.persianImage?(ranged?3:0):(civilian?0:3),row=base+[0,1,2,1][frame];
    const rect=this.frameBounds.get(image.src+':'+row+':'+direction),sw=image.width/8,sh=image.height/8;
    const bounds=rect??{x:direction*sw,y:row*sh,w:sw,h:sh};const nominal=image===this.mountedImage?(base===3?187:160):image===this.persianImage?(base===0?135:153):(base===0?155:164);const target=(d.mounted?3.8:2.65)*this.scale,pixelScale=target/(nominal*image.height/1254);return{image,sx:bounds.x,sy:bounds.y,sw:bounds.w,sh:bounds.h,width:bounds.w*pixelScale,height:bounds.h*pixelScale,anchor:.98,anchorX:((direction+.5)*sw-bounds.x)/bounds.w};
   }
   const row=e.def==='ram'?6:7,edges=[0,.108,.222,.335,.435,.583,.735,.865,1],sw=this.unitImage.width/4,sy=this.unitImage.height*edges[row],sh=this.unitImage.height*(edges[row+1]-edges[row]);const size=4.5*this.scale;
   return{image:this.unitImage,sx:frame*sw,sy,sw,sh,width:size,height:size*sh/sw,anchor:.96,flip:Math.sin(e.angle)-Math.cos(e.angle)<0};
  }
  if(e.type==='building'){
   const fresh=this.scene.building(e.def,e.owner<2&&['persian','ayyubid','steppe'].includes(this.world.players[e.owner].faction),e.facing??0,BUILDINGS[e.def].radius,this.scale,e.visualEra??this.world.players[e.owner]?.era??2);if(fresh)return fresh;
   if(['government','academy','healing','smithy','mill'].includes(e.def)){const persian=e.owner<2&&this.world.players[e.owner].faction==='persian',row=['government','academy'].includes(e.def)?0:1,col=e.def==='government'?(persian?1:0):e.def==='academy'?(persian?3:2):e.def==='healing'?(persian?1:0):e.def==='smithy'?2:3;return this.atlasSprite(this.institutionsImage,row,col,BUILDINGS[e.def].radius*(e.def==='mill'?2.7:3.2)*this.scale,.9);}
   const military=['house','barracks','stable','range'],economy=['siege','lumber','mine','mill'];const regional=e.owner<2&&['persian','ayyubid','steppe'].includes(this.world.players[e.owner].faction);
   if(military.includes(e.def)||economy.includes(e.def)){const row=economy.includes(e.def)?2:regional?1:0,col=economy.includes(e.def)?economy.indexOf(e.def):military.indexOf(e.def);return this.atlasSprite(this.productionImage,row,col,BUILDINGS[e.def].radius*3.2*this.scale,.87);}
  }
  if(e.type==='building'&&isField(e.def))return this.atlasSprite(this.resourceImage,1,0,BUILDINGS[e.def].radius*3.25*this.scale,.82);

  if(e.type==='resource'){
   const ratio=e.amount/(e.initialAmount??Math.max(1,e.amount));
   if(e.resource==='food'){const bush=this.scene.orchard(e.amount<(e.initialAmount??e.amount)*.82,2.55*this.scale,e.facing??e.id%4);if(bush)return bush;return this.atlasSprite(this.resourceImage,0,ratio>.18?2:3,3.8*this.scale);}
   if(e.resource==='gold'||e.resource==='stone'){const ore=this.scene.mineral(e.resource,e.amount,e.initialAmount??e.amount,(ratio<=0?2.1:4.8)*this.scale,e.facing??e.id%4);if(ore)return ore;}
   if(e.resource==='wood'&&e.felledAt!==undefined&&this.visualTime-e.felledAt>=TREE_FALL_SECONDS)return this.atlasSprite(this.resourceImage,0,e.amount>0?1:0,(e.amount>0?6:1.65)*this.scale);
   if(e.resource==='wood'&&e.amount>0){const tree=this.scene.vegetation(e.id,e.x,e.z,this.scale);if(tree)return tree;}
  }
  const persian=e.owner<2&&['persian','ayyubid','steppe'].includes(this.world.players[e.owner].faction);let cell=0,width=0,anchor=.82;
  if(e.type==='resource'){cell=e.resource==='wood'?(e.id%5===0?10:e.id%3===0?9:8):e.resource==='gold'?12:e.resource==='stone'?13:8;width=(e.resource==='wood'?(5.7+(e.id*13%11)*.12):e.resource==='food'?3.3:4.6)*this.scale;anchor=.94;}
  else {const id=e.def;const family=['town','landmark','academy','healing','specialist'].includes(id)?0:id==='keep'||id==='tower'||id==='wall'||id==='gate'||id==='palisade'?3:['barracks','range','stable','camel','siege'].includes(id)?2:1;cell=id==='farm'?11:id==='market'?15:id==='mill'||id==='lumber'||id==='mine'||id==='smithy'?14:family+(persian?4:0);width=(BUILDINGS[id].radius*3.3)*this.scale;if(id==='wall'||id==='palisade')width*=.8;}
  const rects=[[0,0,322,322],[322,0,305,320],[628,0,312,322],[941,0,313,321],[0,322,327,328],[327,325,302,324],[630,330,313,318],[944,322,310,331],[0,653,329,299],[350,658,260,293],[650,656,287,295],[942,653,312,296],[0,954,318,289],[319,954,318,300],[637,954,307,296],[944,954,310,300]];const [x,y,w,h]=rects[cell];const k=this.worldImage.width/1254;return{image:this.worldImage,sx:x*k,sy:y*k,sw:w*k,sh:h*k,width,height:width*h/w*(e.type==='building'?1.14:1),anchor};
 }
 render(dt:number,alpha=1){this.interpolation=Math.max(0,Math.min(1,alpha));if(dt>0)this.visualTime=Math.max(0,this.world.time-.05+this.interpolation*.05);const c=this.ctx;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.clearRect(0,0,this.width,this.height);c.fillStyle='#252e22';c.fillRect(0,0,this.width,this.height);this.surface.draw(c,this.focus,this.width,this.height,this.scale);
  this.drawWater();this.drawFog(dt);this.hits=[];for(const road of this.world.entities)if(road.def==='road'&&road.hp>0&&this.world.explored[0].has(gridIndex(worldCell(road).x,worldCell(road).z)))this.drawRoad(road);const liveUnits=new Set<number>();for(const e of this.world.entities)if(e.type==='unit'&&e.hp>0){liveUnits.add(e.id);this.updateMotion(e,dt);}for(const id of this.motion.keys())if(!liveUnits.has(id))this.motion.delete(id);
  const visibleEntities=this.world.entities.filter(e=>e.def!=='road'&&(!e.inside||this.visualTime-(e.enteredAt??-10)<.65)&&(e.hp>0||e.type==='building'&&e.destroyedAt!==undefined)&&(e.owner===0||e.type==='resource'||e.type==='building'?this.world.explored[0].has(gridIndex(worldCell(e).x,worldCell(e).z)):this.world.canSee(0,e))).sort((a,b)=>{const ap=a.type==='unit'?(this.motion.get(a.id)??a):a,bp=b.type==='unit'?(this.motion.get(b.id)??b):b;return ap.x+ap.z-bp.x-bp.z||Number(a.type==='unit')-Number(b.type==='unit')||a.id-b.id;});
  for(const field of visibleEntities)if(isField(field.def)&&field.hp>0)this.drawFieldGround(field);
  const entities=(visibleEntities.flatMap(e=>isField(e.def)&&e.progress>=1?fieldPlots(e).filter(q=>e.def==='orchard'||q.index>=harvestedPlots(e)).map(plot=>({...e,...plot,type:'resource' as const,def:'__field-plot',id:-e.id*1000-plot.index,plot:true,field:e})): [e])).sort((a,b)=>a.x+a.z-b.x-b.z||Number(a.type==='unit')-Number(b.type==='unit')||a.id-b.id);
  const rocks=this.rocks.filter(r=>this.world.explored[0].has(gridIndex(worldCell(r).x,worldCell(r).z))).sort((a,b)=>a.x+a.z-b.x-b.z);let rockIndex=0;
  const paintRock=(r:typeof rocks[number])=>{const s=this.scene.sprite('rock-formations-v1',r.index,r.width*this.scale,.83);if(!s)return;const p=this.project(r);if(p.x+s.width<0||p.x-s.width>this.width||p.y+s.height<0||p.y-s.height>this.height)return;c.save();if(!this.world.canSee(0,r))c.globalAlpha=.5;c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,p.x-s.width/2,p.y-s.height*s.anchor,s.width,s.height);c.restore();};
  const occupiedGround=this.world.entities.filter(e=>e.type==='building'&&e.hp>0);const wilds=this.wilds.filter(w=>!occupiedGround.some(b=>Math.hypot(b.x-w.x,b.z-w.z)<BUILDINGS[b.def].radius+.4)&&this.world.explored[0].has(gridIndex(worldCell(w).x,worldCell(w).z))).sort((a,b)=>a.x+a.z-b.x-b.z);let wildIndex=0;const paintWild=(w:typeof wilds[number])=>{const s=this.scene.wildgrass(w.index,w.width*this.scale);if(!s)return;const p=this.project(w);if(p.x+s.width<0||p.x-s.width>this.width||p.y+s.height<0||p.y-this.height>s.height)return;c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,p.x-s.width/2,p.y-s.height,s.width,s.height);};
  for(const e of entities){while(wildIndex<wilds.length&&wilds[wildIndex].x+wilds[wildIndex].z<e.x+e.z)paintWild(wilds[wildIndex++]);while(rockIndex<rocks.length&&rocks[rockIndex].x+rocks[rockIndex].z<e.x+e.z)paintRock(rocks[rockIndex++]);const p=this.project(e.type==='unit'?(this.motion.get(e.id)??e):e);
   if(e.def==='__field-plot'){const field=(e as Entity&{field:Entity}).field,orchard=field.def==='orchard',picked=e.amount<(e.initialAmount??(orchard?420:360))*(orchard?.82:.98);let plant:Sprite|null;
    if(orchard)plant=this.scene.orchard(picked,(1.55)*this.scale,e.facing??0);
    else{const growth=Math.max(0,Math.min(1,field.growth??1)),stage=growth<.22?0:growth<.62?1:growth<1?2:3;plant=this.atlasSprite(this.resourceImage,1,stage,(.98+(Math.abs(e.id)%3)*.035)*this.scale,1);if(plant){const variation=.94+(Math.abs(e.id)%7)*.02;plant.height=(.12+1.42*Math.pow(growth,.8))*this.scale*variation;plant.anchor=1;}}

    if(plant){c.drawImage(plant.image,plant.sx,plant.sy,plant.sw,plant.sh,p.x-plant.width/2,p.y-plant.height*plant.anchor,plant.width,plant.height);}continue;
   }
   const s=this.sprite(e);if(!s.image.complete||!s.image.naturalWidth)continue;if(p.x+s.width<0||p.x-s.width>this.width||p.y+s.height<0||p.y-s.height>this.height)continue;
   if(e.hp<=0){this.drawCollapse(e,p,s);continue;}
   if(e.type==='building'&&!isField(e.def))this.drawFooting(e,p,s);
   const x=p.x-s.width*(s.anchorX??.5),y=p.y-s.height*s.anchor;if(this.selected.has(e.id)){c.beginPath();c.ellipse(p.x,p.y,Math.max(7,this.world.footprint(e)*this.scale*1.1),Math.max(3,this.world.footprint(e)*this.scale*.5),0,0,Math.PI*2);c.strokeStyle='#f9e2a1';c.lineWidth=1.8;c.stroke();}
   c.save();
   const fallingWood=e.type==='resource'&&e.resource==='wood'&&e.felledAt!==undefined&&e.amount>0?Math.max(0,Math.min(1,(this.visualTime-e.felledAt)/TREE_FALL_SECONDS)):-1;
   const clipBox=fallingWood>=0?{x:p.x-4.6*this.scale,y:p.y-7*this.scale,width:9.2*this.scale,height:8*this.scale}:{x,y,width:s.width,height:s.height};
   this.surface.clipObject(c,this.focus,this.width,this.height,this.scale,clipBox,e.x+e.z-elevation(e.x,e.z)*2+(e.type==='building'?BUILDINGS[e.def].radius: this.world.footprint(e)),p.y,elevation(e.x,e.z));
   if(e.inside)c.globalAlpha=Math.max(0,Math.min(1,1-(this.visualTime-(e.enteredAt??0))/.65));
   
   if(e.type==='resource'&&e.resource==='wood'&&e.felledAt===undefined&&(e.chopProgress??0)>0){const lean=Math.min(.12,(e.chopProgress??0)/7.5*.12),sway=Math.sin(this.visualTime*17+e.id)*.022;c.translate(p.x,p.y);c.rotate(-lean+sway);c.translate(-p.x,-p.y);}if(s.flip){c.translate(p.x*2,0);c.scale(-1,1);}if(this.shadows&&e.type==='unit'){c.fillStyle='#18201333';c.beginPath();c.ellipse(p.x,p.y-1,s.width*.22,s.width*.085,0,0,Math.PI*2);c.fill();}
   let constructionFrame:HTMLCanvasElement|undefined;
   if(fallingWood>=0&&fallingWood<1){const fallen=this.treeFall.sprite(this.scene.vegetationFamily(e.id,e.x,e.z),fallingWood,this.scale);if(fallen){const direction=e.fallAngle??(e.id%2?Math.PI/3:-Math.PI/3),screenAngle=Math.atan2(Math.sin(direction)+Math.cos(direction),Math.sin(direction)-Math.cos(direction)),root=this.treeFall.rootFraction(fallingWood);c.save();c.translate(p.x,p.y);c.rotate(screenAngle);c.globalAlpha=1;c.drawImage(fallen.image,fallen.sx,fallen.sy,fallen.sw,fallen.sh,-fallen.width*root,-fallen.height*.94,fallen.width,fallen.height);c.restore();}else c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,x,y,s.width,s.height);}
   else if(e.type==='building'&&!isField(e.def)&&e.progress<1){const age=e.visualEra??this.world.players[e.owner]?.era??0,phase=Math.max(0,Math.min(CONSTRUCTION_FRAME_COUNT-.0001,e.progress*CONSTRUCTION_FRAME_COUNT)),index=Math.floor(phase),blend=phase-index,frame=this.construction.frame(s,age,index,false,e.def);constructionFrame=frame;c.drawImage(frame,x,y,s.width,s.height);if(blend>.001&&index<CONSTRUCTION_FRAME_COUNT-1){c.globalAlpha*=blend;c.drawImage(this.construction.frame(s,age,index+1,false,e.def),x,y,s.width,s.height);}}else if(e.type==='building'&&e.hp<e.maxHp*.75){const damage=this.damagedSprite(s,e.hp/e.maxHp);c.drawImage(damage,x,y,s.width,s.height);}else c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,x,y,s.width,s.height);if(e.type==='resource'&&e.resource==='wood'&&e.felledAt===undefined&&(e.chopProgress??0)>0)this.drawChopMark(e,p,s);c.restore();
   if(!e.inside)this.hits.push({entity:e,x:s.flip?2*p.x-x-s.width:x,y,width:s.width,height:s.height,sprite:s,constructionFrame});this.drawActivity(e,p,s);if(e.type==='building')this.drawProduction(e,p,s);
   if(this.selected.has(e.id)||e.hp<e.maxHp){const width=e.type==='building'?46:24;c.fillStyle='#161811';c.fillRect(p.x-width/2,y-7,width,4);c.fillStyle=e.owner===0?'#7dd269':'#d97459';c.fillRect(p.x-width/2+1,y-6,(width-2)*e.hp/e.maxHp,2);}
   if(e.type==='building'&&e.progress<1){c.fillStyle='#d9bb76';c.fillRect(x+s.width*.2,p.y+6,s.width*.6*e.progress,3);}if(e.type==='unit'&&Object.values(e.cargo).some(v=>v>0)){c.fillStyle='#ceaa62';c.fillRect(p.x+5,p.y-s.height*.45,4,4);}
  }
  while(rockIndex<rocks.length)paintRock(rocks[rockIndex++]);while(wildIndex<wilds.length)paintWild(wilds[wildIndex++]);
  for(const shot of this.world.shots){
   const progress=Math.max(0,Math.min(1,1-(shot.remaining+Math.max(0,this.world.time-this.visualTime))/shot.duration));
   const wp={x:shot.from.x+(shot.to.x-shot.from.x)*progress,z:shot.from.z+(shot.to.z-shot.from.z)*progress};if(!this.world.canSee(0,wp))continue;
   const from=this.project(shot.from),to=this.project(shot.to);from.y-=(shot.launchHeight??1.5)*this.scale;to.y-=(shot.targetHeight??1)*this.scale;
   const arc=this.scale*(shot.splash?6:1.8),p={x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress-Math.sin(progress*Math.PI)*arc};
   const angle=Math.atan2(to.y-from.y-Math.cos(progress*Math.PI)*arc*Math.PI,to.x-from.x);
   if(shot.fire){for(let i=4;i>=0;i--){c.fillStyle=i%2?'#ed6229b0':'#efb44aac';c.beginPath();c.arc(p.x-Math.cos(angle)*i*2,p.y-Math.sin(angle)*i*2,2+i*.5,0,Math.PI*2);c.fill();}}
   c.fillStyle=shot.fire?'#ffdf72':shot.splash?'#675e4c':'#e5d4a4';if(shot.splash){c.beginPath();c.arc(p.x,p.y,3.5,0,Math.PI*2);c.fill();}else{c.save();c.translate(p.x,p.y);c.rotate(angle);c.strokeStyle='#b8a078';c.lineWidth=1.2;c.beginPath();c.moveTo(-6,0);c.lineTo(3,0);c.stroke();c.fillStyle='#e4d5b7';c.beginPath();c.moveTo(5,0);c.lineTo(1,-2);c.lineTo(1,2);c.closePath();c.fill();c.restore();}
  }

  for(const effect of this.world.effects){if(!this.world.canSee(0,effect))continue;const t=this.visualTime-effect.at;if(t<0)continue;const p=this.project(effect);for(let i=0;i<9;i++){const a=i*2.4,r=t*23;c.fillStyle=effect.fire?'#eb9d4599':'#b5a38780';c.globalAlpha=Math.max(0,1-t/1.2);c.beginPath();c.arc(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.4-t*12,2+t*3,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
  if(this.roadPreview?.kind&&['wall','palisade'].includes(this.roadPreview.kind)){for(const site of this.world.wallSites(this.roadPreview.from,this.roadPreview.to)){const valid=this.world.existingWall(this.roadPreview.kind,site)||this.world.validPlacement(this.roadPreview.kind,site);this.diamond(site,1.1,valid?'#d8c59555':'#d2564f66',valid?'#ffe2aa':'#f07060');}}
  if(this.roadPreview){const route=this.roadPreview,sites=route.kind&&['wall','palisade'].includes(route.kind)?this.world.wallSites(route.from,route.to):[route.from,route.to];const a=this.project(sites[0]),b=this.project(sites[sites.length-1]);c.save();c.strokeStyle='#f2d89a';c.setLineDash([5,5]);c.lineWidth=3;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore();}
  if(this.placement.visible){const site=this.placement;this.diamond(site,site.radius,site.valid?'#a5cf7033':'#cd654c66',site.valid?'#d6e6a5':'#ef9682');const ghost=this.scene.building(site.def,this.world.players[0].faction==='persian',site.facing,site.radius,this.scale,this.world.players[0].era),p=this.project(site);if(ghost){c.save();c.globalAlpha=site.valid?.65:.3;c.drawImage(ghost.image,ghost.sx,ghost.sy,ghost.sw,ghost.sh,p.x-ghost.width/2,p.y-ghost.height*ghost.anchor,ghost.width,ghost.height);c.restore();const a=site.facing*Math.PI/2,q=this.project({x:site.x+Math.sin(a)*(site.radius+2),z:site.z+Math.cos(a)*(site.radius+2)});c.strokeStyle='#ffe3a0';c.lineWidth=3;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();c.fillStyle='#ffe3a0';c.beginPath();c.arc(q.x,q.y,4,0,Math.PI*2);c.fill();}}

 }
 private drawFieldGround(e:Entity){const c=this.ctx,r=BUILDINGS[e.def].radius;for(let edge=4;edge>=0;edge--)this.diamond(e,r+edge*.1,edge?'#7154370a':'#71543755');for(let row=-r+.25;row<r;row+=.47){const a=this.project({x:e.x-r+.15,z:e.z+row}),b=this.project({x:e.x+r-.15,z:e.z+row});c.strokeStyle='#44392755';c.lineWidth=Math.max(.7,this.scale*.075);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}if(this.selected.has(e.id))this.diamond(e,r,'#dabc7211','#f9e2a1');}
 private drawFooting(e:Entity,p:{x:number;y:number},_s:Sprite){
  const c=this.ctx,r=BUILDINGS[e.def].radius*this.scale;
  // Keep the contact shadow within the footprint; wide tinted halos made buildings
  // look pasted onto a different patch of ground, especially on slopes.
  c.save();c.translate(p.x,p.y);c.scale(1,.48);
  const contact=c.createRadialGradient(0,0,r*.28,0,0,r*1.06);
  contact.addColorStop(0,'#20251c49');contact.addColorStop(.72,'#27271d24');contact.addColorStop(1,'#27271d00');
  c.fillStyle=contact;c.fillRect(-r*1.06,-r*1.06,r*2.12,r*2.12);c.restore();
 }

 private damagedSprite(s:Sprite,health:number){const stage=health<.3?3:health<.5?2:1,key=[s.image.src,s.sx,s.sy,stage].join(':');const cached=this.damageCache.get(key);if(cached)return cached;const canvas=document.createElement('canvas');canvas.width=s.sw;canvas.height=s.sh;const c=canvas.getContext('2d')!;c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,0,0,s.sw,s.sh);c.globalCompositeOperation='source-atop';
  c.fillStyle=`rgba(40,28,20,${stage*.075})`;c.fillRect(0,0,s.sw,s.sh);
  for(let i=0;i<stage*4;i++){const x=s.sw*(.2+(i*.193)% .62),y=s.sh*(.34+(i*.127)%.45),r=s.sw*(.05+(i%3)*.02),g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#201b16a0');g.addColorStop(1,'#29231a00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.strokeStyle='#302b22b0';c.lineWidth=1.1;c.beginPath();c.moveTo(x,y-r*.65);for(let j=1;j<5;j++)c.lineTo(x+(j%2?1:-1)*r*.16,y-r*.65+j*r*.32);c.stroke();}
  if(stage===3){c.globalCompositeOperation='destination-out';for(let i=0;i<3;i++){const x=s.sw*(.22+i*.25),y=s.sh*(.2+i*.05),r=s.sw*.045;c.beginPath();for(let j=0;j<9;j++){const a=j*Math.PI*2/9,rr=r*(j%2?.65:1.2);const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;j?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();}}
  this.damageCache.set(key,canvas);return canvas;
 }
 private blit(s:Sprite,p:{x:number;y:number},opacity=1){const c=this.ctx;c.save();c.globalAlpha=opacity;c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,p.x-s.width*(s.anchorX??.5),p.y-s.height*s.anchor,s.width,s.height);c.restore();}
 private drawFire(e:Entity,p:{x:number;y:number},s:Sprite,afterDeath=false){const age=this.visualTime-(e.destroyedAt??this.visualTime),fade=afterDeath?Math.max(0,1-age/9):1,severity=afterDeath?1:1-e.hp/e.maxHp;if(fade<=0)return;
  for(let i=0;i<(severity>.7?3:2);i++){const phase=this.visualTime*7+i*1.31+e.id*.71,part=phase%1,base={x:p.x+(i-1)*s.width*.2,y:p.y-s.height*(afterDeath?.12:.28+(i%2)*.18)},width=s.width*(.12+severity*.06)*(1+Math.sin(this.visualTime*5+i)*.05);
   for(let frame=0;frame<2;frame++){const fire=this.scene.effect(0,Math.floor(phase)+frame,width),smoke=this.scene.effect(1,Math.floor(phase*.6)+frame,width*1.8),alpha=(frame?part:1-part)*fade;if(smoke)this.blit(smoke,{x:base.x+Math.sin(this.visualTime*.6+i)*width*.3,y:base.y-width*.6},alpha*.4);if(fire)this.blit(fire,base,alpha*.9);}
  }
 }
 private drawCollapse(e:Entity,p:{x:number;y:number},s:Sprite){const age=Math.max(0,this.visualTime-(e.destroyedAt??0));if(age>3&&this.world.entities.some(b=>b.type==='building'&&b.hp>0&&Math.hypot(b.x-e.x,b.z-e.z)<BUILDINGS[b.def].radius))return;const persian=e.owner<2&&['persian','ayyubid','steppe'].includes(this.world.players[e.owner].faction),rubble=this.scene.rubble(e.def,persian,s.width);if(rubble)this.blit(rubble,p,Math.min(1,age/.7));
  if(age<2.4){const c=this.ctx,damaged=this.damagedSprite(s,.15),x=p.x-s.width/2,y=p.y-s.height*s.anchor;
   for(let strip=0;strip<6;strip++){const t=Math.max(0,Math.min(1,(age-strip*.09)/1.65));if(t>=1)continue;const sw=s.width/6;c.save();c.beginPath();c.rect(x+strip*sw-sw*.3,y,sw*1.6,s.height+30);c.clip();c.globalAlpha=1-t;c.translate(x+(strip+.5)*sw,p.y);c.rotate((strip%2?1:-1)*t*t*.14);c.drawImage(damaged,-(strip+.5)*sw,y-p.y+t*t*s.height*.7,s.width,s.height);c.restore();}
   const dust=this.scene.effect(2,Math.min(3,Math.floor(age*2)),s.width*(.7+age*.4));if(dust)this.blit(dust,{x:p.x,y:p.y+s.width*.2},Math.sin(Math.min(1,age/2.4)*Math.PI)*.75);
  }this.drawFire(e,p,s,true);
 }
 private drawWater(){const c=this.ctx,t=this.visualTime;c.save();c.lineWidth=Math.max(.6,this.scale*.055);
  for(let i=0;i<16;i++){const z=-112+i*14.3,x=coastX(z)+6+(i%3)*3,phase=(t+i*1.731)%9;if(phase>1.05)continue;const q=this.project({x,z}),u=phase/1.05;if(q.x<0||q.x>this.width||q.y<0||q.y>this.height)continue;const leap=Math.sin(u*Math.PI)*this.scale*.9;c.save();c.translate(q.x+(u-.5)*this.scale*1.7,q.y-leap);c.rotate((u-.5)*1.2);c.fillStyle='#a8c8c8';c.beginPath();c.ellipse(0,0,this.scale*.22,this.scale*.085,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(-this.scale*.17,0);c.lineTo(-this.scale*.32,-this.scale*.1);c.lineTo(-this.scale*.32,this.scale*.1);c.closePath();c.fill();c.restore();c.strokeStyle=`rgba(197,229,224,${.4*(1-u)})`;c.beginPath();c.ellipse(q.x,q.y,2+u*this.scale,.8+u*this.scale*.3,0,0,Math.PI*2);c.stroke();}
  for(let i=0;i<65;i++){const z=42+i*.86,x=coastX(z)-.5-Math.sin(i*1.7)*.5,q=this.project({x,z});if(q.x<0||q.x>this.width||q.y<0||q.y>this.height)continue;for(let stem=0;stem<3;stem++){const sway=Math.sin(t*1.3+i+stem)*this.scale*.05,dx=(stem-1)*this.scale*.1,h=this.scale*(.55+(i+stem)%4*.13);c.strokeStyle=stem%2?'#667349':'#85925a';c.beginPath();c.moveTo(q.x+dx,q.y);c.quadraticCurveTo(q.x+dx+sway,q.y-h*.6,q.x+dx+sway*2,q.y-h);c.stroke();c.fillStyle='#665039';c.fillRect(q.x+dx+sway*2-1,q.y-h,2,Math.max(2,this.scale*.16));}}

  for(let i=0;i<72;i++){const z=-124+i*3.5,phase=(t*.16+i*.618)%1,x=coastX(z)+.8+phase*2.8,p=this.project({x,z});if(p.x<0||p.x>this.width||p.y<0||p.y>this.height)continue;const a=this.project({x:x+.4,z:z-1.2}),b=this.project({x:x-.2,z:z+1.2});c.strokeStyle=`rgba(215,234,210,${Math.sin(phase*Math.PI)*.28})`;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(p.x+.4*this.scale,p.y,b.x,b.y);c.stroke();}
  for(let i=0;i<130;i++){const z=-124+(i*31.37)%248,x=coastX(z)+6+(i*7.71)%32;if(x>MAP_HALF)continue;const p=this.project({x,z});if(p.x<0||p.x>this.width||p.y<0||p.y>this.height)continue;const shine=Math.max(0,Math.sin(t*1.2+i*2.4));c.strokeStyle=`rgba(163,218,228,${shine*.14})`;c.beginPath();c.moveTo(p.x-3,p.y);c.quadraticCurveTo(p.x,p.y-1,p.x+5,p.y);c.stroke();}
  c.restore();
 }
 private drawRoad(e:Entity){const c=this.ctx,p=this.project(e);c.save();c.globalAlpha=e.progress<1?.4:1;this.diamond(e,1.15,'#85755acc');for(let row=-1;row<=1;row++)for(let col=-1;col<=1;col++){const tile={x:e.x+row*.65,z:e.z+col*.65};this.diamond(tile,.28,(row+col+e.id)%2?'#b5aa8d':'#998e76','#746b57');}for(let k=0;k<8;k++){const dx=((e.id*11+k*7)%19-9)*.09,dz=((e.id*3+k*13)%19-9)*.09,q=this.project({x:e.x+dx,z:e.z+dz});c.fillStyle=k%3?'#ceba8a99':'#76674388';c.fillRect(q.x,q.y,2.4,1.2);}if(e.progress<1){c.strokeStyle='#ccb47b';c.setLineDash([2,3]);c.strokeRect(p.x-8,p.y-4,16,8);}c.restore();this.hits.push({entity:e,x:p.x-this.scale*2,y:p.y-this.scale,width:this.scale*4,height:this.scale*2,sprite:{image:this.worldImage,sx:0,sy:0,sw:1,sh:1,width:1,height:1,anchor:1}});}
 private drawProduction(e:Entity,p:{x:number;y:number},s:Sprite){if(e.progress<1)return;const c=this.ctx,t=this.visualTime,busy=(e.processUntil??0)>t,training=!!e.queue[0]?.reserved,working=busy||training||!!e.research;
  const actor=(sprite:Sprite|null,x:number,y:number)=>{if(!sprite||(e.facing??0)>=2)return;c.save();if(sprite.flip){c.translate(x*2,0);c.scale(-1,1);}c.drawImage(sprite.image,sprite.sx,sprite.sy,sprite.sw,sprite.sh,x-sprite.width*(sprite.anchorX??.5),y-sprite.height*sprite.anchor,sprite.width,sprite.height);c.restore();};
  const worker=(row:number,phase:number,x:number,y:number)=>{const col=Math.floor(phase*4)%4,rect=this.frameBounds.get(this.workImage.src+':'+row+':'+col);if(!rect)return;const pixel=2.2*this.scale/180;actor({image:this.workImage,sx:rect.x,sy:rect.y,sw:rect.w,sh:rect.h,width:rect.w*pixel,height:rect.h*pixel,anchor:1,anchorX:((col+.5)*this.workImage.width/8-rect.x)/rect.w},x,y);};
  if(['tower','archer-tower','cannon-tower'].includes(e.def)){
   const roof={x:p.x,y:p.y-s.height*s.anchor*.78},elapsed=t-(e.lastAttackAt??-99),dx=Math.sin(e.angle)-Math.cos(e.angle),dy=(Math.sin(e.angle)+Math.cos(e.angle))*.5;
   if(e.def==='cannon-tower'){const recoil=elapsed<.55?Math.sin(elapsed/.55*Math.PI)*this.scale*.25:0,length=this.scale*1.5-recoil;c.save();c.translate(roof.x,roof.y);c.rotate(Math.atan2(dy,dx));c.fillStyle='#3e4240';c.fillRect(-this.scale*.4,-this.scale*.21,length+this.scale*.4,this.scale*.42);c.strokeStyle='#aaa78e';c.lineWidth=1;c.strokeRect(-this.scale*.4,-this.scale*.21,length+this.scale*.4,this.scale*.42);if(elapsed<.18){c.fillStyle='#ffdca1';c.beginPath();c.ellipse(length+3,0,8,4,0,0,Math.PI*2);c.fill();}c.restore();}
   else{const pose=elapsed<1.3?this.combat.pose('archer',elapsed):0,archer=this.combat.sprite('archer',this.facing(e.angle),pose,this.scale*.72);if(archer){c.save();if(archer.flip){c.translate(roof.x*2,0);c.scale(-1,1);}c.drawImage(archer.image,archer.sx,archer.sy,archer.sw,archer.sh,roof.x-archer.width*(archer.anchorX??.5),roof.y-archer.height*archer.anchor,archer.width,archer.height);c.restore();}}
  }
  if(e.def==='mill'&&(e.facing??0)<2){
   let rotor=this.rotors.get(e.id);if(!rotor){rotor={angle:(e.id*.73)%(Math.PI*2),speed:.45,time:t};this.rotors.set(e.id,rotor);}
   const elapsed=Math.max(0,Math.min(.25,t-rotor.time)),targetSpeed=busy?1.35:.45,decay=Math.exp(-elapsed*2);rotor.angle=(rotor.angle+targetSpeed*elapsed+(rotor.speed-targetSpeed)*(1-decay)/2)%(Math.PI*2);rotor.speed=targetSpeed+(rotor.speed-targetSpeed)*decay;rotor.time=t;
   const x=p.x+s.width*.06,y=p.y-s.height*.48;c.save();c.translate(x,y);c.transform(1,-.1,.18,.85,0,0);c.rotate(rotor.angle);const length=s.width*.37;
   for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);c.strokeStyle='#563f25';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(0,-length);c.stroke();c.fillStyle='#d7c29afa';c.strokeStyle='#7e6540';c.lineWidth=.7;c.beginPath();c.moveTo(1,-length*.32);c.lineTo(length*.21,-length*.27);c.lineTo(length*.21,-length);c.lineTo(1,-length);c.closePath();c.fill();c.stroke();for(let j=1;j<5;j++){c.beginPath();c.moveTo(1,-length*(.28+j*.14));c.lineTo(length*.21,-length*(.28+j*.14));c.stroke();}c.restore();}c.fillStyle='#463626';c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();c.restore();if(busy)worker(2,t/1.3,p.x-s.width*.2,p.y+2);
  }
  if(e.def==='range'&&training){for(let i=0;i<2;i++){const phase=(t+i*.6)%1.7;actor(this.combat.sprite('archer',0,phase<.3?0:phase<.7?1:phase<.95?2:3,this.scale*.82),p.x-s.width*.18+i*10,p.y-2+i*5);if(phase>.7&&phase<1.05){const progress=(phase-.7)/.35;c.strokeStyle='#e0c99a';c.beginPath();c.moveTo(p.x-s.width*.18+progress*s.width*.55,p.y-18+i*5);c.lineTo(p.x-s.width*.18+progress*s.width*.55+7,p.y-18+i*5);c.stroke();}}}
  if(['stable','camel'].includes(e.def)&&training){const trainee=UNITS[e.queue[0].unit],phase=t*(trainee.turnRate? .45:.8),dx=Math.cos(phase)*s.width*.16,dy=Math.sin(phase)*s.width*.055,direction=Math.sin(phase)>0?4:0,family=mountedArt(trainee.id)?.walk??(e.def==='camel'?'camel':'horse');actor(this.walking.sprite(family,direction,Math.floor(t*trainee.speed/(trainee.stride??3.8)*8)%8,this.scale*.82),p.x+dx,p.y-3+dy);}
  if(e.def==='barracks'&&training)actor(this.combat.sprite(e.owner<2&&this.world.players[e.owner].faction==='persian'?'spear':'sword',1,Math.floor(t*3)%4,this.scale*.9),p.x+s.width*.15,p.y);
  if(e.def==='smithy'&&working){worker(3,t/1.1,p.x-s.width*.05,p.y-3);for(let i=0;i<4;i++){const phase=(t*2+i*.23)%1;c.fillStyle='#ffb746';c.fillRect(p.x+s.width*.12+Math.sin(i*2)*phase*12,p.y-s.height*.25-phase*17,1.8,1.8);}c.fillStyle='#ee833a66';c.beginPath();c.ellipse(p.x+s.width*.2,p.y-s.height*.35,7,9+Math.sin(t*9)*2,0,0,Math.PI*2);c.fill();}
  if(e.def==='mine'&&busy){worker(1,t/1.4,p.x-s.width*.2,p.y+1);const x=p.x+Math.sin(t*1.5)*s.width*.14;c.fillStyle='#715033';c.fillRect(x-5,p.y-7,11,6);c.strokeStyle='#242721';c.lineWidth=1.5;for(const dx of [-3,4]){c.beginPath();c.arc(x+dx,p.y,2.5,0,Math.PI*2);c.stroke();}}
  if(e.def==='lumber'&&busy)worker(0,t/1.25,p.x-s.width*.1,p.y);
  if(e.def==='siege'&&training)worker(3,t,p.x+s.width*.16,p.y-2);
  if(e.research||training){const progress=e.research?.progress??e.queue[0].progress;c.fillStyle='#29291ce0';c.fillRect(p.x-20,p.y+7,40,3);c.fillStyle='#d4b76f';c.fillRect(p.x-20,p.y+7,40*Math.min(1,progress),3);}
 }
 private drawBuildImpact(e:Entity,p:{x:number;y:number},s:Sprite){
  const builders=this.world.entities.filter(u=>u.type==='unit'&&u.hp>0&&u.owner===e.owner&&u.state==='build'&&u.order?.target===e.id).slice(0,3);
  if(!builders.length)return;
  const c=this.ctx;
  for(const worker of builders){
   // The worker action atlas uses four poses over the same 1.3-second cycle.
   const phase=((this.visualTime+worker.id*.17)/1.3)%1;
   if(phase<.5||phase>.75)continue;
   const pulse=1-Math.abs(phase-.625)/.125;
   const point=this.project(this.motion.get(worker.id)??worker);
   const x=point.x+(p.x-point.x)*.32,y=Math.min(point.y-this.scale*.85,p.y-s.height*s.anchor*.28);
   c.save();c.globalAlpha=.3+.7*pulse;c.strokeStyle='#ffe6ad';c.lineWidth=Math.max(1,this.scale*.06);
   c.beginPath();c.moveTo(x-3-pulse*2,y);c.lineTo(x-1,y);c.moveTo(x+1,y);c.lineTo(x+3+pulse*2,y);c.moveTo(x,y-3-pulse*2);c.lineTo(x,y-1);c.stroke();
   c.fillStyle='#ffcf79';c.beginPath();c.arc(x,y,1+pulse*1.3,0,Math.PI*2);c.fill();c.restore();
  }
 }
 private drawChopMark(e:Entity,p:{x:number;y:number},s:Sprite){const c=this.ctx,progress=Math.min(1,(e.chopProgress??0)/7.5),side=Math.sin(e.fallAngle??0)-Math.cos(e.fallAngle??0)<0?-1:1,x=p.x+side*s.width*.025,y=p.y-Math.min(s.height*.13,this.scale*.9),width=Math.max(2,this.scale*(.08+.15*progress));
  c.save();c.fillStyle='#2a1d14df';c.beginPath();c.moveTo(x-side*width*.5,y-width*.65);c.lineTo(x+side*width*.7,y);c.lineTo(x-side*width*.5,y+width*.65);c.closePath();c.fill();c.fillStyle='#e3ba7bdb';c.beginPath();c.moveTo(x-side*width*.3,y-width*.36);c.lineTo(x+side*width*.45,y);c.lineTo(x-side*width*.3,y+width*.36);c.closePath();c.fill();
  const age=this.visualTime-e.lastHit;if(age>=0&&age<.42){for(let i=0;i<7;i++){const a=i*2.399+e.id*.31,burst=age*(12+i*3)*this.scale*.1;c.fillStyle=i%2?'#d9ad70':'#8a6038';c.save();c.translate(x+Math.cos(a)*burst,y+Math.sin(a)*burst-age*age*this.scale*2);c.rotate(a);c.fillRect(0,0,Math.max(1,this.scale*.07),Math.max(.7,this.scale*.025));c.restore();}}c.restore();}
 private drawActivity(e:Entity,p:{x:number;y:number},s:Sprite){const c=this.ctx;
  if(e.type==='building'){
   if(e.garrison.length){c.fillStyle='#162119df';c.fillRect(p.x-15,p.y-s.height*.7,30,14);c.fillStyle='#ead49a';c.font='10px system-ui';c.textAlign='center';c.fillText('♟ '+e.garrison.length,p.x,p.y-s.height*.7+10);}
   if(isField(e.def)&&(e.growth??1)<1){c.fillStyle='#2b291bd0';c.fillRect(p.x-17,p.y+6,34,3);c.fillStyle='#a5c767';c.fillRect(p.x-17,p.y+6,34*(e.growth??1),3);}
   if(e.progress<1||e.renovation||e.research?.id==='fortify'||this.visualTime-(e.workedAt??-99)<1.5){if(e.progress>=1){const progress=e.renovation?.progress??(e.research?.id==='fortify'?e.research.progress:Math.max(0,Math.min(.94,e.hp/e.maxHp))),index=Math.min(15,Math.floor(progress*16)),overlay=this.construction.frame(s,e.visualEra??this.world.players[e.owner]?.era??0,index,true,e.def);c.save();c.globalAlpha=.48;c.drawImage(overlay,p.x-s.width*.5,p.y-s.height*s.anchor,s.width,s.height);c.restore();}this.drawBuildImpact(e,p,s);}
   if(e.progress>=1&&e.hp<e.maxHp*.6)this.drawFire(e,p,s);
  }
  if(e.type==='unit'&&e.state==='gather'){const phase=e.workPhase??0,job=this.world.get(e.order?.target);if(phase<.22&&job){const q=this.project(job);for(let i=0;i<4;i++){c.fillStyle=job.resource==='wood'?'#cda775b0':job.resource==='food'?'#c5b361b0':'#c2bbaaac';const a=i*1.7+e.id;c.fillRect(q.x+Math.cos(a)*phase*42,q.y-4-Math.sin(phase*8)*10+i,2,2);}}}
 }
 minimap(canvas:HTMLCanvasElement){const c=canvas.getContext('2d')!,size=canvas.width;c.drawImage(this.terrain,0,0,size,size);for(let z=0;z<GRID_SIZE;z++)for(let x=0;x<GRID_SIZE;x++){const i=z*GRID_SIZE+x;if(!this.world.visible[0].has(i)){c.fillStyle=this.world.explored[0].has(i)?'#15271c88':'#081009ee';c.fillRect(x/GRID_SIZE*size,z/GRID_SIZE*size,size/GRID_SIZE+1,size/GRID_SIZE+1);}}for(const e of this.world.entities){if(e.hp<=0||e.inside||e.type==='resource'||!this.world.canSee(0,e))continue;c.fillStyle=e.owner===0?'#e3c488':e.owner===1?'#79a6d8':'#ddd3ad';const w=e.def==='road'?1:e.type==='building'?4:2;if(e.def==='road')c.fillStyle='#bba173';c.fillRect((e.x+MAP_HALF)/MAP_SIZE*size-w/2,(e.z+MAP_HALF)/MAP_SIZE*size-w/2,w,w);}// The main camera is isometric; its visible rectangle becomes a diamond here.
 const b=this.canvas.getBoundingClientRect();const corners=[[0,0],[this.width,0],[this.width,this.height],[0,this.height]].map(([x,y])=>this.groundPoint(b.left+x,b.top+y));
 c.save();c.beginPath();c.rect(0,0,size,size);c.clip();c.strokeStyle='#fff0ca';c.fillStyle='#fff0ca0b';c.lineWidth=1;c.beginPath();corners.forEach((p,i)=>{const x=(p.x+MAP_HALF)/MAP_SIZE*size,y=(p.z+MAP_HALF)/MAP_SIZE*size;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.fill();c.stroke();c.restore();}
}
