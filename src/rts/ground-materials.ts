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
