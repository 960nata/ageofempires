import type {Faction} from './data';

/** Gameplay eras are a shared progression, not a claim that these fleets coexisted. */
export const NAVAL_CIVILIZATIONS:Record<Faction,{harbors:string[];fishers:string[];warships:string[];identity:string;hp:number;speed:number;damage:number;gather:number;weapon:'arrow'|'bolt'|'cannon'|'fire'}>={
 roman:{harbors:['River Landing','Portus Dock','Stone Portus','Imperial Arsenal'],fishers:['River Skiff','Coastal Netter','Mediterranean Netter','Deepwater Fishing Galley'],warships:['River Guard','Liburnian Patrol','War Galley','Scorpion Galley'],identity:'Armoured galleys · slower sailing',hp:1.12,speed:.92,damage:1,gather:1,weapon:'bolt'},
 persian:{harbors:['Reed Landing','Gulf Dock','Royal Quay','Grand Gulf Arsenal'],fishers:['Reed Skiff','Gulf Netter','Sail Netter','Ocean Fishing Dhow'],warships:['River Guard','Gulf Patrol','War Dhow','Royal War Dhow'],identity:'Larger holds · heavier vessels',hp:1.06,speed:.94,damage:1,gather:1,weapon:'bolt'},
 english:{harbors:['Timber Landing','Oak Dock','Fortified Wharf','Royal Dockyard'],fishers:['Oak Skiff','Coastal Coble','Fishing Cog','Deepwater Fishing Buss'],warships:['River Guard','Patrol Cog','War Cog','Royal Cannon Carrack'],identity:'Long range · slower reload',hp:1,speed:1,damage:1,gather:1,weapon:'cannon'},
 french:{harbors:['River Landing','Merchant Dock','Stone Arsenal','Royal Grand Arsenal'],fishers:['River Punt','Coastal Barque','Fishing Barque','Deepwater Fishing Barque'],warships:['River Guard','Coastal Galley','Royal Galley','Artillery Galley'],identity:'Strong broadsides · slower speed',hp:1,speed:.93,damage:1.1,gather:1,weapon:'cannon'},
 castilian:{harbors:['Beach Landing','Coastal Dock','Fortified Atarazanas','Royal Atarazanas'],fishers:['Coastal Skiff','Lateen Netter','Fishing Caravel','Ocean Fishing Caravel'],warships:['River Guard','Patrol Galley','War Caravel','Cannon Galleon'],identity:'Fast ocean hulls · lighter armour',hp:.92,speed:1.1,damage:1,gather:1,weapon:'cannon'},
 ayyubid:{harbors:['Palm Landing','Sultanate Dock','Stone Arsenal','Grand Sultanate Arsenal'],fishers:['Palm Skiff','Lateen Netter','Fishing Dhow','Deepwater Fishing Dhow'],warships:['River Guard','Patrol Dhow','Fire Galley','Incendiary Galley'],identity:'Incendiary ships · shorter range',hp:1,speed:1.03,damage:1,gather:1,weapon:'fire'},
 steppe:{harbors:['River Camp','Pontoon Dock','River Supply Yard','Fortified River Arsenal'],fishers:['Hide River Boat','Timber River Boat','River Netter','Expedition Netter'],warships:['River Guard','River Patrol','Expedition Warship','Armoured Expedition Ship'],identity:'Quick river fleets · lighter hulls',hp:.88,speed:1.14,damage:1,gather:1,weapon:'bolt'},
 chinese:{harbors:['Bamboo Landing','Timber Dock','Tiled Naval Yard','Imperial Naval Arsenal'],fishers:['Bamboo Skiff','Fishing Sampan','Fishing Junk','Deepwater Fishing Junk'],warships:['River Guard','Patrol Junk','War Junk','Imperial Cannon Junk'],identity:'Tough bulkheads · slower sailing',hp:1.1,speed:.95,damage:1,gather:1,weapon:'cannon'},
 japanese:{harbors:['Beach Landing','Timber Wharf','Stone Naval Yard','Fortified Naval Arsenal'],fishers:['River Skiff','Coastal Netter','Fishing Wasen','Ocean Fishing Wasen'],warships:['River Guard','Kobaya Patrol','Sekibune','Armoured Atakebune'],identity:'Fast reload · shorter reach',hp:1,speed:1.03,damage:.95,gather:1,weapon:'arrow'},
 khmer:{harbors:['Stilt Landing','River Dock','Temple Quay','Royal River Arsenal'],fishers:['Dugout Canoe','River Netter','Canopied Netter','Large River Netter'],warships:['River Guard','River Longboat','War Longboat','Royal War Barge'],identity:'Fast river supply · lighter hulls',hp:.95,speed:1.04,damage:1,gather:1,weapon:'bolt'},
};

export const navalEra=(age:number)=>Math.max(0,Math.min(3,Math.floor(age)));
export const isNaval=(def:string)=>['fishing-boat','whaling-boat','war-ship','scout-ship','transport-ship'].includes(def);
const SCOUT_NAMES=['River Skiff Scout','Coastal Scout','Sailing Scout','Ocean Explorer'];
const TRANSPORT_NAMES=['River Troop Ferry','Coastal Troop Transport','Cog Troop Transport','Deepwater Troop Transport'];
const WHALER_NAMES=['Harpoon Skiff','Coastal Whaler','Whaling Galley','Deepwater Whaler'];
export function navalName(def:string,faction:Faction,age:number){const p=NAVAL_CIVILIZATIONS[faction],era=navalEra(age);return def==='harbor'?p.harbors[era]:def==='war-ship'?p.warships[era]:def==='scout-ship'?`${p.fishers[era]} · ${SCOUT_NAMES[era]}`:def==='transport-ship'?`${p.fishers[era]} · ${TRANSPORT_NAMES[era]}`:def==='fishing-boat'?p.fishers[era]:`${p.fishers[era]} · ${WHALER_NAMES[era]}`;}
export function navalStats(def:string,faction:Faction,age:number,tech:readonly string[]=[]){
 const era=navalEra(age),p=NAVAL_CIVILIZATIONS[faction],war=def==='war-ship',hunting=def==='whaling-boat',scout=def==='scout-ship',transport=def==='transport-ship';
 const hp=(war?[170,230,340,470][era]:scout?[75,95,120,145][era]:transport?[150,200,285,360][era]:hunting?[170,195,230,285][era]:[90,110,140,175][era])*p.hp;
 const range=war?[8,12,15,18][era]+(faction==='english'?2:faction==='japanese'||faction==='ayyubid'?-1:0):0;
 return{hp:Math.round(hp*(tech.includes('shipwright')?1.12:1)),speed:(war?[3.4,3.3,3.1,2.9][era]:scout?4.4+era*.1:transport?2.9:hunting?2.8:3.2+.12*era)*p.speed,
  damage:war?[8,14,25,38][era]*p.damage*(tech.includes('navalordnance')?1.1:1):0,range,cooldown:(era===3&&p.weapon==='cannon'?4.8:2.6)*(faction==='english'?1.1:faction==='japanese'?.88:1),
  capacity:Math.round((hunting?[65,80,105,135][era]:[28,40,55,72][era])*(faction==='persian'?1.15:1)*(tech.includes('navalholds')?1.25:1)),
  passengers:transport?[6,10,14,20][era]:0,gather:(1+era*.08)*p.gather,armor:war?[0,1,3,5][era]:era>1?1:0,
  weapon:era===3?p.weapon:era===2&&faction==='ayyubid'?'fire':'arrow',splash:era===3&&p.weapon==='cannon'?2.1:era===2&&faction==='ayyubid'?1.1:0};
}
