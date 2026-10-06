import {RegionalArt} from './regional-art';
import {assetUrl} from './assets';
import frames from './scene-frames.json';
import {coastX} from './map';
import eraFrames from './era-frames.json';
const allFrames:Record<string,{x:number;y:number;w:number;h:number}[]>={...frames,...eraFrames};
export interface SceneSprite {image:HTMLImageElement;sx:number;sy:number;sw:number;sh:number;width:number;height:number;anchor:number;anchorX?:number;flip?:boolean;}
export const BUILDING_VIEWS:Record<string,number>={town:0,keep:1,house:2,barracks:3,range:4,stable:5,market:6,smithy:7,academy:8,government:9,healing:10,siege:11,camel:5,wall:12,gate:13,tower:14,'archer-tower':14,'cannon-tower':14,lumber:15,mine:16,mill:17,palisade:18,landmark:19,specialist:20,farm:-1,orchard:-2};
export const FACING_NAMES=['South','East','North','West'];
export class SceneArt {
 readonly regional=new RegionalArt();
 private images=new Map<string,HTMLImageElement>();private alpha=new Map<HTMLImageElement,{width:number;data:Uint8Array}>();
 readonly count=Object.keys(frames).length;readonly ready:Promise<void>;
 private eraPending=new Set<string>();private eraFailed=new Set<string>();
 constructor(){this.ready=Promise.all(Object.keys(frames).map(name=>new Promise<void>((resolve,reject)=>{const image=new Image();this.images.set(name,image);image.onload=()=>resolve();image.onerror=()=>reject(Error('Scene art unavailable: '+name));image.src=assetUrl(name+'.png');}))).then(()=>{});}
 // Alpha masks are built on the first pick of an atlas (not at load) and keep one byte per pixel.
 opaque(image:HTMLImageElement,x:number,y:number){let data=this.alpha.get(image);if(!data&&image.naturalWidth){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0);const rgba=c.getImageData(0,0,image.width,image.height).data,alpha=new Uint8Array(image.width*image.height);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];data={width:image.width,data:alpha};this.alpha.set(image,data);}return data?data.data[y*data.width+x]>70:undefined;}
 sprite(name:string,index:number,width:number,anchor=1):SceneSprite|null{const image=this.images.get(name),rect=allFrames[name]?.[index];if(!image?.naturalWidth||!rect)return null;return{image,sx:rect.x,sy:rect.y,sw:rect.w,sh:rect.h,width,height:width*rect.h/rect.w,anchor};}
 private requestEra(name:string){if(this.images.has(name)||this.eraPending.has(name)||this.eraFailed.has(name))return;this.eraPending.add(name);const image=new Image();this.images.set(name,image);image.onload=()=>{this.eraPending.delete(name);};image.onerror=()=>{this.eraPending.delete(name);this.eraFailed.add(name);this.images.delete(name);};image.src=assetUrl(name+'.png');}
 building(def:string,persian:boolean,facing:number,radius:number,scale:number,age=2,faction='',gateOpen=0){const index=BUILDING_VIEWS[def];if(index===undefined||index<0)return null;const direction=((facing%4)+4)%4,civ=persian?'persian':'roman';let name='',cell=0,width=radius*3.65*scale;
  if(def==='gate'){const gate=this.regional.gate(direction,gateOpen,width);if(gate)return gate;}
  const regional=this.regional.building(faction,index,direction,width,age);if(regional)return regional;
  if(index<12&&age!==2){const era=age===0?'dark':age===1?'feudal':'imperial',view=['','-east','-north','-west'][direction],version=civ==='persian'&&era==='imperial'?'-v3':'';name=`${civ}-${era}${view}${version}-${String(index).padStart(2,'0')}`;if((eraFrames as Record<string,unknown>)[name]){this.requestEra(name);const art=this.sprite(name,0,width);if(art){art.anchor=1-art.width*.22/art.height;return art;}}
  }
  if(index<12){name=`${civ}-settlement${['','-east','-north','-west'][direction]}-v2`;cell=index;}
  else if(index<15){name=`${civ}-fortifications-v2`;cell=(index-12)*4+direction;if(index===14)width=radius*2.3*scale;}
  else if(index<18){name=`${civ}-utilities-v2`;cell=(index-15)*4+direction;}
  else{name='landmarks-palisade-v2';cell=(index===18?0:persian?2:1)*4+direction;}
  const s=this.sprite(name,cell,width);if(s)s.anchor=1-s.width*(def==='wall'||def==='palisade'?.08:.22)/s.height;return s;
 }

 vegetationSpecies(id:number,x:number,z:number){return x>coastX(z)-19?[8,9][id%2]:z<-45?[4,5][id%2]:[0,1,2,3,4,7][id%6];}
 vegetationFamily(id:number,x:number,z:number){const species=this.vegetationSpecies(id,x,z);return species>=8&&species<=9?2:species===5||species===6?1:0;}
 vegetation(id:number,x:number,z:number,scale:number){const species=this.vegetationSpecies(id,x,z),s=this.sprite('woodland-v2',species,1);if(s){const height=(species===6?7.8:species<2?7.5:6.5)*(1+(id%7-3)*.035)*scale;s.width=height*s.sw/s.sh;s.height=height;}return s;}
 rubble(def:string,persian:boolean,width:number){let index=def==='house'?0:['barracks','range','stable'].includes(def)?1:['keep','tower','gate'].includes(def)?3:2;index+=persian?4:0;if(['siege','lumber','mine','smithy'].includes(def))index=8;if(def==='farm')index=9;if(def==='market')index=10;if(['wall','palisade'].includes(def))index=11;const s=this.sprite('ruins-v1',index,width);if(s){s.height*=.58;s.anchor=1-s.width*.19/s.height;}return s;}
 orchard(picked:boolean,width:number,facing:number){return this.sprite('orchard-grasses-v3',(picked?4:0)+((facing%4+4)%4),width);}
 wildgrass(id:number,width:number){return this.sprite('orchard-grasses-v3',8+id%4,width);}
 mineral(resource:'gold'|'stone',amount:number,initial:number,width:number,facing:number){const remaining=amount/Math.max(1,initial),stage=remaining<=0?3:remaining<.4?2:remaining<.78?1:0,name=resource==='gold'?'gold-directions-v3':'quarry-directions-v3';return this.sprite(name,stage*4+((facing%4+4)%4),width,.95);}
 effect(row:number,phase:number,width:number){return this.sprite('disaster-fx-v1',row*4+(Math.floor(phase)%4+4)%4,width);}
}
