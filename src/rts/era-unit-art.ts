import type {SceneSprite} from './scene-art';

type Palette={cloth:string;metal:string;crest:string};
const PALETTES:Record<string,Palette>={
 roman:{cloth:'#a74632',metal:'#a7a9a2',crest:'#d9aa58'},
 persian:{cloth:'#384f85',metal:'#b6a47c',crest:'#e0b85a'},
 english:{cloth:'#556b7b',metal:'#a9afa8',crest:'#e1cc91'},
 french:{cloth:'#355b91',metal:'#b5b6ae',crest:'#e5bc66'},
 chinese:{cloth:'#8d3935',metal:'#9b9e92',crest:'#d7ac55'},
 steppe:{cloth:'#71553d',metal:'#9c9683',crest:'#c4a273'},
 ayyubid:{cloth:'#497365',metal:'#aaa893',crest:'#d9bd78'},
 japanese:{cloth:'#43516d',metal:'#8c9a9b',crest:'#d5b683'},
 khmer:{cloth:'#8b533c',metal:'#bba778',crest:'#e4bf70'},
 castilian:{cloth:'#924641',metal:'#a8aba5',crest:'#ddbb71'},
};

/** Team/era colour fallback only; this does not supply missing equipment artwork. */
export class EraUnitArt {
 private identities=new WeakMap<HTMLImageElement,number>();private nextId=1;
 private cache=new Map<string,{sprite:SceneSprite;bytes:number}>();private bytes=0;
 style(source:SceneSprite|null,faction:string,era:number,direction:number,mounted=false,unit='',native=true):SceneSprite|null{
  if(!source||source.eraSpecific||era<0||era>3||era===2&&native)return source;
  const palette=PALETTES[faction];if(!palette)return source;
  const machine=['ram','mangonel','trebuchet','ballista','bombard'].includes(unit),civilian=['worker','explorer','healer','trader'].includes(unit);
  let id=this.identities.get(source.image);if(id===undefined){id=this.nextId++;this.identities.set(source.image,id);}
  const key=[id,source.sx,source.sy,source.sw,source.sh,faction,era,direction,mounted?1:0,unit,native?1:0].join(':');
  const old=this.cache.get(key);if(old){this.cache.delete(key);this.cache.set(key,old);return old.sprite;}
  const w=Math.max(1,Math.ceil(source.sw)),h=Math.max(1,Math.ceil(source.sh));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  ctx.drawImage(source.image,source.sx,source.sy,source.sw,source.sh,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h),data=pixels.data;
  const limit=Math.floor(h*(machine?.92:mounted?.48:.76));
  for(let y=0;y<limit;y++)for(let x=0;x<w;x++){
   const at=(y*w+x)*4;if(data[at+3]<35)continue;
   const r=data[at],g=data[at+1],b=data[at+2],light=(r+g+b)/3,chroma=Math.max(r,g,b)-Math.min(r,g,b);
   if(era===0){const metal=chroma<34&&light>65,blend=metal?.40:.18;data[at]=r*(1-blend)+125*blend;data[at+1]=g*(1-blend)+90*blend;data[at+2]=b*(1-blend)+57*blend;}
   else if(era===1){if(chroma<42&&light>75){data[at]=r*.78+115*.22;data[at+1]=g*.78+105*.22;data[at+2]=b*.78+84*.22;}}
   else if(era===3&&chroma<55&&light>55){const glint=light>135?.27:.11;data[at]=Math.min(255,r*(1-glint)+200*glint);data[at+1]=Math.min(255,g*(1-glint)+192*glint);data[at+2]=Math.min(255,b*(1-glint)+168*glint);}
  }
  ctx.putImageData(pixels,0,0);
  if(!native||machine){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle=palette.cloth+(machine?'48':'32');ctx.fillRect(0,h*(machine?.32:mounted?.10:.22),w,h*(machine?.36:mounted?.32:.40));ctx.restore();}
  Object.defineProperty(canvas,'naturalWidth',{value:w});Object.defineProperty(canvas,'complete',{value:true});
  const sprite:SceneSprite={...source,image:canvas as unknown as HTMLImageElement,sx:0,sy:0,sw:w,sh:h};
  const bytes=w*h*5;this.cache.set(key,{sprite,bytes});this.bytes+=bytes;
  while(this.bytes>24*1024*1024&&this.cache.size>1){const first=this.cache.keys().next().value!;this.bytes-=this.cache.get(first)!.bytes;this.cache.delete(first);}
  return sprite;
 }
}
