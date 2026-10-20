import {FactionAnimations,FACTION_ANIMATION_UNITS} from './faction-animations';
import {EraUnitArt} from './era-unit-art';
import {WalkingSprites} from './walking-sprites';
import {CombatSprites} from './combat-sprites';
import {mountedArt} from './mounted-art';
import {VillagerSprites} from './villager-sprites';
import {RegionalArt,signatures} from './regional-art';
import {MarineSprites,boatWidth,type CrewAction} from './marine-sprites';
import {drawMarineLife,drawBoatWake,drawCurrent,drawFishingNet} from './marine-life';
import {rowingRate,boatPose,boatFloat,boatRock,crewAction,unitCycle,headingVector,FISHING_SECONDS} from './marine-motion';
import type {Entity} from './world';
import {navalName} from './naval-data';
import {UNITS,FACTIONS,ERAS,type Faction,type UnitDef} from './data';
import {poses,cyclePose,poseRect} from './pose-sampling';
import {isolatedAtlas} from './isolated-sprites';
import {assetUrl,setSpriteSource} from './assets';
import type {SceneSprite} from './scene-art';
const select=(id:string)=>document.getElementById(id) as HTMLSelectElement;
const factions:Record<string,string>={roman:'Romawi',persian:'Persia',english:'Inggris',french:'Prancis',ayyubid:'Saracen',steppe:'Mongol',chinese:'China',japanese:'Jepang',khmer:'Khmer',castilian:'Castile'};
select('faction').innerHTML=Object.entries(factions).map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
const names=['Pekerja laki-laki','Pekerja perempuan','Pekerja perempuan · hijab','Infanteri','Pemanah','Kavaleri','Pasukan khas peradaban','Perahu nelayan','Kapal awak banyak','Kapal perang','Kapal penjelajah','Kapal transport','Pelabuhan','Awak · per frame','Gerombolan ikan','Tuna','Paus'];
const cards=document.getElementById('cards')!;cards.innerHTML=names.map((name,i)=>`<section class="card ${i>=7?'marine':''}"><h2>${name}</h2><canvas width="380" height="235" aria-label="${name}"></canvas><small>Memuat…</small></section>`).join('');
const canvases=Array.from(cards.querySelectorAll('canvas')),captions=Array.from(cards.querySelectorAll('small')),troops=new FactionAnimations(),eraUnits=new EraUnitArt(),walking=new WalkingSprites(),combat=new CombatSprites(),villagers=new VillagerSprites(),regional=new RegionalArt(),marine=new MarineSprites(),work=new Image();
const roster=document.getElementById('roster')!,rosterVisible=new Set<string>();
let rosterUnits:typeof UNITS[string][]=[],rosterCanvas=new Map<string,HTMLCanvasElement>(),rosterCaptions=new Map<string,HTMLElement>();
const rosterObserver=new IntersectionObserver(entries=>{for(const entry of entries){const unit=(entry.target as HTMLCanvasElement).dataset.unit!;if(entry.isIntersecting)rosterVisible.add(unit);else rosterVisible.delete(unit);}dirty=true;},{rootMargin:'120px'});
let ready=false,paused=false,time=0,previous=0,request=0,activeFaction='roman',dirty=true;
const visible=new Set<number>();
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const i=canvases.indexOf(entry.target as HTMLCanvasElement);if(entry.isIntersecting)visible.add(i);else visible.delete(i);}dirty=true;},{rootMargin:'120px'});
canvases.forEach(canvas=>observer.observe(canvas));
document.querySelectorAll('select').forEach(control=>control.addEventListener('change',()=>{dirty=true;}));
document.addEventListener('visibilitychange',()=>{previous=performance.now();dirty=true;});
const caption=(index:number,text:string)=>{if(captions[index].textContent!==text)captions[index].textContent=text;};
function water(c:CanvasRenderingContext2D,speed=0,direction=0){
 c.clearRect(0,0,380,235);const vector=headingVector(direction);
 for(let i=0;i<15;i++){const phase=unitCycle(time/12+i*.618),x=25+(i*97)%330+(phase-.5)*(12+speed*9)*vector.x,y=40+(i*53)%180+(phase-.5)*(12+speed*9)*vector.y;drawCurrent(c,{x,y},vector,20,phase);}
}

const status=document.getElementById('status')!;
const orchardPreview=new Image();orchardPreview.src=assetUrl('orchard-fruit-tree-full-v1.avif');
const workReady=new Promise<void>((resolve,reject)=>{work.onload=()=>resolve();work.onerror=()=>reject(Error('Aset pekerja tidak tersedia'));setSpriteSource(work,'worker-actions-v1.png');});
function buildRoster(faction:Faction){
 rosterObserver.disconnect();rosterVisible.clear();
 rosterUnits=Object.values(UNITS).filter(u=>!u.naval&&u.id!=='worker'&&u.id!=='trader'&&(!u.factions||u.factions.includes(faction)));
 roster.innerHTML=rosterUnits.map(u=>`<section class="card"><h2>${u.name}</h2><canvas data-unit="${u.id}" width="380" height="235" aria-label="${u.name}"></canvas><small>Memuat…</small></section>`).join('');
 rosterCanvas=new Map(Array.from(roster.querySelectorAll<HTMLCanvasElement>('canvas')).map(c=>[c.dataset.unit!,c]));
 rosterCaptions=new Map(Array.from(roster.querySelectorAll('section')).map((card,i)=>[rosterUnits[i].id,card.querySelector('small')!]));
 for(const canvas of rosterCanvas.values())rosterObserver.observe(canvas);
}
async function load(){const id=++request;ready=false;status.textContent='Memuat aset…';try{const faction=select('faction').value as Faction;await Promise.all([villagers.ready,walking.ready,combat.ready,workReady,troops.preload([faction]),marine.ready,marine.preloadFactions([faction])]);if(id!==request)return;activeFaction=faction;buildRoster(faction);ready=true;dirty=true;status.textContent='Siap · pilih arah dan kegiatan untuk melihat pergantian frame.';}catch{if(id===request)status.textContent='Aset gagal dimuat. Muat ulang halaman untuk mencoba lagi.';}}
document.getElementById('step')!.onclick=()=>{paused=true;document.getElementById('pause')!.textContent='Lanjutkan';dirty=true;time+=select('marine-action').value==='fish'||select('marine-action').value==='hunt'?3.6/24:1/10;};
select('era').addEventListener('change',()=>{time=0;});
select('faction').addEventListener('change',()=>{time=0;void load();});document.getElementById('pause')!.onclick=()=>{paused=!paused;dirty=true;document.getElementById('pause')!.textContent=paused?'Lanjutkan':'Jeda';};
function draw(canvas:HTMLCanvasElement,sprite:SceneSprite|null,orchard=false){const c=canvas.getContext('2d')!;c.clearRect(0,0,380,235);if(orchard&&orchardPreview.complete&&orchardPreview.naturalWidth){const t=125+(Math.sin(time*5)*1.5);c.save();c.translate(242,201);c.rotate(Math.sin(time*7)*.018);c.drawImage(orchardPreview,0,0,orchardPreview.width,orchardPreview.height,-t/2,-t*.98,t,t);c.restore();}c.strokeStyle='#91a78366';c.beginPath();c.moveTo(58,202);c.lineTo(322,202);c.moveTo(190,194);c.lineTo(190,211);c.stroke();if(!sprite)return;const factor=Math.min(1,170/sprite.height,300/sprite.width),w=sprite.width*factor,h=sprite.height*factor;c.save();c.translate(orchard?160:190,202);if(sprite.flip)c.scale(-1,1);c.drawImage(sprite.image,sprite.sx,sprite.sy,sprite.sw,sprite.sh,-w*(sprite.anchorX??.5),-h*sprite.anchor,w,h);c.restore();}
function rosterSprite(unit:UnitDef,faction:string,era:number,direction:number,motion:string):{sprite:SceneSprite|null;route:string}{
 const moving=motion==='walk'||motion==='run',speed=moving?(motion==='run'&&unit.mounted?Math.max(unit.speed,3.3):Math.min(unit.speed,3.15)):0,phase=time*speed/(unit.stride??(unit.mounted?(motion==='run'?4.8:3.8):2.6)),attack=motion==='attack'?time%1.5:-1;
 const native=(sprite:SceneSprite|null,route:string)=>({sprite:eraUnits.style(sprite,faction,era,direction,!!unit.mounted,unit.id),route});
 const generic=(sprite:SceneSprite|null)=>({sprite:eraUnits.style(sprite,faction,era,direction,!!unit.mounted,unit.id,false),route:'aset umum · warna peradaban'});
 if(regional.prefers(faction,unit.id)&&!troops.hasEra(faction,unit.id,era)){const s=regional.troop(faction,unit.id,direction,moving,phase,attack,42,speed,era);if(s)return native(s,'aset khas peradaban');}
 if(troops.has(faction,unit.id)){const s=troops.sprite(faction,unit.id,direction,phase,speed,attack,-1,-1,42,era);if(s){const family=FACTION_ANIMATION_UNITS[faction][unit.id],shared=family==='infantry'?'infanteri':family==='spear'?'penombak':family==='archer'?'pemanah':'kavaleri',mismatch=unit.id==='crossbow'&&faction!=='chinese'?' · masih memakai busur':unit.id==='lancer'?' · tombak belum tergambar':'';return native(s,`${s.eraSpecific?'gambar perlengkapan era':era===2?'atlas Castle':'aset Castle sementara · gambar era ini belum tersedia ·'} ${shared} peradaban${mismatch}`);}}
 const signature=regional.troop(faction,unit.id,direction,moving,phase,attack,42,speed,era);if(signature)return native(signature,'aset khas peradaban');
 const special=mountedArt(unit.id),attackFamily=special?.attack??(unit.id==='ram'?'ram':unit.id==='ballista'?'ballista':['mangonel','trebuchet','bombard'].includes(unit.id)?'mangonel':unit.mounted?'horse':unit.range>3?'archer':unit.role==='spear'?'spear':'sword');
 if(unit.siege||motion==='attack'){const result=generic(combat.sprite(attackFamily,direction,combat.pose(attackFamily,attack),42));if(unit.id==='trebuchet'||unit.id==='bombard')result.route+=' · bentuk mangonel sementara';return result;}
 const family=special?.walk??(unit.mounted?unit.id.startsWith('camel')?'camel':'horse':['explorer','healer'].includes(unit.id)?'worker':unit.range>3?'archer':unit.role==='spear'?'spear':'sword');
 return generic(walking.sprite(family,direction,phase,42,era));
}
function render(now:number){
 const dt=Math.max(0,Math.min(.05,(now-previous)/1000));previous=now;
 if(document.hidden){requestAnimationFrame(render);return;}
 if(ready&&!paused)time+=dt*Number(select('rate').value);
 if(ready&&(!paused||dirty)){
  dirty=false;
  const direction=Number(select('direction').value),era=Number(select('era').value),job=select('job').value as 'walk'|'chop'|'mine'|'farm'|'orchard'|'build',motion=select('motion').value;
  const isWalking=motion==='walk'||motion==='run';
  for(let i=0;i<3;i++){
   if(!visible.has(i))continue;
   let sprite:SceneSprite|null;
   if(job==='walk')sprite=villagers.locomotion(i===0?'male':'female',direction,isWalking?time*UNITS.worker.speed/(UNITS.worker.stride??2.6)*5:null,42,i===2);
   else if(i>0)sprite=villagers.action('female',job,direction,time/(job==='chop'?1.25:job==='mine'?1.4:1.3)*4,42,i===2);
   else{const data=isolatedAtlas('worker-actions-v1')!,row={chop:0,mine:1,farm:2,build:3,orchard:4}[job],sample=cyclePose(time/(job==='chop'?1.25:job==='mine'?1.4:1.3)*4,direction>=5?[4,5,6,7]:[0,1,2,3]),a=data.frames[row*8+sample.from],b=data.frames[row*8+sample.to];sprite=poses.sample(work,poseRect(a),poseRect(b),sample.mix,2.65*42/180,direction>=3&&direction<=5);}
   draw(canvases[i],sprite,job==='orchard');caption(i,job==='walk'?(isWalking?'5 pose jalan + transisi · ritme mengikuti laju':'Diam · kaki berhenti'):'4 pose kerja per tampilan + transisi');
  }
  for(let i=0;i<3;i++){
   if(!visible.has(i+3))continue;
   const family=['infantry','archer','cavalry'][i],unit=activeFaction==='khmer'&&family==='cavalry'?'war-elephant':Object.entries(FACTION_ANIMATION_UNITS[activeFaction]).find(([,f])=>f===family)?.[0];
   const speed=!isWalking?0:motion==='run'&&i===2?4.4:2.6,phase=time*speed/(unit?UNITS[unit]?.stride??(i===2?(motion==='run'?4.8:3.8):2.6):2.6);
   const pose=unit?troops.sprite(activeFaction,unit,direction,phase,speed,motion==='attack'?time%1.5:-1,-1,-1,42,era):null;
   draw(canvases[i+3],eraUnits.style(pose,activeFaction,era,direction,i===2));
   caption(i+3,unit?`${factions[activeFaction]} · ${unit} · ${['Dark','Feudal','Castle','Imperial'][era]}${unit==='war-elephant'?' · kavaleri gajah':''}`:'Belum ada aset kavaleri khusus yang cocok');
  }
  const special=signatures[activeFaction]??({roman:'legionary',persian:'immortal',castilian:'knight'} as Record<string,string>)[activeFaction];
  if(visible.has(6)){
   const speed=!isWalking?0:motion==='run'?4.4:2.6,phase=time*speed/(UNITS[special]?.stride??3.2);
   const unique=rosterSprite(UNITS[special],activeFaction,era,direction,motion).sprite;
   draw(canvases[6],eraUnits.style(unique,activeFaction,era,direction,!!UNITS[special]?.mounted));caption(6,unique?`${factions[activeFaction]} · ${special} · ${['Dark','Feudal','Castle','Imperial'][era]}`:`Memuat ${special}…`);
  }
  const requested=select('marine-action').value as CrewAction,faction=activeFaction as Faction;
  const archer=Object.values(UNITS).find(d=>d.role==='archer'&&(!d.factions||d.factions.includes(faction)));
  for(const [j,def] of ['fishing-boat','whaling-boat','war-ship','scout-ship','transport-ship'].entries()){
   const i=7+j;if(!visible.has(i))continue;
   const c=canvases[i].getContext('2d')!,action=crewAction(def,requested,requested==='row');
   const speed=action==='row'?UNITS[def].speed:0,rowCycle=unitCycle(time*rowingRate(speed)),workTime=time%FISHING_SECONDS;
   const hull=marine.boat(def,direction,boatPose(action,rowCycle,workTime),boatWidth(def,era)*38,faction,era);
   water(c,speed,direction);
   if(hull){
    const factor=Math.min(1,175/hull.height),sprite={...hull,width:hull.width*factor,height:hull.height*factor},p={x:190,y:202+boatFloat(time,2,38,speed)};
    drawBoatWake(c,{x:190,y:202},sprite,direction,speed,rowCycle,38);
    c.save();c.translate(p.x,p.y);c.rotate(boatRock(time,2,speed));c.translate(-p.x,-p.y);
    c.save();c.translate(p.x,p.y);if(sprite.flip)c.scale(-1,1);c.drawImage(sprite.image,sprite.sx,sprite.sy,sprite.sw,sprite.sh,-sprite.width*(sprite.anchorX??.5),-sprite.height*sprite.anchor,sprite.width,sprite.height);c.restore();
    const passenger=def==='transport-ship'?eraUnits.style(troops.sprite(activeFaction,special,direction,0,0,-1,-1,-1,14,era),activeFaction,era,direction,!!UNITS[special]?.mounted):null;
    const gunner=def==='war-ship'&&archer?eraUnits.style(troops.sprite(activeFaction,archer.id,direction,0,0,action==='attack'?time%2.6:-1,-1,-1,14,era),activeFaction,era,direction):null;
    marine.drawCrew(c,p,sprite,def,direction,rowCycle,action,workTime,passenger?[passenger,passenger,passenger]:[],gunner,FACTIONS[faction].accent);
    if(def==='fishing-boat'&&action==='fish'){const vector=headingVector(direction),q={x:p.x+vector.x*110,y:p.y+vector.y*40};drawFishingNet(c,p,q,sprite,38,workTime,marine.prey('fish',0,35),direction);}
    c.restore();
   }
   const label=action==='row'?'dayung serempak · laju kapal':action==='fish'?'lempar → rendam → tarik jaring':action==='hunt'?'harpun → lempar → tarik':action==='attack'?'siaga / menyerang':'diam · terayun ombak';
   caption(i,navalName(def,faction,era)+' · '+label+(action!==requested?' · kegiatan ini tidak tersedia pada kapal ini':''));
  }
  if(visible.has(12)){draw(canvases[12],marine.harbor(285,Math.floor(direction/2),faction,era));caption(12,navalName('harbor',faction,era)+' · 4 tampak');}
  if(visible.has(13)){
   const fishing=requested==='fish'||requested==='hunt',cycle=unitCycle(time*UNITS['fishing-boat'].speed/(UNITS['fishing-boat'].stride??3.5));
   draw(canvases[13],marine.crew(direction,cycle,requested,175,time%FISHING_SECONDS));
   const frame=fishing?Math.floor(time%FISHING_SECONDS/FISHING_SECONDS*24):requested==='row'?Math.floor(cycle*12):0;
   caption(13,`Awak · frame ${frame+1}/${fishing?24:12} · ${fishing?'lempar → tarik → simpan':requested==='row'?'kayuh → pulihkan':'diam'} · transisi antarpose`);
  }
  (['fish','tuna','whale'] as const).forEach((kind,j)=>{
   const i=14+j;if(!visible.has(i))return;
   const c=canvases[i].getContext('2d')!,size=28,prey=marine.prey(kind,0,(kind==='fish'?3.6:kind==='tuna'?5.2:8)*size);water(c);
   if(prey)drawMarineLife(c,{id:kind==='fish'?1:0,def:kind,processUntil:0} as Entity,{x:190,y:160},size,time,prey);
   caption(i,kind==='fish'?'Gerombolan bergerak bersama · ayunan ekor pelan':kind==='tuna'?'8 pose berenang · muncul sekitar tiap 31 detik':'8 pose berenang · muncul sekitar tiap 46 detik');
  });
  for(const unit of rosterUnits){if(!rosterVisible.has(unit.id))continue;const canvas=rosterCanvas.get(unit.id);if(!canvas)continue;const result=rosterSprite(unit,activeFaction,era,direction,motion);draw(canvas,result.sprite);const label=`${ERAS[era]} · ${result.route}${unit.era>era?` · terbuka di ${ERAS[unit.era]}`:''}`;const element=rosterCaptions.get(unit.id);if(element&&element.textContent!==label)element.textContent=label;}
 }
 requestAnimationFrame(render);
}
void load();requestAnimationFrame(render);
