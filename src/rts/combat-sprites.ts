import {assetUrl} from './assets';
import {mountedArt} from './mounted-art';
import {attackPose} from './combat-timing';
import definitions from './combat-frames.json';
export class CombatSprites {
 private images=new Map<string,HTMLImageElement>();private alpha=new Map<HTMLImageElement,Uint8Array>();
 get count(){return Object.keys(definitions).length;}
 pose(name:string,age:number){const data=(definitions as Record<string,typeof definitions.spear>)[name];return attackPose(data?.frames[0].length??4,age);}
 readonly ready:Promise<void>;
 constructor(){this.ready=Promise.all(Object.entries(definitions).map(([name,data])=>new Promise<void>((resolve,reject)=>{const image=new Image();this.images.set(name,image);image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d')!;c.drawImage(image,0,0);const rgba=c.getImageData(0,0,image.width,image.height).data,alpha=new Uint8Array(image.width*image.height);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];this.alpha.set(image,alpha);resolve();}catch(error){reject(error);}};image.onerror=()=>reject(new Error('Attack sprite unavailable: '+name));image.src=assetUrl(data.file);}))).then(()=>{});}
 opaque(image:HTMLImageElement,x:number,y:number){const data=this.alpha.get(image);return data?data[y*image.width+x]>70:undefined;}
 sprite(name:string,direction:number,pose:number,scale:number){const data=(definitions as Record<string,typeof definitions.spear>)[name],image=this.images.get(name);if(!data||!image?.naturalWidth)return null;
  const mounted=!!mountedArt(name),mirror=mounted?[3,4,7].includes(direction):(name==='spear'||name==='archer')&&direction===3,row=mounted?[0,1,2,1,0,5,6,5][direction]:mirror?1:direction,rect=data.frames[row][Math.max(0,Math.min(data.frames[row].length-1,pose))],pixel=data.size*scale/data.nominal;
  return{image,sx:rect.x,sy:rect.y,sw:rect.w,sh:rect.h,width:rect.w*pixel,height:rect.h*pixel,anchor:1,anchorX:rect.anchorX,flip:mirror};
 }
}
