export type Resource = 'food' | 'wood' | 'gold' | 'stone';
export type Stock = Record<Resource, number>;
export type Cost = Partial<Stock>;
export type Side = 0 | 1 | 2;
export type Faction = 'english' | 'french' | 'castilian' | 'ayyubid' | 'steppe' | 'roman' | 'persian';
export const ERAS = ['Dark Age', 'Feudal Age', 'Castle Age', 'Imperial Age'];
export const FACTIONS: Record<Faction, {name:string; accent:string; description:string; landmark:string}> = {
 roman:{name:'Roman Empire',accent:'#a02f29',description:'Legionaries, centurions and equites. Infantry training 15% faster.',landmark:'Imperial Forum'},
 persian:{name:'Persian Empire',accent:'#374587',description:'Immortals, royal archers and cataphracts. Worker construction 15% faster.',landmark:'Apadana Court'},
 english:{name:'English Crown',accent:'#416078',description:'Longbow infantry. Food gather +8%.',landmark:'Great Hall'},
 french:{name:'French Crown',accent:'#345b91',description:'Heavy cavalry. Mounted training 10% faster.',landmark:'Royal Palace'},
 castilian:{name:'Crown of Castile',accent:'#963d32',description:'Light cavalry. Defensive stone costs 12% less.',landmark:'Royal Alcázar'},
 ayyubid:{name:'Ayyubid Sultanate',accent:'#5a7847',description:'Camel troops. Caravan income +10%.',landmark:'Citadel Court'},
 steppe:{name:'Steppe Confederation',accent:'#97653b',description:'Horse archers. Mounted movement +8%.',landmark:'Great Assembly'},
};
export interface UnitDef {id:string; name:string; era:number; building:string; cost:Cost; seconds:number; pop:number; hp:number; speed:number; attack:number; range:number; cooldown:number; armor:number; role:string; model:string; factions?:Faction[]; shield?:boolean; mounted?:boolean; siege?:boolean; sight:number;stride?:number;turnRate?:number;footprint?:number;}
const raw: Array<[string,string,number,string,Cost,number,number,number,number,number,number,number,number,string,string]> = [
 ['worker','Villager',0,'town',{food:45},20,1,45,2.5,3,1.5,1.5,0,'worker','worker'],
 ['explorer','Foot Explorer',0,'town',{food:35},18,1,55,3.4,4,1.5,1.4,0,'scout','explorer'],
 ['scout','Mounted Scout',0,'stable',{food:65},28,2,85,4.6,6,1.8,1.5,0,'cavalry','scout'],
 ['militia','Sword Militia',0,'barracks',{food:45,gold:10},22,1,65,2.6,9,1.6,1.3,0,'infantry','militia'],
 ['swordsman','Sword & Shield',1,'barracks',{food:60,gold:25},28,1,95,2.5,13,1.6,1.3,2,'infantry','swordsman'],
 ['heavy','Armoured Infantry',2,'barracks',{food:75,gold:40},34,1,145,2.1,18,1.6,1.4,5,'heavy','heavy'],
 ['spearman','Levy Spearman',0,'barracks',{food:45,wood:25},24,1,65,2.6,8,2.0,1.5,0,'spear','spearman'],
 ['shield-spear','Shield Spearman',1,'barracks',{food:55,wood:25,gold:10},28,1,90,2.4,10,2.0,1.5,2,'spear','shield-spear'],
 ['pike','Pikeman',2,'barracks',{food:65,wood:35},30,1,100,2.2,13,2.8,1.6,2,'spear','pike'],
 ['archer','Bowman',1,'range',{food:35,wood:45},26,1,55,2.6,9,10,2.0,0,'ranged','archer'],
 ['longbow','Longbowman',2,'range',{food:45,wood:60,gold:15},32,1,65,2.5,14,14,2.3,1,'ranged','longbow'],
 ['crossbow','Crossbowman',2,'range',{food:40,wood:45,gold:30},32,1,70,2.3,20,11,3,1,'crossbow','crossbow'],
 ['javelin','Javelin & Shield',1,'range',{food:35,wood:35},24,1,65,2.6,8,8,2,1,'skirmisher','javelin'],
 ['light-horse','Mounted Swordsman',1,'stable',{food:85,gold:20},32,2,110,4.4,13,2,1.5,1,'cavalry','light-horse'],
 ['lancer','Lance Cavalry',2,'stable',{food:105,gold:45},38,2,155,4.2,20,2.7,1.7,3,'cavalry','lancer'],
 ['knight','Armoured Knight',2,'stable',{food:120,gold:65},42,2,195,3.8,24,2,1.6,5,'heavy-cavalry','knight'],
 ['horse-archer','Horse Archer',2,'stable',{food:95,wood:50,gold:35},38,2,100,4.5,12,10,2.4,1,'mounted-ranged','horse-archer'],
 ['camel-spear','Camel Lancer',2,'camel',{food:100,wood:35,gold:30},38,2,160,4.0,18,2.7,1.8,2,'camel','camel-spear'],
 ['camel-sword','Camel Swordsman',2,'camel',{food:115,gold:45},40,2,175,3.9,22,2,1.6,3,'camel','camel-sword'],
 ['healer','Healer',2,'healing',{gold:80},35,1,55,2.4,0,6,1,0,'healer','healer'],
 ['ram','Battering Ram',2,'siege',{wood:180,gold:70},50,3,380,1.1,65,3.2,3,5,'ram','ram'],
 ['mangonel','Mangonel',2,'siege',{wood:210,gold:110},60,3,180,1.2,42,18,5,2,'siege','mangonel'],
 ['trebuchet','Trebuchet',3,'siege',{wood:280,gold:170},70,3,220,0.9,90,29,7,2,'siege','trebuchet'],
 ['bombard','Bombard',3,'siege',{wood:200,gold:230},75,3,210,1.0,100,22,6,3,'siege','bombard'],
 ['trader','Trade Caravan',1,'market',{wood:80,gold:40},35,1,100,2.8,0,0,1,0,'trader','trader'],
];
export const UNITS: Record<string,UnitDef> = Object.fromEntries(raw.map(([id,name,era,building,cost,seconds,pop,hp,speed,attack,range,cooldown,armor,role,model])=>[id,{id,name,era,building,cost,seconds,pop,hp,speed,attack,range,cooldown,armor,role,model,sight:role==='scout'?24:16,mounted:['cavalry','heavy-cavalry','mounted-ranged','camel'].includes(role),siege:['ram','siege'].includes(role),shield:['swordsman','heavy','shield-spear','javelin','knight'].includes(id)}]));
for(const [id,name,base,faction,cost,hp,attack] of [
 ['legionary','Legionary','heavy','roman',{food:65,gold:40},155,19],
 ['centurion','Centurion','heavy','roman',{food:100,gold:100},210,25],
 ['equites','Equites','light-horse','roman',{food:100,gold:35},135,17],
 ['immortal','Immortal Guard','shield-spear','persian',{food:70,gold:50},145,17],
 ['royal-archer','Royal Archer','archer','persian',{food:55,wood:55,gold:30},80,16],
 ['cataphract','Cataphract','knight','persian',{food:130,gold:85},235,27],
 ['war-elephant','War Elephant','knight','persian',{food:250,gold:150},580,40],
 ['chariot','Royal Chariot','horse-archer','persian',{food:140,wood:100,gold:70},200,18],
] as Array<[string,string,string,Faction,Cost,number,number]>){UNITS[id]={...UNITS[base],id,name,model:id,factions:[faction],era:id==='centurion'||id==='war-elephant'?3:2,cost,hp,attack,seconds:id==='war-elephant'?70:42};}
Object.assign(UNITS['war-elephant'],{pop:4,speed:2.1,range:3,role:'elephant',shield:false,stride:4.6,turnRate:1.7,footprint:1.3});
Object.assign(UNITS.chariot,{pop:3,speed:3.8,shield:false,stride:4.8,turnRate:2.4,footprint:1.1});
UNITS.ballista={...UNITS.mangonel,id:'ballista',name:'Ballista',model:'ballista',attack:45,range:20,seconds:55,cost:{wood:210,gold:110},factions:['roman','persian']};
UNITS.longbow.factions=['english']; UNITS['horse-archer'].factions=['steppe','persian'];
UNITS.crossbow.factions=['english','french','castilian','ayyubid','steppe'];
UNITS.trebuchet.factions=['english','french','castilian','ayyubid','steppe'];
UNITS['camel-spear'].factions=UNITS['camel-sword'].factions=['ayyubid'];
UNITS.knight.factions=['english','french','castilian']; UNITS.bombard.factions=['english','french','castilian'];
export interface BuildingDef {id:string; name:string; era:number; cost:Cost; seconds:number; hp:number; radius:number; model:string; capacity?:number; deposit?:Resource[]; attack?:number; range?:number; garrison?:number; sight?:number; cooldown?:number; splash?:number; projectile?:string; factions?:Faction[];}
export const BUILDINGS:Record<string,BuildingDef> = {
 road:{id:'road',name:'Build Road',era:0,cost:{wood:2,stone:1},seconds:4,hp:180,radius:.9,model:'road'},
 government:{id:'government',name:'Council Hall',era:2,cost:{wood:220,stone:180,gold:100},seconds:90,hp:1300,radius:3.3,model:'government',capacity:10,garrison:8},
 town:{id:'town',name:'Town Center',era:0,cost:{wood:240,stone:120},seconds:100,hp:1400,radius:4,model:'town',capacity:20,deposit:['food','wood','gold','stone'],attack:12,range:12,garrison:10},
 house:{id:'house',name:'House',era:0,cost:{wood:65},seconds:30,hp:320,radius:2.1,model:'house',capacity:10,garrison:4},
 mill:{id:'mill',name:'Windmill & Granary',era:0,cost:{wood:90},seconds:35,hp:420,radius:2.4,model:'mill',deposit:['food']},
 lumber:{id:'lumber',name:'Lumber Camp',era:0,cost:{wood:70},seconds:25,hp:280,radius:1.8,model:'lumber',deposit:['wood']},
 mine:{id:'mine',name:'Mining Camp',era:0,cost:{wood:70},seconds:25,hp:280,radius:1.8,model:'mine',deposit:['gold','stone']},
 orchard:{id:'orchard',name:'Fruit Orchard',era:0,cost:{wood:90},seconds:35,hp:220,radius:2.9,model:'farm'},
 farm:{id:'farm',name:'Farm',era:0,cost:{wood:55},seconds:20,hp:180,radius:2.6,model:'farm'},
 barracks:{id:'barracks',name:'Barracks',era:0,cost:{wood:140},seconds:50,hp:700,radius:3,model:'barracks'},
 range:{id:'range',name:'Archery Ground',era:1,cost:{wood:150},seconds:50,hp:600,radius:3,model:'range'},
 stable:{id:'stable',name:'Stable',era:1,cost:{wood:160},seconds:55,hp:700,radius:3,model:'stable'},
 camel:{id:'camel',name:'Camel Stable',era:2,cost:{wood:160},seconds:55,hp:700,radius:3,model:'camel',factions:['ayyubid']},
 smithy:{id:'smithy',name:'Blacksmith & Tool Repair',era:1,cost:{wood:130},seconds:45,hp:650,radius:2.5,model:'smithy'},
 market:{id:'market',name:'Market',era:1,cost:{wood:150},seconds:50,hp:700,radius:3,model:'market'},
 palisade:{id:'palisade',name:'Palisade',era:1,cost:{wood:20},seconds:15,hp:300,radius:1.1,model:'palisade'},
 tower:{id:'tower',name:'Watchtower',era:0,cost:{wood:100,stone:60},seconds:50,hp:650,radius:1.8,model:'tower',attack:6,range:13,garrison:3,sight:28},
 'archer-tower':{id:'archer-tower',name:'Archer Tower',era:1,cost:{wood:140,stone:140},seconds:70,hp:1000,radius:1.8,model:'tower',attack:24,range:18,garrison:5,sight:24,cooldown:1.8},
 'cannon-tower':{id:'cannon-tower',name:'Cannon Tower',era:3,cost:{stone:300,gold:220},seconds:100,hp:1600,radius:2.1,model:'tower',attack:75,range:21,garrison:4,sight:25,cooldown:4.2,splash:3,projectile:'cannon'},
 wall:{id:'wall',name:'Stone Wall',era:2,cost:{stone:35},seconds:25,hp:1000,radius:1.1,model:'wall'},
 gate:{id:'gate',name:'Stone Gate',era:2,cost:{stone:100,wood:40},seconds:45,hp:1600,radius:2.4,model:'gate'},
 keep:{id:'keep',name:'Castle Keep',era:2,cost:{stone:420,wood:180},seconds:150,hp:2400,radius:4,model:'keep',attack:28,range:17,garrison:15},
 siege:{id:'siege',name:'Siege Workshop',era:2,cost:{wood:200,gold:70},seconds:65,hp:800,radius:3,model:'siege'},
 healing:{id:'healing',name:'Temple & Infirmary',era:2,cost:{wood:140,gold:60},seconds:55,hp:500,radius:2.6,model:'healing'},
 academy:{id:'academy',name:'University',era:2,cost:{wood:200,gold:150},seconds:65,hp:850,radius:3,model:'academy'},
 landmark:{id:'landmark',name:'Civic Landmark',era:2,cost:{wood:250,stone:250,gold:150},seconds:150,hp:2200,radius:4,model:'landmark',capacity:10},
 specialist:{id:'specialist',name:'Trade Landmark',era:3,cost:{wood:200,stone:300,gold:200},seconds:160,hp:1800,radius:3.5,model:'specialist'},
};
export const AGE_COSTS:Cost[]=[{food:420,gold:100},{food:720,gold:320},{food:1050,gold:650}];
export const AGE_TIMES=[90,140,190];
export const costText=(cost:Cost)=>Object.entries(cost).map(([k,v])=>`${v} ${k}`).join(' · ');
export const emptyStock=():Stock=>({food:0,wood:0,gold:0,stone:0});

export const TECHNOLOGIES:Record<string,{name:string;building:string;era:number;cost:Cost;seconds:number;description:string;factions?:Faction[];requires?:string}>= {
 civicservice:{name:'Civic Administration',building:'government',era:2,cost:{food:170,gold:140},seconds:60,description:'Unit training time −10%.'},
 architecture:{name:'Architecture',building:'academy',era:2,cost:{wood:150,gold:120},seconds:55,description:'Worker construction speed +15%.'},
 ballistics:{name:'Ballistics',building:'academy',era:2,cost:{wood:180,gold:140},seconds:60,description:'Ranged projectiles travel 25% faster.'},
 medicine:{name:'Medicine',building:'healing',era:2,cost:{food:150,gold:120},seconds:55,description:'Temple healing rate +50%.'},
 incendiary:{name:'Incendiary Ammunition',building:'siege',era:3,cost:{wood:200,gold:180},seconds:60,description:'Mangonels and trebuchets launch burning projectiles; cosmetic fire with normal siege damage.'},
 agriculture:{name:'Agriculture',building:'mill',era:1,cost:{food:100,wood:75},seconds:45,description:'Food gathering +10%.'},
 forestry:{name:'Forestry',building:'lumber',era:1,cost:{food:100,wood:80},seconds:45,description:'Wood gathering +10%.'},
 mining:{name:'Deep Mining',building:'mine',era:2,cost:{food:130,wood:100},seconds:55,description:'Gold and stone gathering +10%.'},
 logistics:{name:'Logistics',building:'market',era:2,cost:{food:150,gold:100},seconds:55,description:'Worker carrying capacity +4.'},
 masonry:{name:'Masonry',building:'academy',era:3,cost:{stone:150,gold:130},seconds:65,description:'Building health +15%, preserving damage ratio.'},
 drill:{name:'Infantry Drill',building:'barracks',era:1,cost:{food:120,gold:80},seconds:50,description:'Infantry health +10%.'},
 bowcraft:{name:'Improved Bows',building:'range',era:2,cost:{wood:120,gold:100},seconds:50,description:'Foot and mounted missile attack +2.'},
 cavalry:{name:'Cavalry Armour',building:'stable',era:2,cost:{food:160,gold:140},seconds:60,description:'Mounted unit health +10%.'},
 siegecraft:{name:'Siege Engineering',building:'siege',era:2,cost:{wood:160,gold:150},seconds:65,description:'Siege damage +15%.'},
 testudo:{name:'Testudo Tactics',building:'barracks',era:2,cost:{food:150,gold:120},seconds:65,description:'Roman shield units can use Testudo: missile damage ×0.5, movement ×0.7.',factions:['roman'],requires:'drill'},
 royalroad:{name:'Royal Road',building:'market',era:2,cost:{wood:150,gold:150},seconds:65,description:'Persian land movement +8%; caravan income +20%.',factions:['persian'],requires:'logistics'},
};
