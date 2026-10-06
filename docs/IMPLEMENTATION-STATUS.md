# Implementation status — 0.20.1

Version 0.20.1 adds reachable work positions, nearby resource continuation, congestion recovery, and a passing villager-work simulation regression check. See VILLAGER-WORK-VERIFICATION.md. Version 0.20.0 adds gendered eight-heading villager idle/walk atlases and female work cycles. Current status and open acceptance criteria: see [QUALITY-AUDIT-2026-10-06.md](QUALITY-AUDIT-2026-10-06.md). Version 0.19.0 fixes route search cost, local unit lookup, AI empty-army handling, cliff occlusion, building contact shadows and fog raster cost. Browser visual acceptance and measured MacBook FPS remain pending. The historical entries below describe earlier versions.

## Active build
- Entry: src/main.ts → src/rts/app.ts → src/rts/iso-view.ts.
- Canvas 2D with original generated raster sprites. Previous Three.js view and GLBs remain in source and are not loaded by this entry.
- Local URL: http://127.0.0.1:5173/. Use Roman–Persian frontier for a new developed city; Continue saved game preserves the stored settlement.

## Added in 0.14.0
- Every building facade used for construction gets sixteen lazily baked raster poses. The renderer blends neighboring poses according to actual simulation progress. The ten-facade cache limits memory use; the source art still comes from the active faction, age and facing.
- Foundation, scaffold, wall and roof content is stored inside each frame rather than redrawn as continuous live geometry. Scaffold opacity falls near completion.
- Builder impact effects follow the existing worker action cycle and only trigger for villagers actually assigned to build the structure.
- These are generated composition frames from the final building art. Independently illustrated construction keyframes and browser visual acceptance remain open art tasks.

## Added in 0.13.0
- Buildings under construction reveal from their ground line in five progress phases: foundation, frame, walls, roof and finishing. The earlier full-building alpha fade is removed.
- Growing timber scaffolds add posts/cross-braces with progress; material stacks sit near the footprint and hammer glints cycle along the wall. Scaffold palette follows the current age material family.
- The construction sprite is selected using the owner's faction, age and building facing, so current Dark/Feudal/Castle/Imperial art is used throughout construction.
- Simulation timing, costs, HP and worker-rate formulas were not changed. Visual acceptance remains pending; generated sprite masks can make the cutaway/scaffold look vary by building silhouette.

## Added in 0.12.0
- Core Roman/Persian settlement sprites change at Dark, Feudal, Castle and Imperial ages. Dark, Feudal and Imperial art each include four generated view files per faction and twelve building roles; Castle uses the prior settlement sprite pack. Facings and player age are read directly from game state, and the active faction/age art loads on demand.
- Fields show four growth stages from tilled soil to ripe wheat; each crop marker is depth-sorted against workers and buildings. Farmers are sent to plot positions; fruit trees use four facing views and regrow on the existing economy timer.
- Added direction and depletion variants for gold/stone, sparse grass tufts and a grounded tree-fall transform.
- Limits: image-generation facades are related variants, not renders of one shared 3D model, so exact rotation identity is not guaranteed. Only twelve core building roles receive Dark/Feudal/Imperial replacement art; Castle art remains the prior set and wall/gate/tower/utility art does not independently advance with age. Crop density and worker masking have not been visually reviewed in the browser. No premium asset license was purchased.

## Added in 0.11.0
- Replaced upright building art with cohesive Roman/Persian settlement, utility, fortification and landmark packs. Each upright structure can face South/East/North/West using R during placement or Rotate building after selection. Placement shows its actual facade; saves retain orientation and recruitment exits prefer the facing side. Farms and roads retain their ground artwork. Camel stable shares stable art; both landmark roles share the regional complex.
- 17 new unchanged original PNGs (50 integrated atlases total). Alpha-component crop metadata avoids clipped roofs, tree crowns and adjacent sprites. Scene objects use alpha-aware picking, consistent projected foundations and feathered contact shadows.
- Shared terrain mesh is rasterized into a cached continuous bitmap with interpolated lighting and slope materials; removed stroked/antialiased triangle borders. Added western dry ravine, limestone banks and shoreline boulders. Scenery rocks are decorative; existing gold/stone nodes remain mineable. Terrain geometry is shared with navigation; old saves retain their entities on the updated map.
- Replaced live trees with 10 woodland species variants selected by region, retaining existing chop/fall/log/stump lifecycle. Ground litter stays feathered. Added shallow-to-deep coastal color and time-driven foam/specular ripples.
- Damaged buildings gain cached scorch/crack stages and fire/smoke from four-frame VFX. Combat destruction creates collapsing sections, dust and persistent low debris. Canceled construction does not create ruins; rebuilding at the site hides old debris. Repair reverses damage art as HP recovers.
- Compilation: TypeScript and production bundle checks only; no gameplay tests or browser visual acceptance. The previous browser policy restriction remains in effect. Art direction and perspective consistency across generated rotations are approximate; variants can differ in details. This is original generated 2.5D art, not an exact AoE reproduction or premium licensed asset pack. No measured FPS claim.

## Added in 0.10.0
- War Elephant and Royal Chariot use dedicated walk, idle and eight-sample attack art, replacing generic horse sprites. These existing Persian units retain their recruitment ages/costs: Royal Chariot from Castle Age; War Elephant from Imperial Age, both from the stable.
- Four new PNG atlases bring the integrated total to 33. Sprite row boundaries follow measured alpha gaps; the malformed walking elephant east row is never rendered. East mirrors its complete west row, and selected other headings are also mirrored.
- Calibrated elephant height / chariot side length; special stride lengths and turn rates; increased chariot spacing. The same mounted-art lookup drives stable training. Projectile launch/target heights distinguish chariot crews and elephant bodies.
- Limits: generated chariot horse/crew anatomy and gait can vary, some source directions remain approximate, and walk-to-attack registration needs further visual review. Source art does not establish professional animation continuity. Static navigation still uses the shared point grid; unit spacing alone is not full vehicle collision.

## Added in 0.9.0
- Three mounted attack families: camel-spear, camel-sword and horse-archer. Each selected atlas contains eight source direction rows × eight source pose cells. Animation uses four pre-release stages, release, follow-through and recovery. Some direction rows are mirrored, including weapon handedness.
- Horse archer and camel swordsman now have dedicated eight-sample walking art and use their attack atlas resting pose while idle. Cavalry training decorations use the actual queued horse/camel/bow family.
- A shared 0.5-second attack windup drives simulation release and sprite timing. Float tolerance fixes release slipping by one simulation tick.
- Projectile origins account for mounted/foot/tower launch height; projected endpoint arcs no longer follow ground elevations under the arrow. Arc height scales with zoom, arrow and flame-trail direction follow the tangent, and shots obey player visibility.
- Combat sprites now support alpha-aware selection. Total integrated PNG atlas count: 29. Added files: camel-spear-attack-v1.png, camel-sword-attack-v1.png, horse-archer-attack-v1.png, horse-archer-walk-v1.png, camel-sword-walk-v1.png.
- The first camel-sword walk generation had an irregular grid and was rejected. The replacement is integrated; originals remain unchanged. Metadata extraction found 64 nonempty source cells in every selected new sheet.
- Limits: generated poses still contain directional/anatomical inconsistencies and some tight weapon margins; eight source cells do not establish fluid professional animation. Exact bow/spear aim may differ from the gameplay target direction in the source artwork. Elephant and chariot still lack correct dedicated art. No full visual acceptance or gameplay tests were performed.

## Added in 0.8.1
- Movement displacement now follows a bounded steering direction, with braking at arrival/strong turns, stable passing preferences and no forced tick pause between nearby waypoints. Four-corner segment clearance reduces diagonal corner clipping. Crowded passages still need gameplay review; no assertion that all stalls are solved.
- Effect, projectile, garrison, tree-fall and building animation timing uses the same interpolated clock as unit positions. Arrows orient along their curved flight trajectory.
- Workers retain walking frames until visual motion settles. Camel and mounted ranged units retain a mounted resting sprite during attacks instead of swapping to foot infantry. This is a fallback, not a new mounted attack animation.
- Subtle shore ripples render underneath fog. Asset count remains 24.
- Local development server restarted independently of the short-lived command session. Binding confirmed on 127.0.0.1:5173; browser visual inspection remains unavailable under the prior policy restriction.

## Added in 0.8.0
- Six generated walking atlases with eight source pose cells for each of eight headings, replacing the old 0–1–2–1 walk loop in the active renderer. Worker, sword, spear, archer, horse and camel families are integrated. Crops and torso pivots measured from source alpha; originals preserved. Three directions mirror other rows because their generated headings were inconsistent. Mirroring also changes equipment handedness.
- Positions interpolate between consecutive 20 Hz simulation snapshots. Walking phase advances by distance travelled, and visual facing turns with a bounded angular rate and sector hysteresis. This does not increase simulation tick frequency or invent intermediate limb poses.
- Four new ground materials blended through a coherent low-frequency mask, reflected tile edges, textured tracks, revised cliff materials and irregular highland rims. Ground work is cached outside the render loop.
- Starting groves and larger forest clusters use irregular placement for new games. Existing saves retain their trees and structures; starting a new frontier is recommended for the new layout.
- 24 PNG atlases integrated in total. Added files: worker/sword/spear/archer/horse/camel-walk-v3.png and terrain-materials-v1.png. Source prompts and provenance are recorded with the art.
- Limits: generated keyframes still have anatomy/gait inconsistencies. Walking and attack equipment may not match, some units share families, and foot planting is approximate. No assertion of fully natural animation, visual acceptance or a measured FPS improvement. Prior localhost browser-policy rejection prevents a fresh visual inspection; no workaround was attempted.

## Added in 0.7.0
- Seven attack sprite families: sword, spear, foot archer, horse swordsman, ram, mangonel and ballista. Each has eight source direction rows and four action samples, with measured crop metadata in combat-frames.json. Some generated headings are approximate; spear/archer southwest uses a mirrored southeast view. No claim of eight independently correct final headings.
- Facing tracks the target during attack windup; projectile release occurs at the simulation strike time. Arrow/bolt drawings align to flight direction. Siege movement uses the directional resting pose instead of a single sideways view.
- Worker-built road routes: select workers → Build Road → drag over explored land. Routes use navigation; up to 48 sections per gesture, each costing 2 wood + 1 stone and four worker-seconds. Shift appends to existing work orders. Finished road cells provide +18% movement speed. Roads do not block movement and have reduced sight radius.
- New Council Hall with Civic Administration (training time −10%). University available from Castle Age, with Architecture (+15% build speed) and Ballistics (+25% projectile speed). Temple & Infirmary heals nearby friendly troops after five seconds without damage; Medicine improves that healing by 50%.
- Blacksmith tool repair: select worker → Repair tools → friendly completed blacksmith. Work gradually wears tools down, reducing gathering efficiency by at most 20%. Repair restores condition over time, costing 0.25 wood and 0.1 gold per second while repairing. Condition and delivered material totals appear in the inspector.
- Windmill rotor turns continuously and smoothly changes speed while processing a recent food delivery. Research buildings show progress without reusing a fruit-picking gesture. Mine cart/worker, lumber worker and forge effects activate on real delivery/research/tool-repair activity. Archery targets/training arrows, cavalry drill, infantry drill and workshop hammering activate while a training queue is reserved and progressing. These decorative trainees are not extra gameplay units.
- Dedicated Roman/Persian council, university and temple art plus shared forge and windmill body. Renderer animates the windmill sails separately.
- Leaf-litter patches around trunks blend woodland bases into the terrain. Initial developed-city mill and mine positions adjusted; new developed cities include the institutions.
- Research actions are available directly from selected buildings as well as the global technology tree.

## Implemented in 0.6.0 and preceding work
- 256 × 256 map, shared map coordinates for navigation/fog/saves/camera, coastline blocks land movement.
- Height field: limestone shelves, steep slopes blocked for movement, gentler east-facing approaches, flat-site requirement for new construction. Terrain textures and fog are projected to the same raised surface as units.
- Routed dirt roads with intermediate waypoints and district junctions, rather than one straight spoke to every building.
- Heap-based A*, segment lookahead, acceleration/arrival slowdown, local passing candidates, cached resource dropoff searches.
- Six walking sprite families with eight directions, three distinct source poses played as 0–1–2–1; stable phase from travelled distance, direction hysteresis, normalized scale.
- Worker chopping, mining, harvesting, construction and fruit picking: four action frames with front/back source views and left/right mirroring. These are four working views, not eight independent working views.
- Wood: 7.5 seconds of chopping → 1.25-second pivoted fall → timber gathering → permanent stump. Tree species do not yet all have matching fallen silhouettes.
- Stone/gold: full → half-excavated art below 55% → depleted rubble. Berry bush changes to picked foliage below 18% stock.
- Farm: empty soil → seedlings → green crop → ripe wheat over 42 simulation seconds; gathering waits for maturity. Harvest exposes a growing strip of bare soil. Reseeding costs 55 wood, replenishes 360 food and resets growth. Existing saves retain mature farms.
- Siege: ram, mangonel and ballista action poses linked to the attack windup/cooldown; Roman melee attack poses; hit dust. Incendiary Ammunition research in Imperial Age enables flame visuals on mangonel/trebuchet shots (same damage).
- House shelter capacity 4; entering garrison moves and fades the sprite into the building; occupied building badge and selected-building occupancy.
- Dedicated Roman/Persian house, barracks, stable and archery-range sprites; shared workshop, lumber camp, mining camp and mill sprites. Alpha-aware sprite picking and hover names.
- Cursor-centred zoom, scale-correct drag panning, actual viewport outline on minimap.

## Art integrated
Thirty-three PNG atlases in public/assets/isometric. See PROVENANCE.md and docs/ISOMETRIC-ART-PROMPTS.md.
- world-atlas-v1: initial architecture and foliage.
- units-atlas-v1: older fallback sprite set (including caravan fallback).
- people-directions-v2, persian-directions-v2, mounted-directions-v2: six directional families.
- worker-actions-v1: five work cycles.
- resource-states-v1: lifecycle states, crops, foliage and limestone texture source.
- siege-actions-v1: three siege machines and Roman infantry attack.
- production-atlas-v1: 12 building sprites.
- institutions-v1: eight civic/religious/industry sprites.
- sword/spear/archer/horse/ram/mangonel/ballista-attack-v1: seven attack sheets, 32 source cells each.
Generated sheets do not always match the requested grid or exact size. Runtime extraction uses measured bounds and row bands; PNG originals remain unchanged.

## Known gaps; not production complete
- Animation continuity and exact headings still require artist review. Older attack families have four samples and the three new mounted families have eight; neither is a final professionally authored animation set. Clothing/body registration between walking and attacking can differ. Planting, carrying, death and several unique-unit animations still need dedicated art. Mounted archery and camel attacks have initial dedicated sheets in 0.9.0.
- Unit definitions still share art; many unique units still lack dedicated sprites; elephant/chariot have initial dedicated packs in 0.10.0. Trebuchet currently uses mangonel action art. Generic crossbows/javelins use the bow family. Elephant and chariot have initial dedicated art in 0.10.0; full roster coverage is incomplete.
- Resource visual thresholds are discrete; no per-fruit picking or per-grain plant simulation. Harvest clearing uses a clipped strip. Tree fall uses six illustrated poses in broadleaf, pine and date-palm families; individual species still lack separate fall/log/stump art.
- Active resource cells now block navigation; local unit separation is present, but crowded traffic can still stall. Large route searches use the map-sized expansion budget and a reachable-endpoint fallback; crowd deadlocks remain possible.
- Heightfield is deterministic with hand-placed shelves, not a full procedural erosion/map generator. Click inversion around steep faces and cliff occlusion still need acceptance review. No high-ground combat bonuses.
- Walls/gates still share fortress art; final connected wall art and gate opening animation are pending. Damage fire/scaffolding are renderer overlays. No explorable building interior.
- Five older factions share visual families. Several secondary buildings still share assets. Some generated building sprites have tight atlas margins and need art review.
- Naval gameplay, authored historical campaigns, historical equipment review and balance remain incomplete.
- No named MacBook performance benchmark. Onscreen FPS is not benchmark evidence.

## Evidence and limits
Version 0.10.0 passes TypeScript compilation and the Vite production build (18 modules; JavaScript 173.25 kB / 54.03 kB gzip, excluding PNGs). Source atlases were inspected and row boundaries measured. No automated gameplay tests or fresh browser acceptance were performed; the earlier browser-policy restriction was not bypassed.

Version 0.9.0 passes TypeScript compilation and the Vite production build (17 modules; JavaScript 159.55 kB / 51.01 kB gzip, excluding PNG assets). The local listener remains active at 127.0.0.1:5173. No automated gameplay tests or browser visual acceptance were performed; the prior browser-policy restriction was not bypassed.

Version 0.8.1 passes TypeScript compilation and the Vite production build (16 modules; JavaScript 141.10 kB / 47.32 kB gzip, excluding PNG assets). No gameplay tests or fresh browser acceptance were performed for this patch.

Version 0.8.0 passes TypeScript compilation and the Vite production build (16 modules; application bundle 139.59 kB, 46.79 kB gzip). These sizes exclude separately served PNG assets. No gameplay tests or fresh browser acceptance were performed. Source atlases were inspected; image dimensions and 64 nonempty source cells per walking family were recorded during metadata extraction.

Version 0.7.0 passes TypeScript compilation and the Vite production build. Browser inspection of 0.7.0 was blocked by the browser security policy for the localhost target; no UI acceptance is claimed for the latest changes.
TypeScript compilation was successful after the terrain/resource/action changes. The current scene was opened in the browser and visual issues in the terrain seams were identified and fixed. Final production build status is recorded in the delivery message. No automated gameplay tests were added or run for this request. These checks do not establish that every animation, resource lifecycle, saved-game migration or combat interaction has passed acceptance.

## Production semantics
The economy still uses food, wood, gold and stone. Building delivery animation represents processing/handling of a deposited resource; there is no separate wheat → flour or ore → ingot inventory chain. No material is created by decorative workers. Windmills, classical civic architecture and the four ages coexist as the requested historical sandbox, not as a reviewed reconstruction of a single period.

## 0.15.0 — 2026-10-05 — Builders, fortifications and coastal details
- Fixed era sprite lookup: lazy-loaded era images were missing from the sprite rectangle registry. Added alpha picking for these images.
- Age changes create renovations on completed upright buildings. Old facades remain until villagers finish work; idle villagers receive repair assignments. Fortification improvements require nearby working villagers after damage repair. Scaffolds and synchronized hammer impacts accompany building, repair and renovation.
- Drag wall/palisade placement lays up to 48 contiguous sections along a snapped world axis and queues actual builders. Existing matching segments can be skipped when extending a route; obstacles or exhausted resources stop the route. Preview follows the snapped route.
- Added Watchtower, Archer Tower and Cannon Tower with different costs, sight, attack range and cooldown. Archer towers use existing archer action poses; cannon barrels aim, recoil and flash with actual shots. Towers currently share base architecture artwork.
- Resource cells block navigation, placement rejects occupied unit footprints, exits seek free space, and nearby units separate gradually. Farms remain traversable; crowded traffic is not guaranteed deadlock-free.
- Added stone paving detail, darker offshore water, coastal jumping fish, shoreline reeds and peat-colored ground patches, regional date palms and pines. These are environmental visuals, not new river or marsh gameplay.
- Falling trees retain their species image and root anchor after falling. This remains a transformed sprite, not an independently drawn falling-tree sequence.
- Limits: no new inland river, coconut-specific artwork or dedicated construction/tree-fall animation atlas. Era facade variants cover twelve core building types, not every tower and utility. Browser visual acceptance remains pending.


## Current audit
See [QUALITY-AUDIT-2026-10-06.md](QUALITY-AUDIT-2026-10-06.md) for confirmed fixes, remaining weaknesses and acceptance targets.
