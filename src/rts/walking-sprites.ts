import {assetUrl} from './assets';
import definitions from './walking-frames.json';
type Family=keyof typeof definitions;
export class WalkingSprites {
 private images=new Map<string,HTMLImageElement>();private alpha=new Map<HTMLImageElement,Uint8Array>();
 get count(){return Object.keys(definitions).length;}
 readonly ready:Promise<void>;
 constructor(){this.ready=Promise.all(Object.entries(definitions).map(([name,data])=>new Promise<void>((resolve,reject)=>{const image=new Image();this.images.set(name,image);image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d')!;c.drawImage(image,0,0);const rgba=c.getImageData(0,0,image.width,image.height).data,alpha=new Uint8Array(image.width*image.height);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];this.alpha.set(image,alpha);resolve();}catch(error){reject(error);}};image.onerror=()=>reject(new Error('Walking sprite unavailable: '+name));image.src=assetUrl(data.file);}))).then(()=>{});}
 opaque(image:HTMLImageElement,x:number,y:number){const data=this.alpha.get(image);return data?data[y*image.width+x]>70:undefined;}
 sprite(name:string,direction:number,pose:number,scale:number){
  const data=definitions[name as Family],image=this.images.get(name);if(!data||!image?.naturalWidth)return null;
  // Mirrored side/diagonal views avoid erroneous generated headings. Equipment handedness is mirrored too.
  // The generated elephant east row is clipped. Mirror its complete west row instead.
  const row=(name==='war-elephant'?[4,1,2,1,4,5,6,5]:[0,1,2,1,0,5,6,5])[direction],flip=(name==='war-elephant'?[0,3,7]:[3,4,7]).includes(direction);
  const rect=data.frames[row][pose],pixel=data.size*scale/data.nominal;
  return{image,sx:rect.x,sy:rect.y,sw:rect.w,sh:rect.h,width:rect.w*pixel,height:rect.h*pixel,anchor:rect.anchorY,anchorX:rect.anchorX,flip};
 }
}
