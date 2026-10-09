import {poses,cyclePose,poseRect} from './pose-sampling';
import {setSpriteSource} from './assets';
import {isolatedAtlas} from './isolated-sprites';
export type VillagerAppearance='male'|'female';
type Action='chop'|'mine'|'farm'|'orchard'|'build';
type Rect={x:number;y:number;w:number;h:number;anchorX:number;anchorY?:number};
type Sheet={sourceHeight:number;image:HTMLImageElement;frames:Rect[][];alpha:Uint8ClampedArray};
const files={male:'villager-male-locomotion-v1.png',female:'villager-female-locomotion-v1.png',femaleActions:'villager-female-actions-v1.png',femaleHijab:'villager-hijab-locomotion-v1.png',femaleHijabActions:'villager-hijab-actions-v1.png'} as const;

/** Eight authored headings. Column zero is idle; the five moving poses repeat as a planted gait. */
export class VillagerSprites {
 private sheets=new Map<keyof typeof files,Sheet>();
 readonly ready:Promise<void>;
 get count(){return 5;}
 constructor(){this.ready=Promise.all((Object.entries(files) as [keyof typeof files,string][]).map(([key,file])=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.onload=()=>{try{const rows=key.endsWith('Actions')?5:8,cols=key.endsWith('Actions')?8:6;this.sheets.set(key,this.measure(image,rows,cols,file));resolve();}catch(error){reject(error);}};
  image.onerror=()=>reject(new Error('Villager atlas unavailable: '+file));setSpriteSource(image,file);
 }))).then(()=>{});}
 private measure(image:HTMLImageElement,rows:number,cols:number,file:string):Sheet{
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0);
  const alpha=c.getImageData(0,0,image.width,image.height).data,frames:Rect[][]=[];const packed=isolatedAtlas(file);if(packed){for(let row=0;row<rows;row++)frames.push(packed.frames.slice(row*cols,(row+1)*cols).map(r=>({...r,anchorX:(r.cx-r.x)/r.w,anchorY:(r.ground-r.y)/r.h})));return{image,frames,alpha,sourceHeight:packed.sourceHeight};}
  for(let row=0;row<rows;row++){const band:Rect[]=[];for(let col=0;col<cols;col++){
   const x0=Math.floor(col*image.width/cols),x1=Math.floor((col+1)*image.width/cols),y0=Math.floor(row*image.height/rows),y1=Math.floor((row+1)*image.height/rows);
   let left=x1,top=y1,right=x0,bottom=y0;
   for(let y=y0+1;y<y1-1;y++)for(let x=x0+1;x<x1-1;x++)if(alpha[(y*image.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<=left||bottom<=top){left=x0;right=x1-1;top=y0;bottom=y1-1;}
   band.push({x:left,y:top,w:right-left+1,h:bottom-top+1,anchorX:((x0+x1)/2-left)/(right-left+1)});
  }frames.push(band);}
  return{image,frames,alpha,sourceHeight:image.height};
 }
 private frame(sheet:Sheet,row:number,position:number,sequence:readonly number[],pixel:number){const sample=cyclePose(position,sequence),a=sheet.frames[row]?.[sample.from],b=sheet.frames[row]?.[sample.to];if(!a||!b)return null;return poses.sample(sheet.image,poseRect(a),poseRect(b),sample.mix,pixel);}
 locomotion(appearance:VillagerAppearance,direction:number,walkFrame:number|null,scale:number,hijab=false){const sheet=this.sheets.get(appearance==='female'&&hijab?'femaleHijab':appearance);if(!sheet)return null;return this.frame(sheet,(direction+8)%8,walkFrame??0,walkFrame===null?[0]:[1,2,3,4,5],2.65*scale/(appearance==='female'&&hijab?sheet.sourceHeight/8*.85:140));}
 action(appearance:VillagerAppearance,action:Action,direction:number,pose:number,scale:number,hijab=false){if(appearance!=='female')return null;const sheet=this.sheets.get(hijab?'femaleHijabActions':'femaleActions');if(!sheet)return null;const row=({chop:0,mine:1,farm:2,orchard:3,build:4} as const)[action],back=direction>=5&&direction<=7;const sprite=this.frame(sheet,row,pose,back?[4,5,6,7]:[0,1,2,3],2.65*scale/(hijab?sheet.sourceHeight/5*.85:205));return sprite?{...sprite,flip:direction===0||direction===1||direction===7}:null;}
 opaque(image:HTMLImageElement,x:number,y:number){for(const sheet of this.sheets.values())if(sheet.image===image)return sheet.alpha[(y*image.width+x)*4+3]>70;return undefined;}
}
