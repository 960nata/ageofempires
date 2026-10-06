export type AgeId = 'dark' | 'feudal' | 'castle' | 'imperial';
export type UnitRole = 'worker' | 'scout' | 'spearman' | 'swordsman' | 'archer' | 'crossbowman' | 'light-cavalry' | 'heavy-cavalry' | 'siege' | 'unique';
export type StructureRole = 'economy' | 'military' | 'defense' | 'landmark';

export interface UnitDefinition {
  id: string;
  name: string;
  role: UnitRole;
  age: AgeId;
  cost: Partial<Record<'food' | 'wood' | 'stone' | 'iron', number>>;
  hp: number;
  speed: number;
  attack: number;
  range: number;
  armor: 'unarmored' | 'light' | 'mail' | 'plate' | 'mounted';
  counter: string[];
  description: string;
  unique?: boolean;
}

export interface StructureDefinition {
  id: string;
  name: string;
  role: StructureRole;
  age: AgeId;
  description: string;
}

export interface CivilizationDefinition {
  id: string;
  name: string;
  region: string;
  period: string;
  colors: { primary: string; secondary: string; banner: string };
  architecture: string;
  economicBonus: string;
  militaryIdentity: string;
  landmark: StructureDefinition;
  uniqueUnits: UnitDefinition[];
  roster: UnitDefinition[];
  structures: StructureDefinition[];
  historyNote: string;
}

const commonRoster: UnitDefinition[] = [
  { id:'worker', name:'Villager', role:'worker', age:'dark', cost:{food:50}, hp:40, speed:1.45, attack:3, range:1, armor:'unarmored', counter:['infantry','cavalry'], description:'Gathers resources, builds and repairs.' },
  { id:'scout', name:'Scout', role:'scout', age:'dark', cost:{food:65}, hp:75, speed:3.0, attack:5, range:1, armor:'mounted', counter:['spearmen','walls'], description:'Fast reconnaissance and map control.' },
  { id:'levy-spearman', name:'Levy Spearman', role:'spearman', age:'dark', cost:{food:55,wood:15}, hp:68, speed:1.35, attack:8, range:1, armor:'light', counter:['cavalry'], description:'Inexpensive militia with anti-cavalry reach.' },
  { id:'man-at-arms', name:'Man-at-Arms', role:'swordsman', age:'feudal', cost:{food:65,iron:25}, hp:105, speed:1.2, attack:13, range:1, armor:'mail', counter:['crossbowmen','siege'], description:'Armoured line infantry for holding ground.' },
  { id:'longbowman', name:'Bowman', role:'archer', age:'feudal', cost:{food:40,wood:45}, hp:55, speed:1.3, attack:8, range:8, armor:'unarmored', counter:['cavalry','skirmishers'], description:'Ranged infantry; vulnerable when caught.' },
  { id:'crossbowman', name:'Crossbowman', role:'crossbowman', age:'castle', cost:{food:45,wood:50,iron:15}, hp:62, speed:1.15, attack:15, range:8, armor:'light', counter:['cavalry','siege'], description:'Slow-firing bolt infantry effective against armour.' },
  { id:'light-horse', name:'Light Horse', role:'light-cavalry', age:'feudal', cost:{food:95}, hp:105, speed:2.6, attack:12, range:1, armor:'mounted', counter:['spearmen','walls'], description:'Mobile flanker and raider.' },
  { id:'knight', name:'Knight', role:'heavy-cavalry', age:'castle', cost:{food:140,iron:65}, hp:190, speed:2.1, attack:24, range:1, armor:'plate', counter:['spearmen','crossbows'], description:'Armoured shock cavalry; costly and vulnerable to prepared spear lines.' },
  { id:'mangonel', name:'Mangonel', role:'siege', age:'castle', cost:{wood:160,iron:100}, hp:145, speed:.65, attack:55, range:12, armor:'unarmored', counter:['cavalry','infantry'], description:'Stone-throwing engine for breaking fortifications.' },
  { id:'handgonne', name:'Handgonne Crew', role:'siege', age:'imperial', cost:{food:100,iron:135}, hp:115, speed:.8, attack:42, range:10, armor:'light', counter:['cavalry','siege'], description:'Late-period gunpowder unit; powerful but slow to deploy.' },
];

const structureSet: StructureDefinition[] = [
  {id:'town-centre',name:'Manor Hall',role:'economy',age:'dark',description:'Trains workers and anchors the settlement.'},
  {id:'barracks',name:'Barracks',role:'military',age:'dark',description:'Trains levy infantry and spearmen.'},
  {id:'archery-range',name:'Archery Ground',role:'military',age:'feudal',description:'Trains bow and crossbow units.'},
  {id:'stable',name:'Stable',role:'military',age:'feudal',description:'Trains mounted units.'},
  {id:'blacksmith',name:'Smithy',role:'military',age:'feudal',description:'Researches armour and weapon improvements.'},
  {id:'market',name:'Market Cross',role:'economy',age:'feudal',description:'Trade and resource exchange.'},
  {id:'stone-keep',name:'Stone Keep',role:'defense',age:'castle',description:'Garrison and defend strategic ground.'},
  {id:'siege-yard',name:'Siege Yard',role:'military',age:'castle',description:'Builds engines for attacking fortifications.'},
  {id:'royal-court',name:'Royal Court',role:'landmark',age:'imperial',description:'A civic landmark representing consolidated royal authority.'},
];

const unique = (id:string,name:string,role:UnitRole,age:AgeId,cost:UnitDefinition['cost'],hp:number,attack:number,range:number,speed:number,armor:UnitDefinition['armor'],counter:string[],description:string):UnitDefinition => ({id,name,role,age,cost,hp,attack,range,speed,armor,counter,description,unique:true});

export const CIVILIZATIONS: CivilizationDefinition[] = [
  {
    id:'english', name:'English Crown', region:'England · British Isles', period:'11th–15th century campaign framework',
    colors:{primary:'#334e5c',secondary:'#b49b68',banner:'#a74435'}, architecture:'Limestone keeps, timber halls, steep slate roofs and restrained heraldic cloth.',
    economicBonus:'Manor fields provide a small food yield near the town centre.', militaryIdentity:'Defensive settlements and disciplined bow infantry.',
    landmark:{id:'westminster-hall',name:'Westminster Great Hall',role:'landmark',age:'imperial',description:'A royal assembly landmark. In the campaign, it unlocks an additional civic policy choice.'},
    uniqueUnits:[unique('english-longbow','Welsh Longbowman','unique','castle',{food:55,wood:65},70,17,10,1.45,'light',['cavalry','skirmishers'],'Long-range bow unit representing the use of the longbow in later medieval English armies.'),unique('english-billman','Billman','unique','feudal',{food:65,wood:20},88,13,1,1.35,'mail',['cavalry'],'Polearm infantry suited to holding a line against mounted charges.')],
    roster:commonRoster,structures:[...structureSet], historyNote:'Campaign dates and equipment must be narrowed to a specific reign before final art and voice recording.'
  },
  {
    id:'french', name:'French Crown', region:'Kingdom of France · Western Europe', period:'12th–15th century campaign framework',
    colors:{primary:'#385276',secondary:'#c3b78e',banner:'#b34d43'}, architecture:'Fortified royal towns, pale stone keeps, timber roofs and blue heraldic accents.',
    economicBonus:'Stone quarries near civic centres work slightly faster.', militaryIdentity:'Armoured cavalry supported by mixed retinues and infantry.',
    landmark:{id:'palais-cite',name:'Palais de la Cité',role:'landmark',age:'imperial',description:'A royal residence and administrative landmark; campaign effect depends on the selected historical scenario.'},
    uniqueUnits:[unique('french-gendarme','Gendarme','unique','imperial',{food:155,iron:95},225,30,1,2.0,'plate',['spearmen','crossbows'],'Elite late medieval heavy cavalry; expensive, powerful on open ground.'),unique('french-arbalestier','Arbalestier','unique','castle',{food:55,wood:60},75,19,9,1.05,'mail',['cavalry','siege'],'Armoured crossbow infantry with high armour penetration and a slow reload.')],
    roster:commonRoster,structures:[...structureSet],historyNote:'French crown boundaries and military organisation changed substantially; campaign maps must identify the year and region.'
  },
  {
    id:'castilian', name:'Crown of Castile', region:'Iberian Peninsula', period:'12th–15th century campaign framework',
    colors:{primary:'#8a4939',secondary:'#d2b36e',banner:'#d5c18c'}, architecture:'Stone frontier fortresses, courtyards, tilework used only where regionally evidenced, and muted red standards.',
    economicBonus:'Frontier outposts cost less stone to establish.', militaryIdentity:'Flexible mixed forces shaped by frontier warfare and regional alliances.',
    landmark:{id:'alcazar-segovia',name:'Alcázar of Segovia',role:'landmark',age:'castle',description:'A fortified royal residence landmark; historically grounded mission effects are scenario-specific.'},
    uniqueUnits:[unique('castilian-jinete','Jinete','unique','feudal',{food:105,wood:20},112,14,1,2.7,'mounted',['spearmen','walls'],'Mobile light cavalry associated with Iberian warfare; effective for scouting and raiding.'),unique('castilian-crossbow','Iberian Crossbowman','unique','castle',{food:45,wood:50},70,17,8,1.2,'light',['cavalry'],'Crossbow infantry with a modest mobility advantage.')],
    roster:commonRoster,structures:[...structureSet],historyNote:'The Crown of Castile is not a single unchanged polity across this span; campaign framing must specify monarch and date.'
  },
  {
    id:'ayyubid', name:'Ayyubid Sultanate', region:'Egypt, Syria and neighbouring territories', period:'12th–13th century campaign framework',
    colors:{primary:'#526a4c',secondary:'#c1a66a',banner:'#753e34'}, architecture:'Regional stone citadels, shaded courtyards and geometric ornament based on site-specific references.',
    economicBonus:'Trade routes through owned market sites produce a modest additional income.', militaryIdentity:'Mobile mounted forces and skilled horse archery in appropriate scenarios.',
    landmark:{id:'citadel-cairo',name:'Citadel of Cairo',role:'landmark',age:'castle',description:'A major fortification landmark; use only in scenarios and dates where its construction is historically appropriate.'},
    uniqueUnits:[unique('ayyubid-horse-archer','Mounted Archer','unique','castle',{food:105,wood:65},92,13,7,2.75,'mounted',['spearmen','crossbows'],'Mobile ranged cavalry. Maintain distance and avoid spear formations.'),unique('ayyubid-mamluk','Mamluk Cavalry','unique','imperial',{food:145,iron:70},185,24,1,2.5,'mounted',['spearmen','crossbows'],'Elite mounted warrior representing a distinct military institution; availability is scenario/date dependent.')],
    roster:commonRoster,structures:[...structureSet],historyNote:'Do not blend Ayyubid and Mamluk identities: Mamluk units are date- and polity-specific and require campaign framing.'
  }
];

export const AGE_LABELS: Record<AgeId,string> = {dark:'Dark Age',feudal:'Feudal Age',castle:'Castle Age',imperial:'Imperial Age'};
export const AGE_ORDER: AgeId[] = ['dark','feudal','castle','imperial'];
export const ageIndex = (age:AgeId) => AGE_ORDER.indexOf(age);
