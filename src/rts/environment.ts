import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original, deterministic vegetation geometry; no image or model downloads.
function randomSource(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const treeCache=new Map<number,T.Group>();
export function treeModel(seed:number){
 const variant=Math.abs(seed)%6;
 if(!treeCache.has(variant)){
  const random=randomSource(variant+816),root=new T.Group(),branches:T.BufferGeometry[]=[],leaves:T.BufferGeometry[]=[];
  const conifer=variant<2,cypress=variant===2,height=conifer?5.5:cypress?5.8:4.3;
  const limb=(a:T.Vector3,b:T.Vector3,r:number)=>{const delta=b.clone().sub(a);const g=new T.CylinderGeometry(r*.4,r,delta.length(),9,2);g.applyMatrix4(new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1)));branches.push(g);};
  limb(new T.Vector3(),new T.Vector3(.12,height,0),.21);
  const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(.48,.25,0,1);leafShape.quadraticCurveTo(-.48,.25,0,0);
  const leaf=new T.ShapeGeometry(leafShape,3);leaf.translate(0,-.35,0);const q=new T.Quaternion(),rotation=new T.Euler();
  for(let branch=0;branch<22;branch++){
   const h=1.2+branch/22*(height-1.2),angle=branch*2.399+(random()-.5)*.5;
   const spread=(conifer?(height-h)*.46:cypress?.40:Math.sin((h-1)/(height-1)*Math.PI)*1.65+.2);
   const end=new T.Vector3(Math.cos(angle)*spread,h+.2,Math.sin(angle)*spread);limb(new T.Vector3(0,h-.4,0),end,.035+(height-h)*.007);
   for(let n=0;n<23;n++){
    const radius=Math.sqrt(random())*(cypress?.45:conifer?.55:.85),a=random()*Math.PI*2;
    const position=end.clone().add(new T.Vector3(Math.cos(a)*radius,(random()-.45)*.8,Math.sin(a)*radius));
    rotation.set(random()*Math.PI,random()*Math.PI*2,random()*Math.PI*2);q.setFromEuler(rotation);
    const scale=(conifer?.42:.52)+random()*.27;
    leaves.push(leaf.clone().applyMatrix4(new T.Matrix4().compose(position,q,new T.Vector3(scale,scale,scale))));
   }
  }
  const wood=new T.Mesh(mergeGeometries(branches)!,new T.MeshStandardMaterial({color:'#62543d',roughness:1}));
  const foliage=new T.Mesh(mergeGeometries(leaves)!,new T.MeshStandardMaterial({color:['#3a5934','#526436','#466139','#69733d','#53652f','#7b793f'][variant],roughness:.95,side:T.DoubleSide}));
  wood.castShadow=true;wood.receiveShadow=true;foliage.castShadow=true;foliage.receiveShadow=true;root.add(wood,foliage);treeCache.set(variant,root);
  branches.forEach(g=>g.dispose());leaves.forEach(g=>g.dispose());leaf.dispose();
 }
 const tree=treeCache.get(variant)!.clone();const random=randomSource(seed);tree.rotation.y=random()*Math.PI*2;tree.scale.setScalar(.8+random()*.35);return tree;
}

const textures=new Map<string,T.CanvasTexture>();
export function surfaceTexture(kind:string){
 if(textures.has(kind))return textures.get(kind)!;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!,random=randomSource(974);
 c.fillStyle='#c4beb0';c.fillRect(0,0,256,256);
 if(kind==='limestone'){
  for(let y=0;y<256;y+=32)for(let x=-32;x<256;x+=64){const start=x+(y/32%2)*32;c.fillStyle=`hsl(38 10% ${65+random()*15}%)`;c.fillRect(start+1,y+1,62,30);c.strokeStyle='#6e6b6140';c.strokeRect(start+1,y+1,62,30);}
 }else if(kind==='roof'){
  c.fillStyle='#a99e8a';c.fillRect(0,0,256,256);for(let y=0;y<256;y+=16)for(let x=-16;x<256;x+=32){c.fillStyle=`hsl(35 9% ${55+random()*20}%)`;c.fillRect(x+(y/16%2)*16,y,30,14);c.fillStyle='#f1e1c526';c.fillRect(x+(y/16%2)*16+3,y,3,12);}
 }else if(kind==='oak'){
  c.fillStyle='#b4a184';c.fillRect(0,0,256,256);for(let i=0;i<240;i++){c.strokeStyle=i%2?'#42392e24':'#eddbb433';c.beginPath();const x=random()*256;c.moveTo(x,0);c.bezierCurveTo(x+random()*20,80,x-8,180,x+5,256);c.stroke();}
 }else if(kind==='chainmail'){
  c.fillStyle='#8f9797';c.fillRect(0,0,256,256);for(let y=0;y<256;y+=10)for(let x=0;x<256;x+=10){c.strokeStyle='#394342';c.lineWidth=2;c.beginPath();c.ellipse(x+(y%20?5:0),y,4,3,0,0,Math.PI*2);c.stroke();}
 }else{
  for(let i=0;i<256;i+=3){c.strokeStyle=i%2?'#ffffff0c':'#35302116';c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.moveTo(0,i);c.lineTo(256,i);c.stroke();}
 }
 for(let i=0;i<5000;i++){c.fillStyle=i%2?'#fff8':'#0002';c.globalAlpha=.08;c.fillRect(random()*256,random()*256,1,1);}c.globalAlpha=1;
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;textures.set(kind,texture);return texture;
}

export function terrainTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d')!,random=randomSource(684);
 c.fillStyle='#6f7951';c.fillRect(0,0,1024,1024);
 for(let i=0;i<750;i++){const x=random()*1024,y=random()*1024,r=12+random()*65;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3===0?'#aa966c99':'#45663e66');g.addColorStop(1,'#6f795100');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 for(let i=0;i<170000;i++){const x=random()*1024,y=random()*1024;c.fillStyle=['#bac48a44','#243b2133','#89926655','#c8b68633'][i%4];c.fillRect(x,y,.7+random()*1.5,1+random()*3);}
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}
