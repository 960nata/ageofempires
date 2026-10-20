// Ground is composed once into the cached map, never rebuilt per display frame.
const smooth=(t:number)=>t*t*(3-2*t);
const hash=(x:number,y:number)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
function noise(x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);const a=hash(ix,iy)*(1-u)+hash(ix+1,iy)*u,b=hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u;return a*(1-v)+b*v;}
export function terrainPattern(c:CanvasRenderingContext2D,image:HTMLImageElement,quadrant:number,size=192){
 if(!image.naturalWidth)return null;
 const tile=document.createElement('canvas');tile.width=tile.height=size*2;const t=tile.getContext('2d')!,sw=image.width/2,sh=image.height/2;
 // Reflect adjacent copies so material edges meet without a hard tiled seam.
 for(let y=0;y<2;y++)for(let x=0;x<2;x++){t.save();t.translate(x?size*2:0,y?size*2:0);t.scale(x?-1:1,y?-1:1);t.drawImage(image,(quadrant%2)*sw,Math.floor(quadrant/2)*sh,sw,sh,0,0,size,size);t.restore();}
 return c.createPattern(tile,'repeat');
}
export function paintGround(c:CanvasRenderingContext2D,image:HTMLImageElement){
 const size=c.canvas.width;c.fillStyle=terrainPattern(c,image,0)??'#7f8650';c.fillRect(0,0,size,size);
 if(!image.naturalWidth)return;
 const layer=document.createElement('canvas');layer.width=layer.height=size;const l=layer.getContext('2d')!;
 const mask=document.createElement('canvas');mask.width=mask.height=128;const m=mask.getContext('2d')!,pixels=m.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const broad=noise(x/25,y/25),detail=noise(x/8+19,y/8+31),n=broad*.75+detail*.25;const a=Math.max(0,Math.min(1,(n-.32)*2.1));const i=(y*128+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=Math.round(a*255);}
 m.putImageData(pixels,0,0);l.fillStyle=terrainPattern(l,image,1,160)!;l.fillRect(0,0,size,size);l.globalCompositeOperation='destination-in';l.drawImage(mask,0,0,size,size);c.drawImage(layer,0,0);
 // A restrained warm wash unifies the two source materials at gameplay scale.
 c.fillStyle='#b4ab7620';c.fillRect(0,0,size,size);
}

/** A distinct arid ground material: dry sand and wind-shaped dune bands, not recoloured grass. */
export function paintAridGround(c:CanvasRenderingContext2D){
 const size=c.canvas.width;c.save();c.globalCompositeOperation='source-over';c.fillStyle='#c9ad75';c.fillRect(0,0,size,size);
 const n=384,layer=document.createElement('canvas');layer.width=layer.height=n;const l=layer.getContext('2d')!,img=l.createImageData(n,n),p=img.data;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const broad=noise(x/44,y/44),grain=noise(x/8+51,y/8+17),r=noise(x/105+7,y/105+29),v=(broad-.5)*20+(grain-.5)*13+(r-.5)*9,i=(y*n+x)*4;
  p[i]=Math.max(0,Math.min(255,198+v));p[i+1]=Math.max(0,Math.min(255,170+v*.88));p[i+2]=Math.max(0,Math.min(255,112+v*.62));p[i+3]=255;
 }
 l.putImageData(img,0,0);c.drawImage(layer,0,0,size,size);
 // Broad broken contours suggest wind ripples without drawing a tiled grid.
 let seed=491;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 c.lineCap='round';
 for(let i=0;i<24;i++){
  const y=rand()*size,x=-size*.1+rand()*size*.2,amp=size*(.008+rand()*.018),period=size*(.22+rand()*.28),phase=rand()*Math.PI*2;
  c.strokeStyle=i%3?'rgba(111,78,39,.055)':'rgba(255,238,192,.105)';c.lineWidth=size*(.002+rand()*.003);c.beginPath();
  for(let step=0;step<=32;step++){const xx=x+size*1.2*step/32,yy=y+Math.sin((xx/period)*Math.PI*2+phase)*amp+Math.sin((xx/period)*Math.PI+phase*.7)*amp*.35;step?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();
 }
 c.restore();
}
