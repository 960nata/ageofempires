import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const rts=fileURLToPath(new URL('../src/rts/',import.meta.url));
const result=await build({stdin:{contents:"export {World,slotSide} from './world';export {BUILDINGS} from './data';export {MAP_TYPES,isWater,isRiverRock,waterFlow,configureMap} from './map';",resolveDir:rts,loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {World,slotSide,BUILDINGS,MAP_TYPES,isWater,isRiverRock,waterFlow}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const results=[];
const rivals=['ayyubid','steppe','french','chinese'];

// Every map type seats six realms on separate, buildable sites with lanes between their starting buildings.
for(const type of Object.keys(MAP_TYPES))for(const mode of ['skirmish','empires']){
 const w=new World('roman','persian',7,mode,true,rivals,{type,biome:'temperate',seed:7});
 assert.deepEqual(w.realms,[0,1,3,4,5,6],`${type}: six realms`);
 const towns=w.realms.map(s=>w.alive(s,'building').find(b=>b.def==='town'));
 assert(towns.every(Boolean),`${type}/${mode}: every realm has a town`);
 for(let i=0;i<towns.length;i++)for(let j=i+1;j<towns.length;j++)assert(dist(towns[i],towns[j])>60,`${type}/${mode}: towns ${i} and ${j} are ${dist(towns[i],towns[j]).toFixed(0)} apart`);
 const solid=w.entities.filter(b=>b.type==='building'&&b.owner!==2&&!['farm','orchard','road'].includes(b.def));
 let tight=0;for(let i=0;i<solid.length;i++)for(let j=i+1;j<solid.length;j++){const a=solid[i],b=solid[j];if(a.owner!==b.owner)continue;const gap=dist(a,b)-BUILDINGS[a.def].radius-BUILDINGS[b.def].radius;if(gap<3.5)tight++;}
 assert.equal(tight,0,`${type}/${mode}: ${tight} starting building pairs closer than 3.5`);
 const stuck=w.entities.filter(u=>u.type==='unit'&&!w.walkable(u)&&!u.def.includes('boat')&&!u.def.includes('ship'));
 assert.equal(stuck.length,0,`${type}/${mode}: ${stuck.length} units start inside solid cells`);
}
results.push(`MAP: ${Object.keys(MAP_TYPES).length} map types × skirmish/empires seat six realms with walking lanes pass`);

// Rivers and the delta carry rapids whose rocks block the stream, and currents run along the water.
for(const type of ['river','delta']){const w=new World('roman','persian',11,'skirmish',true,[],{type,biome:'temperate',seed:11});void w;
 let rock=0,flowing=0;for(let x=-250;x<250;x+=1)for(let z=-250;z<250;z+=1){if(isRiverRock(x,z))rock++;if(isWater(x,z)){const f=waterFlow(x,z);if(Math.hypot(f.x,f.z)>.3)flowing++;}}
 assert(rock>0,`${type}: rapids have rocks`);assert(flowing>50,`${type}: strong currents exist`);
 results.push(`${type.toUpperCase()}: ${rock} rock samples in rapids, ${flowing} strong-current water samples pass`);}

// Diplomacy table: P6 at war with P1, allied with P2, neutral to P3; allies share vision.
{const w=new World('roman','persian',5,'skirmish',true,rivals,{type:'lakes',biome:'temperate',seed:5});
 const p=(slot)=>slotSide(slot);
 w.setDiplomacy({[`${p(0)}-${p(5)}`]:'enemy',[`${p(1)}-${p(5)}`]:'ally',[`${p(2)}-${p(5)}`]:'neutral',[`${p(0)}-${p(1)}`]:'neutral'});
 assert.equal(w.stance(0,6),'enemy');assert.equal(w.stance(1,6),'ally');assert.equal(w.stance(3,6),'neutral');assert.equal(w.stance(0,1),'neutral');assert.equal(w.stance(4,5),'enemy','unset pairs stay at war');
 w.updateFog();const p2town=w.alive(1,'building').find(b=>b.def==='town');assert(w.canSee(6,p2town),'allies share vision');assert(!w.canSee(0,p2town)||dist(p2town,w.alive(0,'building')[0])<40,'neutral realms do not share vision');
 w.setStance(0,3,'ally',false);assert.equal(w.stance(1,6),'ally','player stance change leaves other pacts alone');
 const saved=World.restore(JSON.parse(JSON.stringify(w.snapshot())));assert.equal(saved.realms.length,6);assert.equal(saved.stance(1,6),'ally');assert.equal(saved.players.length,7);
 results.push('DIPLOMACY: per-pair stances, shared ally vision and six-realm save/restore pass');}

// A unit trapped inside a building walks out instead of freezing.
{const w=new World('french','english',42,'skirmish',false);w.add('building','town',0,-10,0);w.add('building','town',1,60,60);const b=w.add('building','barracks',0,20,0);w.rebuildNav();
 const u=w.add('unit','militia',0,20.3,0.2);assert(!w.walkable(u));for(let t=0;t<3;t+=.05)w.tick(.05);assert(w.walkable(u),'trapped unit escapes the building');
 w.command([u.id],{kind:'move',point:{x:30,z:12}});for(let t=0;t<12;t+=.05)w.tick(.05);assert(dist(u,{x:30,z:12})<1.5,'and then follows orders');void b;
 results.push('UNSTICK: unit inside a building escapes and moves on pass');}

// Building placement keeps a lane; farms may still sit side by side.
{const w=new World('french','english',42,'skirmish',false);w.add('building','town',0,-30,0);w.add('building','town',1,60,60);w.add('building','house',0,0,0);w.rebuildNav();w.updateFog();
 assert(!w.validPlacement('house',{x:5,z:0}),'house cannot touch a house');assert(w.validPlacement('house',{x:9,z:0}),'house with a lane is fine');
 w.add('building','farm',0,0,20);w.updateFog();assert(w.validPlacement('farm',{x:5.6,z:20}),'farms can sit side by side');
 results.push('PLACEMENT: building lanes enforced, fields may touch pass');}

// Six AI-driven realms: a simulated minute stays affordable.
{const w=new World('roman','persian',3,'skirmish',true,rivals,{type:'river',biome:'temperate',seed:3});w.villagerAI='auto';
 const start=performance.now();for(let t=0;t<60;t+=.05)w.tick(.05);const ms=performance.now()-start;
 assert(ms<20000,`60 s of six-realm play took ${ms.toFixed(0)} ms`);
 results.push(`PERF: 60 s of six-realm simulation in ${(ms/1000).toFixed(1)} s (${(ms/1200).toFixed(2)} ms/tick), ${w.entities.length} entities pass`);}

console.log(results.join('\n'));console.log(`${results.length} realm checks passed.`);
