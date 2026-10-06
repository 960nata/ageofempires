/** Production model catalog. Pending entries use proxies until a licensed GLB is integrated. */
export type ModelAssetKind = 'character' | 'building' | 'environment' | 'prop';
export type AssetLicense = 'CC0' | 'CC-BY-4.0' | 'Fab-Standard' | 'custom-commercial' | 'pending';
export interface ModelAssetRecord { id:string; kind:ModelAssetKind; file:string; license:AssetLicense; status:'pending'|'licensed'|'integrated'|'approved'; source?:string; creator?:string; attribution?:string; needsRig?:boolean; animationClips?:string[]; factions?:string[]; notes:string }
const pending=(id:string,kind:ModelAssetKind,file:string,notes:string,extra:Partial<ModelAssetRecord>={}):ModelAssetRecord=>({id,kind,file,license:'pending',status:'pending',notes,...extra});
export const MODEL_ASSETS:ModelAssetRecord[]=[
 pending('worker-common','character','/assets/3d/characters/worker-common.glb','Shared human base mesh with faction clothing and attachments.',{needsRig:true,animationClips:['idle','walk','run','gather','build','repair','hit','death']}),
 pending('spearman-common','character','/assets/3d/characters/spearman-common.glb','Mail/light armour infantry with spear and shield attachments.',{needsRig:true,animationClips:['idle','walk','run','attack','brace','hit','death']}),
 pending('archer-common','character','/assets/3d/characters/archer-common.glb','Bow infantry with draw/release/reload clips.',{needsRig:true,animationClips:['idle','walk','run','aim','shoot','reload','hit','death']}),
 pending('heavy-cavalry-common','character','/assets/3d/characters/heavy-cavalry-common.glb','Rider and horse with synchronized rigs and clips.',{needsRig:true,animationClips:['idle','walk','trot','gallop','charge','attack','hit','death']}),
 pending('english-longbowman','character','/assets/3d/characters/english-longbowman.glb','English campaign-specific longbowman clothing and equipment.',{needsRig:true,factions:['english'],animationClips:['idle','walk','run','aim','shoot','reload','hit','death']}),
 pending('french-gendarme','character','/assets/3d/characters/french-gendarme.glb','Historically reviewed late-period French gendarme and mount.',{needsRig:true,factions:['french'],animationClips:['idle','walk','trot','gallop','charge','attack','hit','death']}),
 pending('castilian-jinete','character','/assets/3d/characters/castilian-jinete.glb','Iberian light cavalry equipment tied to a campaign date.',{needsRig:true,factions:['castilian'],animationClips:['idle','walk','trot','gallop','attack','hit','death']}),
 pending('ayyubid-horse-archer','character','/assets/3d/characters/ayyubid-horse-archer.glb','Ayyubid-period horse archer; clothing and tack reviewed for period.',{needsRig:true,factions:['ayyubid'],animationClips:['idle','walk','trot','gallop','aim','shoot','reload','hit','death']}),
 pending('english-manor-hall','building','/assets/3d/buildings/english-manor-hall.glb','English timber/stone civic building with construction/damage variants.',{factions:['english']}),
 pending('french-town-centre','building','/assets/3d/buildings/french-town-centre.glb','French royal/urban architecture for a specific campaign period.',{factions:['french']}),
 pending('castilian-alcazar','building','/assets/3d/buildings/castilian-alcazar.glb','Castilian frontier/royal building, scenario-date dependent.',{factions:['castilian']}),
 pending('ayyubid-citadel','building','/assets/3d/buildings/ayyubid-citadel.glb','Ayyubid-period fortification, not a generic reskin.',{factions:['ayyubid']}),
 pending('cairo-citadel-landmark','building','/assets/3d/buildings/cairo-citadel-landmark.glb','Scenario-specific Cairo landmark with documented historical period.',{factions:['ayyubid']})
];
export const assetForId=(id:string)=>MODEL_ASSETS.find(asset=>asset.id===id);
export const assetReady=(id:string)=>['licensed','integrated','approved'].includes(assetForId(id)?.status??'pending');
