import {FactionAnimations,FACTION_ANIMATION_UNITS} from './faction-animations';
import {VillagerSprites} from './villager-sprites';
import {RegionalArt,signatures} from './regional-art';
import {MarineSprites,type CrewAction} from './marine-sprites';
import {navalName} from './naval-data';
import {UNITS,FACTIONS,type Faction} from './data';
import {poses,cyclePose,poseRect} from './pose-sampling';
import {isolatedAtlas} from './isolated-sprites';
import {assetUrl,setSpriteSource} from './assets';
import type {SceneSprite} from './scene-art';
const select=(id:string)=>document.getElementById(id) as HTMLSelectElement;
const factions:Record<string,string>={roman:'Romawi',persian:'Persia',english:'Inggris',french:'Prancis',ayyubid:'Saracen',steppe:'Mongol',chinese:'China',japanese:'Jepang',khmer:'Khmer',castilian:'Castile'};
select('faction').innerHTML=Object.entries(factions).map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
const names=['Pekerja laki-laki','Pekerja perempuan','Pekerja perempuan · hijab','Infanteri','Pemanah','Kavaleri','Pasukan khas peradaban','Perahu nelayan','Kapal awak banyak','Kapal perang','Kapal penjelajah','Kapal transport','Pelabuhan','Awak · per frame'];
const cards=document.getElementById('cards')!;cards.innerHTML=names.map((name,i)=>`<section class="card ${i>=7?'marine':''}"><h2>${name}</h2><canvas width="380" height="235" aria-label="${name}"></canvas><small>Memuat…</small></section>`).join('');
const canvases=Array.from(cards.querySelectorAll('canvas')),captions=Array.from(cards.querySelectorAll('small')),troops=new FactionAnimations(),villagers=new VillagerSprites(),regional=new RegionalArt(),marine=new MarineSprites(),work=new Image();
let ready=false,paused=false,time=0,previous=0,request=0,activeFaction='roman';
const status=document.getElementById('status')!;
const orchardPreview=new Image();orchardPreview.src=assetUrl('orchard-fruit-tree-full-v1.avif');
const workReady=new Promise<void>((resolve,reject)=>{work.onload=()=>resolve();work.onerror=()=>reject(Error('Aset pekerja tidak tersedia'));setSpriteSource(work,'worker-actions-v1.png');});
async function load(){const id=++request;ready=false;status.textContent='Memuat aset…';try{const faction=select('faction').value;await Promise.all([villagers.ready,workReady,troops.preload([faction]),marine.ready,marine.preloadFactions([faction])]);if(id!==request)return;activeFaction=faction;ready=true;status.textContent='Siap · pilih arah dan kegiatan untuk melihat pergantian frame.';}catch{if(id===request)status.textContent='Aset gagal dimuat. Muat ulang halaman untuk mencoba lagi.';}}
document.getElementById('step')!.onclick=()=>{paused=true;document.getElementById('pause')!.textContent='Lanjutkan';time+=select('marine-action').value==='fish'||select('marine-action').value==='hunt'?3.6/24:1/10;};
select('naval-era').addEventListener('change',()=>{time=0;});
select('faction').addEventListener('change',()=>{time=0;void load();});document.getElementById('pause')!.onclick=()=>{paused=!paused;document.getElementById('pause')!.textContent=paused?'Lanjutkan':'Jeda';};
function draw(canvas:HTMLCanvasElement,sprite:SceneSprite|null,orchard=false){const c=canvas.getContext('2d')!;c.clearRect(0,0,380,235);if(orchard&&orchardPreview.complete&&orchardPreview.naturalWidth){const t=125+(Math.sin(time*5)*1.5);c.save();c.translate(242,201);c.rotate(Math.sin(time*7)*.018);c.drawImage(orchardPreview,0,0,orchardPreview.width,orchardPreview.height,-t/2,-t*.98,t,t);c.restore();}c.strokeStyle='#91a78366';c.beginPath();c.moveTo(58,202);c.lineTo(322,202);c.moveTo(190,194);c.lineTo(190,211);c.stroke();if(!sprite)return;const factor=Math.min(1,170/sprite.height,300/sprite.width),w=sprite.width*factor,h=sprite.height*factor;c.save();c.translate(orchard?160:190,202);if(sprite.flip)c.scale(-1,1);c.drawImage(sprite.image,sprite.sx,sprite.sy,sprite.sw,sprite.sh,-w*(sprite.anchorX??.5),-h*sprite.anchor,w,h);c.restore();}
function render(now:number){const dt=Math.min(.05,(now-previous)/1000);previous=now;if(ready&&!paused)time+=dt*Number(select('rate').value);if(ready){const direction=Number(select('direction').value),job=select('job').value as 'walk'|'chop'|'mine'|'farm'|'orchard'|'build',motion=select('motion').value;
 for(let i=0;i<3;i++){let sprite:SceneSprite|null;if(job==='walk')sprite=villagers.locomotion(i===0?'male':'female',direction,time*5/1.15,42,i===2);else if(i>0)sprite=villagers.action('female',job,direction,time/(job==='chop'?1.25:job==='mine'?1.4:1.3)*4,42,i===2);else{const data=isolatedAtlas('worker-actions-v1')!,row={chop:0,mine:1,farm:2,build:3,orchard:4}[job],sample=cyclePose(time/(job==='chop'?1.25:job==='mine'?1.4:1.3)*4,direction>=5?[4,5,6,7]:[0,1,2,3]),a=data.frames[row*8+sample.from],b=data.frames[row*8+sample.to];sprite=poses.sample(work,poseRect(a),poseRect(b),sample.mix,2.65*42/180,direction>=3&&direction<=5);}draw(canvases[i],sprite,job==='orchard');captions[i].textContent=job==='walk'?'5 pose jalan + transisi':'4 pose kerja per tampilan + transisi';}
 for(let i=0;i<3;i++){const family=['infantry','archer','cavalry'][i],unit=activeFaction==='khmer'&&family==='cavalry'?'war-elephant':Object.entries(FACTION_ANIMATION_UNITS[activeFaction]).find(([,f])=>f===family)?.[0],speed=motion==='idle'||motion==='attack'?0:motion==='run'&&i===2?4.4:2.6,phase=time*speed/(i===2?3.8:2.6),sprite=unit?troops.sprite(activeFaction,unit,direction,phase,speed,motion==='attack'?time%1.5:-1,-1,-1,42):null;draw(canvases[i+3],sprite);captions[i+3].textContent=unit?`${factions[activeFaction]} · ${unit}${unit==='war-elephant'?' · kavaleri gajah':''}`:'Belum ada aset kavaleri khusus yang cocok';}
  const special=signatures[activeFaction]??({roman:'legionary',persian:'immortal',castilian:'knight'} as Record<string,string>)[activeFaction],speed=motion==='idle'||motion==='attack'?0:motion==='run'?4.4:2.6,phase=time*speed/3.2;
  const unique=regional.troop(activeFaction,special,direction,speed>0,phase,motion==='attack'?time%1.5:-1,42,speed)??troops.sprite(activeFaction,special,direction,phase,speed,motion==='attack'?time%1.5:-1,-1,-1,42);
  draw(canvases[6],unique);captions[6].textContent=unique?`${factions[activeFaction]} · ${special}`:`Memuat ${special}…`;
  const action=select('marine-action').value as CrewAction,era=Number(select('naval-era').value),faction=activeFaction as Faction;
  const fishAction=action==='fish'||action==='hunt',crewFrame=fishAction?Math.floor(time%3.6/3.6*24):action==='row'?Math.floor(time*10)%12:0;
  const archer=Object.values(UNITS).find(d=>d.role==='archer'&&(!d.factions||d.factions.includes(faction)));
  for(const [j,def] of ['fishing-boat','whaling-boat','war-ship','scout-ship','transport-ship'].entries()){
   const i=7+j,c=canvases[i].getContext('2d')!,boatPhase=def==='whaling-boat'?action==='row'?1+Math.floor(time*2)%2:fishAction?3+Math.min(2,Math.floor(time%3.6/1.2)):0:def==='scout-ship'&&action==='row'?1+Math.floor(time*2)%2:0,hull=marine.boat(def,direction,boatPhase,def==='scout-ship'?225:285,faction,era);c.clearRect(0,0,380,235);
   if(hull){const factor=Math.min(1,175/hull.height),sprite={...hull,width:hull.width*factor,height:hull.height*factor};c.save();c.translate(190,202);if(sprite.flip)c.scale(-1,1);c.drawImage(sprite.image,sprite.sx,sprite.sy,sprite.sw,sprite.sh,-sprite.width/2,-sprite.height*sprite.anchor,sprite.width,sprite.height);c.restore();
    const passenger=troops.sprite(activeFaction,special,direction,0,0,-1,-1,-1,14),gunner=archer?troops.sprite(activeFaction,archer.id,direction,0,0,action==='attack'?time%2.6:-1,-1,-1,14):null;
    marine.drawCrew(c,{x:190,y:202},sprite,def,direction,time,action,time%3.6,def==='transport-ship'&&passenger?[passenger,passenger,passenger]:[],def==='war-ship'?gunner:null,FACTIONS[faction].accent);
   }
   captions[i].textContent=navalName(def,faction,era)+' · '+(def==='whaling-boat'?'6 pose perahu · harpun → lempar → tarik':def==='scout-ship'?'6 pose perahu · dayung / jelajah':action==='row'?'12 frame dayung':fishAction?'24 frame jaring':'awak diam / siaga');
  }
  draw(canvases[12],marine.harbor(285,Math.floor(direction/2),faction,era));captions[12].textContent=navalName('harbor',faction,era)+' · 4 tampak';
  draw(canvases[13],marine.crew(direction,time,action,175,time%3.6));captions[13].textContent=`Awak bersama · frame ${crewFrame+1}/${fishAction?24:12} · ${fishAction?'lempar → tarik → simpan':action==='row'?'kayuh → tarik':'diam'} · 8 arah`;
 }requestAnimationFrame(render);}
void load();requestAnimationFrame(render);
