import {MAP_HALF,MAP_SIZE,elevation,worldCell,gridIndex} from './map';
import type {World,Point} from './world';
const RES=6,PAD=100,FOG_STEP=4;
export class TerrainSurface {
 private depths=new Float32Array(0);
 private image=document.createElement('canvas');private fog=document.createElement('canvas');private softFog=document.createElement('canvas');
 constructor(){this.image.width=MAP_SIZE*RES*2;this.image.height=MAP_SIZE*RES+PAD*2;for(const c of [this.fog,this.softFog]){c.width=this.image.width/2;c.height=this.image.height/2;}}
 private point(x:number,z:number){return{x:(x-z)*RES+MAP_SIZE*RES,y:(x+z)*RES*.5+MAP_HALF*RES+PAD-elevation(x,z)*RES};}
 rebuild(source:HTMLCanvasElement,rock?:HTMLImageElement){
  const c=this.image.getContext('2d')!;c.clearRect(0,0,this.image.width,this.image.height);
  c.save();c.translate(MAP_SIZE*RES,MAP_HALF*RES+PAD);c.transform(RES,RES*.5,-RES,RES*.5,0,0);c.drawImage(source,-MAP_HALF,-MAP_HALF,MAP_SIZE,MAP_SIZE);c.restore();
  // Rasterize a shared height mesh into one cached bitmap. No stroked tile edges,
  // per-triangle clipping, or transparent antialias cracks between adjacent faces.
  const n=MAP_SIZE+1,heights=new Float32Array(n*n),slopes=new Float32Array(n*n),lights=new Float32Array(n*n);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++)heights[z*n+x]=elevation(x-MAP_HALF,z-MAP_HALF);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){const dx=(heights[z*n+Math.min(n-1,x+1)]-heights[z*n+Math.max(0,x-1)])*.5,dz=(heights[Math.min(n-1,z+1)*n+x]-heights[Math.max(0,z-1)*n+x])*.5,normal=Math.sqrt(1+dx*dx+dz*dz);slopes[z*n+x]=Math.hypot(dx,dz);lights[z*n+x]=Math.max(.38,Math.min(1.14,.64+(.36-dx*.32-dz*.43)/normal));}
  const src=source.getContext('2d')!.getImageData(0,0,source.width,source.height).data,out=c.getImageData(0,0,this.image.width,this.image.height),pixels=out.data,w=this.image.width,h=this.image.height;
  this.depths=new Float32Array(w*h);for(let y=0;y<h;y++)this.depths.fill((y+.5-MAP_HALF*RES-PAD)*2/RES,y*w,(y+1)*w);
  let stone:Uint8ClampedArray|undefined,rw=0,rh=0;if(rock?.naturalWidth){const rc=document.createElement('canvas');rw=rc.width=Math.floor(rock.width/2);rh=rc.height=Math.floor(rock.height/2);const r=rc.getContext('2d')!;r.drawImage(rock,rw,rh,rw,rh,0,0,rw,rh);stone=r.getImageData(0,0,rw,rh).data;}
  type Vertex={x:number;y:number;wx:number;wz:number;h:number;slope:number;light:number};
  const vertex=(x:number,z:number):Vertex=>{const wx=x-MAP_HALF,wz=z-MAP_HALF;return{x:(wx-wz)*RES+MAP_SIZE*RES,y:(wx+wz)*RES*.5+MAP_HALF*RES+PAD-heights[z*n+x]*RES,wx,wz,h:heights[z*n+x],slope:slopes[z*n+x],light:lights[z*n+x]};};
  const tri=(a:Vertex,b:Vertex,d:Vertex)=>{const det=(b.y-d.y)*(a.x-d.x)+(d.x-b.x)*(a.y-d.y);if(Math.abs(det)<.0001)return;
   const left=Math.max(0,Math.floor(Math.min(a.x,b.x,d.x))),right=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,d.x))),top=Math.max(0,Math.floor(Math.min(a.y,b.y,d.y))),bottom=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,d.y)));
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const u=((b.y-d.y)*(x+.5-d.x)+(d.x-b.x)*(y+.5-d.y))/det,v=((d.y-a.y)*(x+.5-d.x)+(a.x-d.x)*(y+.5-d.y))/det,k=1-u-v;if(u<-.00001||v<-.00001||k<-.00001)continue;
    const wx=a.wx*u+b.wx*v+d.wx*k,wz=a.wz*u+b.wz*v+d.wz*k,sx=Math.max(0,Math.min(source.width-1,Math.floor((wx+MAP_HALF)/MAP_SIZE*source.width))),sy=Math.max(0,Math.min(source.height-1,Math.floor((wz+MAP_HALF)/MAP_SIZE*source.height))),si=(sy*source.width+sx)*4,oi=(y*w+x)*4;
    this.depths[y*w+x]=wx+wz-(a.h*u+b.h*v+d.h*k)*2;
    const slope=a.slope*u+b.slope*v+d.slope*k,blend=Math.max(0,Math.min(.94,(slope-.3)/.9)),light=a.light*u+b.light*v+d.light*k;
    const rx=rw?((Math.floor(wx*16)%rw)+rw)%rw:0,ry=rh?((Math.floor(wz*16)%rh)+rh)%rh:0,ri=(ry*rw+rx)*4;
    for(let channel=0;channel<3;channel++)pixels[oi+channel]=Math.min(255,(src[si+channel]*(1-blend)+(stone?stone[ri+channel]:src[si+channel])*blend)*light);pixels[oi+3]=255;
   }
  };
  for(let depth=0;depth<MAP_SIZE*2-1;depth++)for(let x=Math.max(0,depth-MAP_SIZE+1);x<=Math.min(MAP_SIZE-1,depth);x++){const z=depth-x;if([heights[z*n+x],heights[z*n+x+1],heights[(z+1)*n+x],heights[(z+1)*n+x+1]].every(v=>Math.abs(v)<.001))continue;const a=vertex(x,z),b=vertex(x+1,z),d=vertex(x,z+1),e=vertex(x+1,z+1);tri(a,b,d);tri(b,e,d);}
  c.putImageData(out,0,0);
 }

 clipObject(c:CanvasRenderingContext2D,focus:Point,width:number,height:number,scale:number,bounds:{x:number;y:number;width:number;height:number},depth:number,baseY:number,groundElevation:number){
  if(!this.depths.length)return;
  const ratio=scale/RES,ox=width/2+(-focus.x+focus.z)*scale-MAP_SIZE*scale,oy=height*.53+(-focus.x-focus.z)*scale*.5-(MAP_HALF*RES+PAD)*ratio;
  const left=Math.max(0,Math.floor((bounds.x-ox)/ratio)),right=Math.min(this.image.width,Math.ceil((bounds.x+bounds.width-ox)/ratio)),top=Math.max(0,Math.floor((bounds.y-oy)/ratio)),bottom=Math.min(this.image.height,Math.ceil((bounds.y+bounds.height-oy)/ratio));
  const occludes=(x:number,y:number)=>{const terrainDepth=this.depths[y*this.image.width+x],flatDepth=(y+.5-MAP_HALF*RES-PAD)*2/RES;return (flatDepth-terrainDepth)*.5>groundElevation+.55&&terrainDepth>depth-2*(baseY-(oy+y*ratio))/scale;};
  let hidden=false;for(let y=top;y<bottom&&!hidden;y++)for(let x=left;x<right;x++)if(occludes(x,y)){hidden=true;break;}
  if(!hidden)return;
  c.beginPath();for(let y=top;y<bottom;y++){let start=-1;for(let x=left;x<=right;x++){const visible=x<right&&!occludes(x,y);if(visible&&start<0)start=x;if(!visible&&start>=0){c.rect(ox+start*ratio,oy+y*ratio,(x-start)*ratio,ratio+.1);start=-1;}}}c.clip();
 }
 updateFog(world:World){const c=this.fog.getContext('2d')!;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.fog.width,this.fog.height);c.setTransform(.5,0,0,.5,0,0);for(let z=-MAP_HALF;z<MAP_HALF;z+=FOG_STEP)for(let x=-MAP_HALF;x<MAP_HALF;x+=FOG_STEP){let seen=0,known=0;for(let dz=0;dz<FOG_STEP;dz+=2)for(let dx=0;dx<FOG_STEP;dx+=2){const cell=worldCell({x:x+dx,z:z+dz}),i=gridIndex(cell.x,cell.z);if(world.visible[0].has(i))seen++;if(world.explored[0].has(i))known++;}if(seen===(FOG_STEP/2)**2)continue;const opacity=seen?(.4*(1-seen/((FOG_STEP/2)**2))):known?.38:.94;c.fillStyle=`rgba(13,24,17,${opacity})`;c.beginPath();[[x,z],[x+FOG_STEP,z],[x+FOG_STEP,z+FOG_STEP],[x,z+FOG_STEP]].forEach(([px,pz],i)=>{const p=this.point(px,pz);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();c.fill();}const soft=this.softFog.getContext('2d')!;soft.clearRect(0,0,this.softFog.width,this.softFog.height);soft.filter='blur(5px)';soft.drawImage(this.fog,0,0);soft.filter='none';}
 draw(c:CanvasRenderingContext2D,focus:Point,width:number,height:number,scale:number,fog=false){const ratio=scale/RES,ox=width/2+(-focus.x+focus.z)*scale,oy=height*.53+(-focus.x-focus.z)*scale*.5;const image=fog?this.softFog:this.image;c.drawImage(image,ox-MAP_SIZE*scale,oy-(MAP_HALF*RES+PAD)*ratio,this.image.width*ratio,this.image.height*ratio);}
}
