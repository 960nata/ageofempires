import {MAP_HALF,isWater,mapSpec} from './map';
import type {Point,World} from './world';
export type WeatherMode='clear'|'rain'|'dry';
type Atlas={file:string;frames:number[][][]};
export class NatureLayer {
 private atlases:Record<string,Atlas>={};
 private images=new Map<string,HTMLImageElement>();
 private signature='';private sites:Point[]=[];
 private budget=8;private low=false;
 weather:WeatherMode='clear';
 readonly ready=fetch(import.meta.env.BASE_URL+'assets/nature/manifest.json').then(r=>{if(!r.ok)throw Error('Nature manifest unavailable');return r.json();}).then((data:Record<string,Atlas>)=>{this.atlases=data;}).catch(()=>{});
 quality(quality:string){this.low=quality==='low';this.budget=this.low?4:8;}
 private image(name:string){let image=this.images.get(name);if(!image&&this.atlases[name]){image=new Image();image.src=import.meta.env.BASE_URL+'assets/nature/'+this.atlases[name].file;this.images.set(name,image);}return image;}
 private sprite(c:CanvasRenderingContext2D,name:string,row:number,frame:number,p:Point,width:number,opacity:number){
  const image=this.image(name),frames=this.atlases[name]?.frames[row],rect=frames?.[frame];if(!image?.complete||!image.naturalWidth||!rect||!frames)return;
  // One pixel scale for the entire action, rather than stretching every pose to the same width.
  const nominal=Math.max(...frames.map(f=>f[2])),pixel=width/nominal;const [x,y,w,h]=rect;
  c.save();c.globalAlpha=opacity;c.drawImage(image,x,y,w,h,p.x-w*pixel/2,p.z-h*pixel/2,w*pixel,h*pixel);c.restore();
 }
 private ripple(c:CanvasRenderingContext2D,p:{x:number;y:number},scale:number,u:number){c.save();c.strokeStyle=`rgba(198,231,239,${Math.sin(u*Math.PI)*.38})`;c.lineWidth=Math.max(.6,scale*.05);c.beginPath();c.ellipse(p.x,p.y,scale*(.3+u*1.4),scale*(.12+u*.5),0,0,Math.PI*2);c.stroke();c.restore();}
 draw(c:CanvasRenderingContext2D,world:World,time:number,scale:number,width:number,height:number,project:(p:Point)=>{x:number;y:number}){
  const spec=mapSpec(),key=JSON.stringify(spec);
  if(key!==this.signature){this.signature=key;this.sites=[];
   // Spread candidates across the map instead of filling the first coastline strip.
   for(let i=0;i<512&&this.sites.length<48;i++){const x=-MAP_HALF+16+((i*73+spec.seed*13)%(MAP_HALF*2-32)),z=-MAP_HALF+16+((i*137+spec.seed*7)%(MAP_HALF*2-32));if(isWater(x,z)&&isWater(x+6,z)&&isWater(x-6,z)&&isWater(x,z+6))this.sites.push({x,z});}
  }
  let visible=0,whale=false;
  for(let i=0;i<this.sites.length;i++){const site=this.sites[i];if(!world.canSee(0,site))continue;const cycle=(time+i*13)%48,chase=cycle>30&&cycle<38,drift=Math.sin(time*.25+i)*2;
   const position={x:site.x+drift+(chase?(cycle-30)*.35:0),z:site.z+Math.cos(time*.25+i)*2};if(!isWater(position.x,position.z))continue;const p=project(position);if(p.x< -100||p.y< -100||p.x>width+100||p.y>height+100||visible++>=this.budget)continue;
   const phase=time*4+i,frame=Math.floor(phase)%4;
   this.sprite(c,'anchovy-shrimp-motion-v1',i%2,frame,{x:p.x,z:p.y},scale*(i%2?1.2:2.8),.34);
   if(i%5===0)this.sprite(c,'reef-kelp-motion-v1',0,Math.floor(time*1.5)%4,{x:p.x+scale*2,z:p.y+scale},scale*2,.26);
   if(i%3===0){const jump=(time+i*2.731)%16;if(jump<1.8){const u=jump/1.8;this.sprite(c,'aquatic-wildlife-v1',0,Math.min(3,Math.floor(u*4)),{x:p.x+(u-.5)*scale,z:p.y-Math.sin(u*Math.PI)*scale*.6},scale*1.6,Math.sin(u*Math.PI));this.ripple(c,p,scale,u);}}
   if(!this.low&&!whale&&chase&&i%2===0&&isWater(site.x+12,site.z)&&isWater(site.x-12,site.z)){whale=true;const u=(cycle-30)/8;this.sprite(c,'aquatic-wildlife-v1',2,Math.min(3,Math.floor(u*4)),{x:p.x-scale*(3-u*4),z:p.y+scale},scale*6,Math.sin(u*Math.PI)*.45);this.ripple(c,p,scale*2,u);}
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
