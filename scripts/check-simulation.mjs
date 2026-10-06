import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const rts=fileURLToPath(new URL('../src/rts/',import.meta.url));
const result=await build({stdin:{contents:"export {World} from './world';export {UNITS} from './data';",resolveDir:rts,loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {World,UNITS}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
{
 function fixture(){const w=new World('french','english',42,'skirmish',false);w.add('building','town',0,-10,0);w.add('building','town',1,50,50);w.players[0].stock={food:2000,wood:2000,gold:2000,stone:2000};w.players[1].stock={food:0,wood:0,gold:0,stone:0};w.rebuildNav();w.updateFog();return w;}
 function step(w,s){for(let t=0;t<s;t+=.05)w.tick(.05);}
 const results=[];
 {const w=fixture(),u=w.add('unit','worker',0,0,0),n=w.node('wood',2,0,300);w.players[0].stock.wood=100;w.command([u.id],{kind:'gather',target:n.id});step(w,5);assert.equal(u.cargo.wood??0,0,'tree must be felled before wood is collected');step(w,7);assert.equal(w.players[0].stock.wood,100);assert(u.cargo.wood>0);assert(Math.abs(n.amount+u.cargo.wood-300)<.001);step(w,30);if(w.players[0].stock.wood<=100)console.log('DEPOSIT DEBUG',JSON.stringify({worker:u,stock:w.players[0].stock,drop:w.dropoff(u,'wood')?.id,path:w.path(u,{x:-4.7,z:0})}));assert(w.players[0].stock.wood>100,'Cargo should reach a real dropoff');assert(Math.abs(w.players[0].stock.wood+u.cargo.wood+n.amount-400)<.001);results.push('ECO: gathering, cargo conservation and deposit pass');}
 {const w=fixture(),town=w.entities.find(e=>e.def==='town'&&e.owner===0);const before=w.alive(0,'unit').length;assert(w.train(town,'worker'));step(w,10);assert.equal(w.alive(0,'unit').length,before);step(w,12);assert.equal(w.alive(0,'unit').length,before+1);results.push('PRODUCTION: recruitment time and spawn pass');}
 {const w=fixture(),u=w.add('unit','worker',0,0,0),b=w.build('house',{x:4,z:0},[u.id]);assert(b);assert.equal(w.pop(0).cap,20);step(w,40);assert(b.progress>=1);assert.equal(w.pop(0).cap,30);results.push('BUILD: worker construction and population completion pass');}
 {const w=fixture();w.players[0].era=2;const b=w.add('building','keep',0,0,0);assert(w.research(b,'fortify'));step(w,91);assert.equal(b.tier,1,'fortify needs villagers on site');results.push('UPGRADE: no crew, no fortification pass');}
 {const w=fixture();w.players[0].era=2;const b=w.add('building','keep',0,0,0);b.hp=b.maxHp*.5;const crew=[0,1,2].map(i=>w.add('unit','worker',0,5+i,4));w.rebuildNav();assert(w.research(b,'fortify'));w.command(crew.map(u=>u.id),{kind:'repair',target:b.id});step(w,150);assert.equal(b.tier,2);assert(Math.abs(b.hp/b.maxHp-1)<.001,'crew repairs to full before fortifying');results.push('UPGRADE: crew repairs then fortifies to tier 2 pass');}
 {const w=fixture(),u=w.add('unit','swordsman',0,0,0),enemy=w.add('unit','militia',1,1.3,0);w.updateFog();w.command([u.id],{kind:'attack',target:enemy.id});const before=enemy.hp;step(w,2);assert(enemy.hp<before);results.push('COMBAT: actual melee damage pass');}
 {const w=fixture(),u=w.add('unit','worker',0,0,0),n=w.node('stone',2,0,300);w.command([u.id],{kind:'gather',target:n.id});step(w,5);const saved=w.snapshot();const restored=World.restore(JSON.parse(JSON.stringify(saved)));assert.equal(restored.get(u.id).cargo.stone,w.get(u.id).cargo.stone);step(w,35);step(restored,35);assert(Math.abs(w.players[0].stock.stone-restored.players[0].stock.stone)<.001);assert(Math.abs(w.get(u.id).cargo.stone-restored.get(u.id).cargo.stone)<.001);results.push('SAVE: cargo/job continuation without duplicate deposit pass');}
 {const w=fixture(),b=w.add('building','wall',0,0,0);w.rebuildNav();assert.equal(w.walkable({x:0,z:0}),false);w.hit(b,99999);assert.equal(w.walkable({x:0,z:0}),true);results.push('SIEGE: destroyed wall removes navigation blocker pass');}
 {const w=fixture();const before=w.players[0].stock.gold;w.exchange(0,'food',true);w.exchange(0,'food',false);assert(w.players[0].stock.gold<before);results.push('MARKET: no arbitrage pass');}
 assert.equal(Object.keys(UNITS).length,34);results.push('DATA: unit roster size pass');
 console.log(results.join('\n'));console.log(`${results.length} meaningful checks passed.`);
}
