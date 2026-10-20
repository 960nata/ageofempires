import {SceneArt,type SceneSprite} from './scene-art';
import {ConstructionFrames,CONSTRUCTION_FRAME_COUNT} from './construction-frames';
import {BUILDINGS,FACTIONS,ERAS} from './data';

const control=(id:string)=>document.getElementById(id) as HTMLInputElement;
const art=new SceneArt(),construction=new ConstructionFrames();
const factions=document.getElementById('faction') as HTMLSelectElement;
factions.innerHTML=Object.entries(FACTIONS).map(([id,f])=>`<option value="${id}">${f.name}</option>`).join('');
const buildings=['town','house','barracks','range','stable','mill','lumber','mine','smithy','market','healing','academy','government','wall','gate','keep','siege'];
document.getElementById('building')!.innerHTML=buildings.map(id=>`<option value="${id}">${BUILDINGS[id].name}</option>`).join('');
document.getElementById('cards')!.innerHTML=ERAS.map(era=>`<section><h2>${era}</h2><canvas width="480" height="460"></canvas><small></small></section>`).join('');
const canvases=Array.from(document.querySelectorAll('canvas')),notes=Array.from(document.querySelectorAll('small'));
let request=0,ready=false,gatePlaying=false,gateStart=0;
const gatePlay=document.getElementById('gate-play') as HTMLButtonElement;
gatePlay.onclick=()=>{gatePlaying=!gatePlaying;gateStart=performance.now();control('building').value='gate';gatePlay.textContent=gatePlaying?'Jeda animasi gerbang':'Putar buka–tutup gerbang';gatePlay.setAttribute('aria-pressed',String(gatePlaying));};
control('open').addEventListener('input',()=>{gatePlaying=false;gatePlay.textContent='Putar buka–tutup gerbang';gatePlay.setAttribute('aria-pressed','false');});
async function load(){const id=++request;ready=false;document.getElementById('status')!.textContent='Memuat gambar peradaban…';try{await art.preloadFactions([factions.value]);if(id!==request)return;ready=true;document.getElementById('status')!.textContent='Skala dan titik pijak sama untuk keempat era.';}catch{document.getElementById('status')!.textContent='Gambar belum berhasil dimuat.';}}
factions.addEventListener('change',()=>void load());
const eraFacades=new Set(buildings.filter(id=>!['keep','siege'].includes(id)));
function render(){
 if(ready&&!document.hidden){const faction=factions.value,def=control('building').value,facing=Number(control('facing').value),progress=Number(control('progress').value)/100;
  document.getElementById('progress-label')!.textContent=`${Math.round(progress*100)}%`;
  if(gatePlaying){const phase=((performance.now()-gateStart)/1000)%8;control('open').value=String(100*(phase<2?phase/2:phase<4?1:phase<6?1-(phase-4)/2:0));}
  const sprites=ERAS.map((_,age)=>art.building(age===0&&def==='wall'?'palisade':def,faction==='persian',facing,BUILDINGS[def].radius,25,age,faction,Number(control('open').value)/100,age+1));
  const fit=Math.min(1,...sprites.filter((s):s is SceneSprite=>!!s).map(s=>Math.min(380/s.width,350/s.height)));
  sprites.forEach((sprite,age)=>{const c=canvases[age].getContext('2d')!;c.clearRect(0,0,480,460);c.strokeStyle='#bac89960';c.beginPath();c.moveTo(50,384);c.lineTo(430,384);c.stroke();
   if(!sprite){notes[age].textContent='Memuat gambar…';return;}
   let s=sprite;if(def==='town'&&progress<1)s=art.townStage(faction,age,s.width,facing,Math.min(3,Math.floor(progress*4)))??s;
   const w=s.width*fit,h=s.height*fit;c.save();c.translate(240,384);if(s.flip)c.scale(-1,1);
   if(progress<1&&def!=='town'){const image=construction.frame(s,age,Math.min(CONSTRUCTION_FRAME_COUNT-1,Math.floor(progress*CONSTRUCTION_FRAME_COUNT)),false,def,facing);c.drawImage(image,-w*(s.anchorX??.5),-h*s.anchor,w,h);}
   else c.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,-w*(s.anchorX??.5),-h*s.anchor,w,h);c.restore();
   notes[age].textContent=eraFacades.has(def)?`${def==='wall'?(age===0?'Palisade kayu':`Tembok level ${age}`):BUILDINGS[def].name} · ${Math.round(progress*100)}% dibangun`:'Aset era lengkap belum tersedia untuk tipe bangunan ini.';
  });
 }requestAnimationFrame(render);
}
void load();requestAnimationFrame(render);
