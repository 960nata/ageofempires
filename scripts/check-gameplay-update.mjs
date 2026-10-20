import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const result=await build({stdin:{contents:"export {World} from './world';export {UNITS,BUILDINGS} from './data';export {isWater,MAP_HALF} from './map';export {boatPose} from './marine-motion';",resolveDir:fileURLToPath(new URL('../src/rts/',import.meta.url)),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {World,UNITS,BUILDINGS,isWater,MAP_HALF,boatPose}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const step=(w,seconds)=>{for(let t=0;t<seconds;t+=.05)w.tick(.05);};
function fixture(){const w=new World('roman','persian',42,'skirmish',false);w.villagerAI='manual';w.add('building','town',0,-10,0);w.add('building','town',1,70,70);w.players[0].stock={food:1500,wood:2000,gold:1500,stone:2000};w.players[1].stock={food:0,wood:0,gold:0,stone:0};w.rebuildNav();w.updateFog();return w;}
for(const mode of ['skirmish','empires'])for(let era=0;era<4;era++){
 const w=new World('roman','steppe',42,mode,true,['english'],{type:'borderlands'},era);
 for(const side of w.realms){assert.equal(w.players[side].era,era);for(const e of w.alive(side)){
  if(e.type==='building')assert(BUILDINGS[e.def].era<=era,`${mode}: ${e.def} appeared too early`);
  if(e.type==='unit')assert(w.available(UNITS[e.def],side),`${mode}: ${e.def} is unavailable to era ${era}`);
 }}
 const restored=World.restore(JSON.parse(JSON.stringify(w.snapshot())));assert.equal(restored.players[0].era,era);
}
console.log('ERA: all four starts, equal realms, age-legal units/buildings and save continuation pass');
{
 const w=fixture(),worker=w.add('unit','worker',0,0,0),ranch=w.build('ranch',{x:5,z:7},[worker.id]);assert(ranch,'livestock yard is buildable');
 step(w,155);assert.equal(ranch.progress,1,'worker finishes yard');assert(ranch.resource==='food');
 const start=w.players[0].stock.food;step(w,100);assert(w.players[0].stock.food>start,'keeper must deliver food, not create decoration only');
 ranch.amount=0;const before={...w.players[0].stock};w.updateBuilding(ranch,.05);assert.equal(w.players[0].stock.wood,before.wood-30);assert.equal(w.players[0].stock.food,before.food-35);assert.equal(ranch.amount,360);assert(ranch.growth<.01,'new livestock batch needs time');
 const saved=World.restore(JSON.parse(JSON.stringify(w.snapshot())));assert.equal(saved.get(ranch.id).growth,ranch.growth);
 w.players[0].stock={food:0,wood:0,gold:0,stone:0};ranch.amount=0;w.updateBuilding(ranch,100);assert.equal(ranch.amount,0,'no free restocking');
 console.log('RANCH: construction → tending → food delivery, restocking costs, growth and save pass');
}
{
 const w=fixture(),b=w.add('building','house',0,14,7);w.rebuildNav();const troops=Array.from({length:12},(_,i)=>w.add('unit',i%3===0?'light-horse':'militia',0,i%4*1.6,12+Math.floor(i/4)*2));
 const start=performance.now();w.command(troops.map(u=>u.id),{kind:'move',point:b});assert(performance.now()-start<3000,'group planning should stay bounded');
 const targets=troops.map(u=>u.order?.point);assert(targets.every(Boolean),'each unit gets a reachable slot');
 for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++)assert(distance(targets[i],targets[j])>w.footprint(troops[i])+w.footprint(troops[j]),'no overlapping destinations');
 const before=troops.map((u,i)=>distance(u,targets[i]));step(w,35);assert(troops.every((u,i)=>distance(u,targets[i])<before[i]||distance(u,targets[i])<1),'all units progress toward slots');
 const keeper=w.add('unit','worker',0,0,0),resource=w.node('food',3,0,200);w.command([keeper.id],{kind:'gather',target:resource.id});w.setFormation([...troops.map(u=>u.id),keeper.id],'column');assert.equal(keeper.order.kind,'gather','formation must not interrupt work');
 console.log('FORMATION: obstacle-aware unique slots, troop progress and preserved jobs pass');
}
{
 const w=fixture();let start;for(let x=-MAP_HALF+24;x<MAP_HALF-24&&!start;x+=6)for(let z=-MAP_HALF+24;z<MAP_HALF-24;z+=6)if([-12,0,12].every(dx=>[-12,0,12].every(dz=>isWater(x+dx,z+dz)))){start={x,z};break;}
 assert(start,'water fixture exists');const ships=[0,1,2].map(i=>w.add('unit','fishing-boat',0,start.x+i*3,start.z));w.command(ships.map(u=>u.id),{kind:'move',point:{x:start.x,z:start.z+8}});
 const goals=ships.map(s=>s.order?.point);assert(goals.every(Boolean));assert(new Set(goals.map(p=>`${p.x},${p.z}`)).size===ships.length);for(const goal of goals)assert(isWater(goal.x,goal.z));
 step(w,30);assert(ships.every((s,i)=>distance(s,goals[i])<2),'each boat reaches its separate berth');console.log('FLEET: separate water destinations and actual arrival pass');
}
{
 const w=fixture(),worker=w.add('unit','worker',0,-3,16);w.updateFog();const wall=w.add('building','palisade',0,2.2,12);const sites=w.wallSites({x:2.5,z:12.2},{x:12,z:12});assert.equal(sites[0].x,wall.x);assert.equal(sites[0].z,wall.z);assert(Math.abs(distance(sites[0],sites[1])-2.2)<.001);
 w.node('stone',6.6,12,500);w.rebuildNav();w.updateFog();const built=w.buildWall('palisade',{x:2.2,z:12},{x:15.4,z:12},[worker.id]);assert(built<=1,'wall must stop at obstruction instead of skipping across it');assert(!w.alive(0,'building').some(b=>b.def==='palisade'&&b.x>6.6),'no disconnected foundations beyond the rock');
 console.log('WALL: anchored extension and no silent gaps across obstacles pass');
}
{
 const w=fixture(),crew=w.add('unit','worker',0,0,7);const walls=[];
 for(let i=-4;i<=4;i++){const b=w.add('building','palisade',0,i*2.2,18);b.facing=0;walls.push(b);}
 w.rebuildNav();w.updateFog();const before=w.players[0].stock.wood,gate=w.build('gate',{x:.3,z:18.4},[crew.id]);assert(gate,'gate snaps onto walls before validation');assert.equal(gate.facing,0);assert(gate.replacedWalls.length>=2);const original=gate.replacedWalls.map(b=>b.id);
 const snapshot=World.restore(JSON.parse(JSON.stringify(w.snapshot())));snapshot.cancelBuilding(snapshot.get(gate.id));assert(original.every(id=>snapshot.get(id)?.hp>0),'cancel restores replaced walls after save/load');
 w.cancelBuilding(gate);assert(original.every(id=>w.get(id)?.hp>0));assert(w.players[0].stock.wood<=before,'gate cancellation cannot duplicate wall refunds');
 const replacement=w.build('gate',{x:.3,z:18.4},[crew.id]);assert(replacement);step(w,110);assert.equal(replacement.progress,1,'gate is built by actual worker');assert.equal(replacement.replacedWalls,undefined);
 // Move the builder away and let the automatic gate close before the passage test.
 w.command([crew.id],{kind:'move',point:{x:-4,z:5}});step(w,15);
 const soldier=w.add('unit','militia',0,replacement.x,10);w.command([soldier.id],{kind:'move',point:{x:replacement.x,z:27}});let opened=false;
 for(let i=0;i<600;i++){w.tick(.05);opened ||= (replacement.gateOpen??0)>.95;}
 assert(opened,'friendly approach opens gate');assert(soldier.z>24,'soldier crosses the doorway');step(w,7);assert(replacement.closed,'gate closes after traffic leaves');
 w.setGateMode(replacement,'locked');step(w,2);const locked=replacement.gateOpen;assert.equal(locked,0);
 w.command([soldier.id],{kind:'move',point:{x:replacement.x,z:38}});step(w,15);
 w.add('unit','militia',1,replacement.x,24);w.setGateMode(replacement,'auto');step(w,3);assert.equal(replacement.gateOpen,0,'enemy alone cannot open gate after spatial indexing');
 const extension=w.wallSites(replacement,{x:replacement.x-15,z:replacement.z});assert.equal(extension[0].z,replacement.z);assert.equal(extension[0].x,replacement.x-3.5,'wall extension starts at the gate side');assert(Math.abs(distance(extension[0],extension[1])-2.2)<.001);
 console.log('GATE: snap, construction, cancellation/save, automatic friendly crossing, closure, enemy exclusion and wall connection pass');
}
{
 for(const action of ['row','fish','hunt']){let prev=boatPose(action,0,0);for(let t=.005;t<=7.2;t+=.005){const pose=boatPose(action,t,t);assert(Math.abs(pose-prev)<.15,`${action} must not snap at loop boundary`);prev=pose;}}
 console.log('ANIMATION CLOCK: oar and net cycles remain continuous across loop boundaries');
}
