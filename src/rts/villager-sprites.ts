import {assetUrl} from './assets';
export type VillagerAppearance='male'|'female';
type Action='chop'|'mine'|'farm'|'orchard'|'build';
type Rect={x:number;y:number;w:number;h:number;anchorX:number};
type Sheet={image:HTMLImageElement;frames:Rect[][];alpha:Uint8ClampedArray};
const files={male:'villager-male-locomotion-v1.png',female:'villager-female-locomotion-v1.png',femaleActions:'villager-female-actions-v1.png'} as const;

/** Eight authored headings. Column zero is idle, columns one through five form a walk cycle. */
export class VillagerSprites {
 private sheets=new Map<keyof typeof files,Sheet>();
 readonly ready:Promise<void>;
 get count(){return 3;}
 constructor(){this.ready=Promise.all((Object.entries(files) as [keyof typeof files,string][]).map(([key,file])=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.onload=()=>{try{const rows=key==='femaleActions'?5:8,cols=key==='femaleActions'?8:6;this.sheets.set(key,this.measure(image,rows,cols));resolve();}catch(error){reject(error);}};
  image.onerror=()=>reject(new Error('Villager atlas unavailable: '+file));image.src=assetUrl(file);
 }))).then(()=>{});}
 private measure(image:HTMLImageElement,rows:number,cols:number):Sheet{
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0);
  const alpha=c.getImageData(0,0,image.width,image.height).data,frames:Rect[][]=[];
  for(let row=0;row<rows;row++){const band:Rect[]=[];for(let col=0;col<cols;col++){
   const x0=Math.floor(col*image.width/cols),x1=Math.floor((col+1)*image.width/cols),y0=Math.floor(row*image.height/rows),y1=Math.floor((row+1)*image.height/rows);
   let left=x1,top=y1,right=x0,bottom=y0;
   for(let y=y0+1;y<y1-1;y++)for(let x=x0+1;x<x1-1;x++)if(alpha[(y*image.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<=left||bottom<=top){left=x0;right=x1-1;top=y0;bottom=y1-1;}
   band.push({x:left,y:top,w:right-left+1,h:bottom-top+1,anchorX:((x0+x1)/2-left)/(right-left+1)});
  }frames.push(band);}
  return{image,frames,alpha};
 }
 private frame(sheet:Sheet,row:number,col:number,pixel:number){const rect=sheet.frames[row]?.[col];if(!rect)return null;return{image:sheet.image,sx:rect.x,sy:rect.y,sw:rect.w,sh:rect.h,width:rect.w*pixel,height:rect.h*pixel,anchor:1,anchorX:rect.anchorX};}
 locomotion(appearance:VillagerAppearance,direction:number,walkFrame:number|null,scale:number){const sheet=this.sheets.get(appearance);if(!sheet)return null;return this.frame(sheet,(direction+8)%8,walkFrame===null?0:1+((walkFrame%5+5)%5),2.65*scale/140);}
 action(appearance:VillagerAppearance,action:Action,direction:number,pose:number,scale:number){if(appearance!=='female')return null;const sheet=this.sheets.get('femaleActions');if(!sheet)return null;const row=({chop:0,mine:1,farm:2,orchard:3,build:4} as const)[action],back=direction>=5&&direction<=7;const sprite=this.frame(sheet,row,(back?4:0)+((pose%4+4)%4),2.65*scale/205);return sprite?{...sprite,flip:direction===0||direction===1||direction===7}:null;}
 opaque(image:HTMLImageElement,x:number,y:number){for(const sheet of this.sheets.values())if(sheet.image===image)return sheet.alpha[(y*image.width+x)*4+3]>70;return undefined;}
}
