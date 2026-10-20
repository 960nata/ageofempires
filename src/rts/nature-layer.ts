import {MAP_HALF,isWater,isShore,isMarsh,isCliff,hasSea,mapSpec,worldCell,gridIndex,isRiver,riverRocks} from './map';
import type {Point,World,Entity} from './world';
import {BUILDINGS} from './data';
import {isField} from './field-layout';
import {poses,poseRect} from './pose-sampling';
import type {SceneSprite} from './scene-art';
import {unitCycle,ease} from './marine-motion';
export type WeatherMode='clear'|'rain'|'dry';
type Atlas={file:string;frames:number[][][]};
type Screen={x:number;y:number};
type Prop={x:number;z:number;sheet:string;row:number;col:number;width:number;flip:boolean};
const cellIndex=(p:Point)=>{const c=worldCell(p);return gridIndex(c.x,c.z);};
const hash=(x:number,z:number)=>{const v=Math.sin(x*127.1+z*311.7)*43758.5453;return v-Math.floor(v);};
// Livestock: sheet, row, frames and whether the row is a walk (true) or a grazing loop (false).
const HERDS=[{sheet:'livestock-motion-v1',row:2,walk:false,width:1.7},{sheet:'livestock-motion-v1',row:0,walk:true,width:2.3},{sheet:'livestock-motion-v1',row:1,walk:true,width:1.6},{sheet:'shore-river-props-v1',row:3,walk:true,width:1.6}];

export class NatureLayer {
 private atlases:Record<string,Atlas>={};
 private images=new Map<string,HTMLImageElement>();
 private signature='';private sites:Point[]=[];private deep:Point[]=[];private props:Prop[]=[];
 private budget=8;private low=false;
 weather:WeatherMode='clear';
 readonly ready=fetch(import.meta.env.BASE_URL+'assets/nature/manifest.json').then(r=>{if(!r.ok)throw Error('Nature manifest unavailable');return r.json();}).then((data:Record<string,Atlas>)=>{this.atlases=data;}).catch(()=>{});
 quality(quality:string){this.low=quality==='low';this.budget=this.low?4:8;}
 private image(name:string){let image=this.images.get(name);if(!image&&this.atlases[name]){image=new Image();image.src=import.meta.env.BASE_URL+'assets/nature/'+this.atlases[name].file;this.images.set(name,image);}return image;}
 private sprite(c:CanvasRenderingContext2D,name:string,row:number,frame:number,p:Point,width:number,opacity:number,flip=false,anchorY=.5){
  const image=this.image(name),frames=this.atlases[name]?.frames[row],rect=frames?.[Math.floor(frame)];if(!image?.complete||!image.naturalWidth||!rect||!frames||opacity<=.01)return;
  // One pixel scale for the entire action, rather than stretching every pose to the same width.
  const nominal=Math.max(...frames.map(f=>f[2])),pixel=width/nominal;
  const at=(f:number[])=>poseRect({x:f[0],y:f[1],w:f[2],h:f[3],anchorY});
  const sprite=poses.sample(image,at(rect),at(frames[(Math.floor(frame)+1)%frames.length]),frame-Math.floor(frame),pixel);
  c.save();c.globalAlpha=opacity;if(flip){c.translate(p.x*2,0);c.scale(-1,1);}c.drawImage(sprite.image,sprite.sx,sprite.sy,sprite.sw,sprite.sh,p.x-sprite.width*(sprite.anchorX??.5),p.z-sprite.height*sprite.anchor,sprite.width,sprite.height);c.restore();
 }
 /** A single still cell, anchored near its painted ground line. */
 private still(c:CanvasRenderingContext2D,name:string,row:number,col:number,p:Screen,width:number,flip=false,anchor=.84){
  const image=this.image(name),rect=this.atlases[name]?.frames[row]?.[col];if(!image?.complete||!image.naturalWidth||!rect)return;
  const [x,y,w,h]=rect,height=width*h/w;
  c.save();if(flip){c.translate(p.x*2,0);c.scale(-1,1);}c.drawImage(image,x,y,w,h,p.x-width/2,p.y-height*anchor,width,height);c.restore();
 }
 private ripple(c:CanvasRenderingContext2D,p:{x:number;y:number},scale:number,u:number){c.save();c.strokeStyle=`rgba(198,231,239,${Math.sin(u*Math.PI)*.38})`;c.lineWidth=Math.max(.6,scale*.05);c.beginPath();c.ellipse(p.x,p.y,scale*(.3+u*1.4),scale*(.12+u*.5),0,0,Math.PI*2);c.stroke();c.restore();}

 private rebuild(){
  const spec=mapSpec(),key=JSON.stringify(spec);if(key===this.signature)return;
  this.signature=key;this.sites=[];this.deep=[];this.props=[];
  // Spread candidates across the map instead of filling the first coastline strip.
  for(let i=0;i<512&&this.sites.length<48;i++){const x=-MAP_HALF+16+((i*73+spec.seed*13)%(MAP_HALF*2-32)),z=-MAP_HALF+16+((i*137+spec.seed*7)%(MAP_HALF*2-32));if(isWater(x,z)&&isWater(x+6,z)&&isWater(x-6,z)&&isWater(x,z+6))this.sites.push({x,z});}
  for(const s of this.sites)if([0,1,2,3,4,5,6,7].every(k=>isWater(s.x+Math.cos(k*Math.PI/4)*16,s.z+Math.sin(k*Math.PI/4)*16)))this.deep.push(s);
  const {biome}=spec;
  // Biome shoreline rock beds, boulders and driftwood along every coast, lake and river bank.
  const bed=biome==='winter'?[0,0]:biome==='arid'?[0,2]:biome==='autumn'?[1,0]:spec.type==='wetlands'?[1,1]:[0,1];
  // Biome shoreline rock beds, boulders and driftwood along every coast, lake and river bank, evenly spaced.
  const shoreProps:Point[]=[];
  for(let z=-MAP_HALF+4;z<MAP_HALF-4;z+=2.5)for(let x=-MAP_HALF+4;x<MAP_HALF-4;x+=2.5){
   const h=hash(x,z);if(h>.22||!isShore(x,z)||isCliff(x,z)||shoreProps.some(q=>Math.hypot(q.x-x,q.z-z)<11))continue;shoreProps.push({x,z});
   const kind=hash(z,x);
   // Pebbled river banks with their own shallow water painted in, on rivers and streams (not in snow).
   if(biome!=='winter'&&kind<.55&&[[-3,0],[3,0],[0,-3],[0,3]].some(([dx,dz])=>isRiver(x+dx,z+dz))){this.props.push({x,z,sheet:'shore-river-props-v1',row:0,col:Math.floor(kind*5.4)%3,width:4.2+kind*2,flip:kind<.27});continue;}
   if(kind<.5)this.props.push({x,z,sheet:'biome-rock-shores-v1',row:bed[0],col:bed[1],width:4+kind*3,flip:kind<.25});
   else this.props.push({x,z,sheet:'shore-river-props-v1',row:2,col:biome==='arid'?1:kind<.8?0:2,width:2.3+kind*1.4,flip:kind>.9});
  }
  // Boulders standing in the rapids; the same rocks block boats and troops.
  for(const rock of riverRocks()){const h=hash(rock.x,rock.z);this.props.push({x:rock.x,z:rock.z,sheet:biome==='winter'?'biome-rock-shores-v1':'shore-river-props-v1',row:biome==='winter'?0:2,col:biome==='winter'?0:biome==='arid'?1:0,width:rock.r*(biome==='winter'?2.6:3.1),flip:h<.5});}
  for(let z=-MAP_HALF+6;z<MAP_HALF-6;z+=7)for(let x=-MAP_HALF+6;x<MAP_HALF-6;x+=7){
   const jx=x+(hash(x,z)-.5)*4,jz=z+(hash(z,x)-.5)*4,h=hash(jx,jz);
   if(isShore(jx,jz))continue;
   if(isMarsh(jx,jz)){if(h<.5)this.props.push({x:jx,z:jz,sheet:'shore-river-props-v1',row:1,col:Math.floor(h*8)%4,width:3.4+h*2,flip:h<.25});continue;}
   // Wild grasses and flowers on open ground, away from water and cliffs.
   if(biome==='winter'||h>.075||isWater(jx,jz)||isCliff(jx,jz)||isShore(jx,jz))continue;
   const col=biome==='arid'?0:Math.floor(h/.025)%3;
   this.props.push({x:jx,z:jz,sheet:'tall-trees-gardens-v1',row:1,col,width:col===0?2.1:1.7,flip:h<.035});
  }
 }

 /** Biome trees with their own chopped, falling and felled paintings. Null keeps the shared woodland art. */
 biomeTree(id:number,x:number,z:number,stage:0|1|2|3,scale:number):SceneSprite|null{
  const {biome,type}=mapSpec(),h=hash(id*.37,x+z);
  const row=biome==='winter'?0:biome==='arid'?1:biome==='autumn'?2:type==='wetlands'||type==='delta'?3:-1;
  if(row<0||h>(row===3?.4:.65)||isShore(x,z))return null;
  const image=this.image('biome-trees-lifecycle-v1'),frames=this.atlases['biome-trees-lifecycle-v1']?.frames[row];if(!image?.complete||!image.naturalWidth||!frames)return null;
  // One pixel scale per species, from the standing tree, so the felled log keeps its length.
  const [sx,sy,sw,sh]=frames[stage],pixel=7.4*(1+(id%7-3)*.035)*scale/frames[0][3];
  return {image,sx,sy,sw,sh,width:sw*pixel,height:sh*pixel,anchor:.9,flip:id%2===1};
 }
 private blocked(world:World,p:Point,radius:number){
  for(const e of world.entities){if(e.hp<=0&&e.type!=='resource')continue;if(e.type==='building'){if(Math.hypot(e.x-p.x,e.z-p.z)<BUILDINGS[e.def].radius+radius)return true;}else if(e.type==='resource'&&e.amount>0&&Math.hypot(e.x-p.x,e.z-p.z)<radius+1.2)return true;}
  return false;
 }

 draw(c:CanvasRenderingContext2D,world:World,time:number,scale:number,width:number,height:number,project:(p:Point)=>{x:number;y:number}){
  this.rebuild();
  const inView=(p:Screen,m=100)=>p.x>-m&&p.y>-m&&p.x<width+m&&p.y<height+m;
  // Ground props first: they sit flat under everything else.
  for(const prop of this.props){const p=project(prop);if(!inView(p,prop.width*scale))continue;if(!world.explored[0].has(cellIndex(prop))||this.blocked(world,prop,prop.width*.45))continue;this.still(c,prop.sheet,prop.row,prop.col,p,prop.width*scale,prop.flip);}
  this.drawHerds(c,world,time,scale,project,inView);
  let visible=0;
  const resources=world.entities.filter(e=>e.type==='resource'&&['fish','tuna','whale'].includes(e.def)&&e.amount>0);
  for(let i=0;i<this.sites.length;i++){const site=this.sites[i];if(!world.canSee(0,site)||resources.some(e=>Math.hypot(e.x-site.x,e.z-site.z)<9))continue;const drift=Math.sin(time*.12+i)*1.4;
   const position={x:site.x+drift,z:site.z+Math.cos(time*.12+i)*.65};if(!isWater(position.x,position.z))continue;const p=project(position);if(!inView(p)||visible++>=this.budget)continue;
   const frame=unitCycle(time/5.2+i*.17)*4;
   this.sprite(c,'anchovy-shrimp-motion-v1',i%2,frame,{x:p.x,z:p.y},scale*(i%2?1.2:2.8),.34);
   if(i%5===0)this.sprite(c,'reef-kelp-motion-v1',0,unitCycle(time/8+i*.13)*4,{x:p.x+scale*2,z:p.y+scale},scale*2,.26);
   // An occasional fish clears the surface: rise, arc and splash back in.
   if(i%3===0){const period=13+i%5*2.3,age=unitCycle(time/period+i*.37)*period,duration=1.35;if(age<duration){const u=age/duration,dir=i%2?1:-1;
    this.sprite(c,'aquatic-wildlife-v1',(i>>1)%2,Math.min(3,u*4),{x:p.x+dir*(u-.5)*scale*1.4,z:p.y-Math.sin(u*Math.PI)*scale*.7},scale*1.5,Math.min(1,Math.sin(u*Math.PI)*1.6),dir<0,.75);
    this.ripple(c,p,scale,Math.min(1,u*1.2));}}
  }
  // A whale surfaces now and then in deep water: blow, roll and fluke.
  if(!this.low&&hasSea()&&this.deep.length){const period=42,cycle=Math.floor(time/period),age=time-cycle*period,duration=6.5;if(age<duration){const site=this.deep[cycle%this.deep.length];if(world.canSee(0,site)){const p=project(site);if(inView(p)){const u=age/duration,fade=ease(u/.12)*ease((1-u)/.15);
   this.sprite(c,'aquatic-wildlife-v1',2,Math.min(3.999,u*4),{x:p.x+(u-.5)*scale*2.5,z:p.y},scale*5,fade*.95,false,.72);this.ripple(c,p,scale*2.4,unitCycle(u*2));}}}}
 }
 /** Sheep, cattle, goats and pigs graze around working farms. */
 private drawHerds(c:CanvasRenderingContext2D,world:World,time:number,scale:number,project:(p:Point)=>Screen,inView:(p:Screen,m?:number)=>boolean){
  if(mapSpec().biome==='winter'&&this.low)return;
  let drawn=0;const limit=this.low?6:18;
  for(const farm of world.entities){
   if(farm.type!=='building'||(!isField(farm.def)&&farm.def!=='ranch')||farm.hp<=0||farm.progress<1||drawn>=limit)continue;
   const ranch=farm.def==='ranch',count=ranch?4:1+farm.id%2;
   if(ranch&&world.canSee(0,farm)){
    // Open entrance on the near edge; the paddock follows the terrain projection.
    const radius=BUILDINGS.ranch.radius*.92;
    c.save();c.lineWidth=Math.max(1,scale*.09);c.strokeStyle='#65523c';
    for(let side=0;side<4;side++)for(let j=0;j<6;j++){
     if(side===1&&(j===2||j===3))continue;
     const point=(t:number)=>side===0?{x:farm.x-radius+t*radius*2,z:farm.z-radius}:side===1?{x:farm.x+radius,z:farm.z-radius+t*radius*2}:side===2?{x:farm.x+radius-t*radius*2,z:farm.z+radius}:{x:farm.x-radius,z:farm.z+radius-t*radius*2};
     const a=project(point(j/6)),b=project(point((j+1)/6));
     c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x,a.y-scale*.7);c.stroke();
     for(const height of [.28,.58]){c.beginPath();c.moveTo(a.x,a.y-scale*height);c.lineTo(b.x,b.y-scale*height);c.stroke();}
    }
    c.restore();
   }
   for(let k=0;k<count&&drawn<limit;k++){
    const herd=HERDS[ranch?k%3:(farm.id+k*3)%HERDS.length],seed=farm.id*7.31+k*3.7,radius=ranch?BUILDINGS.ranch.radius*.74:BUILDINGS[farm.def].radius+1.6;
    // Each animal alternates a slow walk along the field edge with a pause to graze.
    const cycle=14+(seed%5),local=unitCycle(time/cycle+seed*.13),walking=herd.walk&&local<.45;
    const travel=herd.walk?(Math.floor(time/cycle+seed*.13)*.45+Math.min(local,.45))*1.1:0;
    const angle=seed+travel,pos={x:farm.x+Math.cos(angle)*radius,z:farm.z+Math.sin(angle)*radius};
    if(isWater(pos.x,pos.z)||!world.canSee(0,pos))continue;
    const p=project(pos);if(!inView(p,40))continue;
    const ahead=project({x:farm.x+Math.cos(angle+.05)*radius,z:farm.z+Math.sin(angle+.05)*radius}),flip=ahead.x<p.x;
    const frame=walking?unitCycle(time*1.4+seed)*4:herd.walk?0:unitCycle(time/3.5+seed)*4;
    c.save();c.globalAlpha=.32;c.fillStyle='#1a1a10';c.beginPath();c.ellipse(p.x,p.y,herd.width*scale*.32,herd.width*scale*.1,0,0,Math.PI*2);c.fill();c.restore();
    this.sprite(c,herd.sheet,herd.row,frame,{x:p.x,z:p.y},herd.width*scale,1,flip,.93);drawn++;
   }
  }
 }
 /** Birds glide above everything, with a soft shadow on the ground below. */
 drawSky(c:CanvasRenderingContext2D,world:World,time:number,scale:number,width:number,height:number,project:(p:Point)=>Screen){
  if(this.low||this.weather==='rain')return;
  const town=world.entities.find((e:Entity)=>e.type==='building'&&e.def==='town'&&e.owner===0&&e.hp>0)??{x:0,z:0};
  for(let i=0;i<2;i++){
   const r=26+i*14,speed=.045+i*.02,a=time*speed*(i?-1:1)+i*2.1,centre={x:town.x+Math.cos(i*2.4)*18,z:town.z+Math.sin(i*2.4)*18};
   const pos={x:centre.x+Math.cos(a)*r,z:centre.z+Math.sin(a)*r};if(!world.canSee(0,pos))continue;
   const p=project(pos),altitude=scale*(7+i*1.5);if(p.x<-60||p.x>width+60||p.y-altitude<-60||p.y>height+60)continue;
   const next=project({x:centre.x+Math.cos(a+.02*(i?-1:1))*r,z:centre.z+Math.sin(a+.02*(i?-1:1))*r}),flip=next.x<p.x;
   c.save();c.globalAlpha=.14;c.fillStyle='#10140c';c.beginPath();c.ellipse(p.x,p.y,scale*.8,scale*.22,0,0,Math.PI*2);c.fill();c.restore();
   // Flap for a while, then glide on spread wings.
   const glide=unitCycle(time/7+i*.5)>.55,frame=glide?1:unitCycle(time*1.6+i)*4;
   this.sprite(c,'aquatic-wildlife-v1',3,frame,{x:p.x,z:p.y-altitude},scale*2.2,.95,flip);
  }
 }
 drawWeather(c:CanvasRenderingContext2D,time:number,width:number,height:number){
  if(this.weather==='clear')return;c.save();
  if(this.weather==='dry'){c.fillStyle='#d4a04a0b';c.fillRect(0,0,width,height);c.restore();return;}
  c.fillStyle='#24354412';c.fillRect(0,0,width,height);c.lineWidth=.7;c.strokeStyle='#c8deec55';c.beginPath();const count=this.low?36:90;
  for(let i=0;i<count;i++){const x=(i*113.713+time*24)%width,y=(i*71.317+time*330)%height;c.moveTo(x,y);c.lineTo(x-3,y+9);}c.stroke();
  c.strokeStyle='#cee3eb30';c.beginPath();for(let i=0;i<(this.low?6:16);i++){const u=(time*1.2+i*.618)%1,x=(i*157.31)%width,y=height*.4+(i*97.17)%(height*.6);c.moveTo(x+1+u*4,y);c.ellipse(x,y,1+u*4,.5+u*1.7,0,0,Math.PI*2);}c.stroke();c.restore();
 }
}
