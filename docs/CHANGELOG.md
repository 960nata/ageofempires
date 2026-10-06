# Changelog

## 0.20.1 — 2026-10-06 — Reachable villager work sites and resource continuation
- Workers reserve reachable standing positions around resources and at drop-off/construction/repair sites. A blocked tree in a dense grove can redirect the order to a reachable nearby tree of the same commodity.
- Gathering orders retain their original work area and commodity. Depleted or temporarily inaccessible nodes trigger nearby resource search; unsuccessful candidates receive a short retry cooldown so searches continue through the area.
- Progress watchdogs reselect a work position and then another resource when a worker makes no headway. Worker avoidance permits consistent lateral/backward yielding when passing another worker.
- Worker facing now follows its actual steering/work direction; collision-separation nudges no longer trigger walk poses or turn the villager away from a work target.
- Added a simulation regression check for four commodities, crop growth/harvest, dense-grove group commands, save/restore, construction and repair. Visual pose quality still depends on the existing atlases; this patch adds no new artwork.

## 0.20.0 — 2026-10-06 — Male and female villagers with directional idle, walk and work
- Added original male and female villager locomotion atlases: eight individually illustrated headings with one idle pose and five successive walking keyframes per heading. The renderer uses idle art when a worker is standing, and advances walking frames by visual travel distance.
- Added a female work atlas for chopping, mining, wheat farming, orchard fruit picking and construction/repair; the existing male work atlas remains active. Work sprites are chosen from the worker's actual task and target resource. Orchard tending now selects the orchard action instead of the farm action.
- Villager appearance is stored per unit and in save snapshots; older saves assign it deterministically from unit ID. Selection and hover labels identify woman/man villagers.
- The generated source art still contains some coloured edge artifacts and only five unique walk poses per heading. Visual acceptance in the running browser remains necessary before describing locomotion as seamless.

## 0.19.0 — 2026-10-06 — Navigation, terrain compositing and frame work
- Pathfinding now stops A* immediately after reaching the requested cell. Clearance dilation is cached per obstacle set and unit radius, invalidated on navigation rebuild; route expansion no longer repeats the same footprint checks for every neighbour.
- Entity lookup uses an ID index, and close unit avoidance uses spatial buckets. Enemy target scoring checks reachable endpoints for up to four nearby objectives instead of running routes for ten troops per objective. Siege-mode AI no longer crashes when it has no soldiers.
- Workers reject drop-off buildings whose reachable route ends beyond the interaction radius.
- Terrain hides sprite pixels only when the raised ground is meaningfully above the object's own ground height. Building contact shadows now stay inside the footprint rather than painting broad tinted patches. The blurred fog canvas renders at half resolution and scales to the terrain surface.
- TypeScript and production build passed. No browser visual acceptance, MacBook FPS benchmark, or full gameplay acceptance is claimed. See QUALITY-AUDIT-2026-10-06.md for remaining art and systems gaps.

## 0.18.2 — 2026-10-06 — Species-consistent tree fall and audit
- Tree fall selects broadleaf, pine, or date palm according to the standing tree sprite. Added an original six-pose palm fall atlas and retained six-pose broadleaf/pine atlas.
- Attack-move orders now complete at the closest reachable endpoint when an ordered point cannot be reached.
- Recorded remaining visual, animation, AI, navigation and performance gaps in QUALITY-AUDIT-2026-10-06.md.
- Visual browser acceptance remains pending.

## 0.18.1 — 2026-10-05 — Woodcutting interaction and fallen tree state
- Fixed worker arrival: work targets at the center of blocked trees/buildings no longer require a clear path through the blocker itself. The arrival check ends at the walkable interaction ring.
- Workers approach wood more closely, face the trunk and play the existing four-pose axe action. Six chopping cycles (7.5 seconds) deepen a visible notch and trigger wood chips on impact before the authored six-pose fall begins.
- Fixed sprite priority after the fall: collectible logs now render before the standing-tree branch and stay visible until stock is exhausted; the stump follows depletion.
- Original falling art covers broadleaf and pine archetypes, not all ten existing tree shapes. In-game visual acceptance remains pending.

## 0.18.0 — 2026-10-05 — Chopped trees, height layers and tactical routes
- Added a 12-pose original tree-chopping fall atlas: six broadleaf and six pine frames. Axe progress produces a gentle pre-fall lean, frames play only after a worker completes chopping, the rooted tree visibly falls over 2.15 seconds, then switches to a collectible log and finally stump.
- Corrected depth raster values for elevation. Object occlusion now varies by sprite screen row, letting crowns remain visible above a ridge while lower trunks disappear behind nearer raised terrain.
- A* blocks cells whose obstacle boundary overlaps the requested unit footprint. Narrow corridors now work for small units and are refused when too narrow for larger units.
- Enemy AI compares reachable visible military/building objectives instead of selecting the first building in list order.
- Build and route checks only; no browser acceptance or named performance benchmark. Tree atlas is shared broadleaf/pine art, not per-species; human walk/attack animation source poses are not replaced.

## 0.17.0 — 2026-10-05 — Authored construction sprites and reachable movement
- Added 16 individually illustrated transparent construction images, grouped into four structure families × four stages (foundation, walls/scaffolding, roof frame, near-complete). Build and renovation use the selected family stage instead of revealing the finished image behind procedural scaffolds.
- House, production hall, civic/temple and fortress types map to matching construction families. Stage atlas is alpha-trimmed at load; sprites preserve footprint and baseline.
- Route search now exhausts the map-sized search budget and returns the closest reachable endpoint when the desired point lies across obstacles. A unit accepts direct arrival only when its footprint has a clear approach.
- Asset is original generated art. Families are reused across several structures and factions; unique Roman/Persian/age-specific construction poses are not yet separate. Existing worker-action animation is retained.
- TypeScript and production build only; visual in-game acceptance and gameplay tests remain pending.

## 0.16.1 — 2026-10-05 — Woodland ground transition
- Replaced the single brown tree-base spot with offset feathered soil layers that retain the underlying terrain texture; distinct muted tones for pine, inland and coastal trees.
- Added fine leaf/needle strokes, a small trunk contact shade, and sparse understory using existing original ground-cover sprites. No new shrub source artwork.
- Ground-cover rendering excludes current building footprints, including construction added after map creation.
- Build compilation only; no browser visual acceptance or tests performed. Baked ground colors inside tree source sprites remain unchanged.

## 0.16.0 — 2026-10-05 — Terrain depth and traffic recovery
- Terrain rasterization retains world depth per pixel. Entity sprite drawing clips against nearer terrain, so elevated foreground terrain can cover objects behind it. Buildings use front-footprint depth tolerance. Activity overlays and hit regions are not yet terrain-clipped.
- Walking keeps its last gait pose when stopped rather than jumping to a fixed unrelated pose. No new source frames were created.
- Blocked units retry pathfinding around nearby stationary units after a delay; normal routes retain the shared static grid. This reduces one source of repeated identical stuck paths, without guaranteeing deadlock-free traffic.
- Field soil uses softened perimeter bands instead of one hard-edged patch.
- Build compilation only; terrain clipping performance and visual acceptance remain unverified in browser. Source art consistency still requires asset work.

## 0.15.4 — 2026-10-05 — Movement clearance and settlement ground
- Path search now checks unit clearance at waypoint centers and avoids an unsafe exact destination near a blocked-cell boundary. Plain movement can finish at its reachable snapped endpoint.
- Units turn before advancing around sharp bends instead of repeatedly pushing into a wall. Turning updates sprite facing without a walking cycle.
- Reduced the yellow ground halo around settlements; added subtle deterministic earth/debris at building perimeters projected onto terrain.
- No new character animation source frames or facade artwork. Existing crowd deadlocks and art mismatch are not claimed fully resolved. Browser acceptance and gameplay tests were not performed.

## 0.15.3 — 2026-10-05 — Wheat height
- Crop height now grows independently of plot width, from 0.12 to approximately 1.54 world units, with small deterministic variation. Crop bases remain anchored to the field; existing depth ordering allows foreground rows to cover worker legs.
- Uses the existing crop atlas rescaled vertically, not newly authored stalk artwork. Waist-height appearance and crop silhouette still need in-game visual review.

## 0.15.2 — 2026-10-05 — Terrain placement and stable drawing
- Stable equal-depth sprite ordering replaces an inconsistent comparator. Reset canvas opacity/compositing each frame; failed era images keep their fallback without repeated requests.
- Explored buildings remain rendered when scouts leave sight, like explored resources; mobile enemies still require current sight. This is not a last-seen building snapshot system.
- New building placement samples the footprint interior, rejects cliff/water samples and limits height variation to 0.35 instead of 0.8. Existing structures are not relocated.
- Increased directional slope shading to distinguish raised terrain and ravine faces.
- Browser visual review remains pending. Full foreground-terrain occlusion and per-building foundation art calibration remain unresolved; this patch does not claim those systems complete.

## 0.15.1 — 2026-10-05 — Field interaction and grounded construction
- Restored picking completed farms/orchards through their ground footprint; crop render markers no longer make the actual field unselectable.
- Crop and worker depth now use their actual world positions. Added tilled soil and field selection outline; corrected crop anchor and negative variation index.
- Builders finishing a field tend it automatically when no queued order is pending. Immature crops use the existing cultivation animation. Farmers remain assigned while a depleted field waits for reseeding funds. Selected fields can assign the nearest idle farmer.
- Replaced flat scaffold grids and arbitrary roof triangles with two isometric scaffold faces. Contact shading now follows gameplay footprint rather than full image width. Field construction does not use upright building scaffolds.
- Existing generated sprites still have inconsistent baked lighting, perspective and ground patches. These code fixes do not constitute a complete art replacement. No browser visual acceptance or new gameplay tests.

## 0.15.0 — 2026-10-05 — Builders, fortifications and coastal details
- Fixed era sprite lookup: lazy-loaded era images were missing from the sprite rectangle registry. Added alpha picking for these images.
- Age changes create renovations on completed upright buildings. Old facades remain until villagers finish work; idle villagers receive repair assignments. Fortification improvements require nearby working villagers after damage repair. Scaffolds and synchronized hammer impacts accompany building, repair and renovation.
- Drag wall/palisade placement lays up to 48 contiguous sections along a snapped world axis and queues actual builders. Existing matching segments can be skipped when extending a route; obstacles or exhausted resources stop the route. Preview follows the snapped route.
- Added Watchtower, Archer Tower and Cannon Tower with different costs, sight, attack range and cooldown. Archer towers use existing archer action poses; cannon barrels aim, recoil and flash with actual shots. Towers currently share base architecture artwork.
- Resource cells block navigation, placement rejects occupied unit footprints, exits seek free space, and nearby units separate gradually. Farms remain traversable; crowded traffic is not guaranteed deadlock-free.
- Added stone paving detail, darker offshore water, coastal jumping fish, shoreline reeds and peat-colored ground patches, regional date palms and pines. These are environmental visuals, not new river or marsh gameplay.
- Falling trees retain their species image and root anchor after falling. This remains a transformed sprite, not an independently drawn falling-tree sequence.
- Limits: no new inland river, coconut-specific artwork or dedicated construction/tree-fall animation atlas. Era facade variants cover twelve core building types, not every tower and utility. Browser visual acceptance remains pending.

## 0.14.0 — 2026-10-05 — Construction frame sequence
- Replaced continuous construction clipping and live scaffold drawing with sixteen cached raster frames per building facade. Adjacent frames blend as construction progresses; frame content includes foundation, scaffold, masonry and roof stages. Scaffolds fade before completion.
- Frames are composed on demand from the current faction, age and facing art, then cached with a ten-facade limit to control memory use. They are distinct rendered frames derived from one completed sprite, not sixteen separately illustrated source images.
- Hammer glints now synchronize with the existing four worker action poses and appear only while actual villagers are building that structure.
- Type and production build verification only. In-game visual acceptance remains pending.

## 0.13.0 — 2026-10-05 — Construction phases
- Unfinished buildings reveal upward from the foundation through five staged progress bands: foundation, frame, walls, roof and finishing. Removed the whole-building fade-in.
- Construction scaffolds animate with rising posts and additional cross-bracing; material piles sit at the footprint and a rhythmic hammer glint moves along the active wall.
- Construction uses the same current Roman/Persian era facade and facing as its completed building. Existing worker speed, construction time, HP progression and costs are unchanged.
- Type/build verification only; phase visuals and scaffold overlap were not reviewed in the browser.

## 0.12.0 — 2026-10-05 — Age-specific settlements and living fields
- Added generated Roman and Persian Dark, Feudal and Imperial facade sprites for 12 settlement structure types, each with four directional views. Castle Age continues to use the existing settlement art. Only the current faction/age/facing sprite is requested as needed; saved facing and current age drive both built structures and placement previews.
- Farm visuals now show tilled, growing green and ripe crop stages from the existing resource atlas; individual crop rows are depth-sorted around villagers. Orchard markers use the four-facing fruit-tree art; their gameplay regrowth remains simulated.
- Connected four-facing, depletion-state gold/stone art and wild grass to the renderer; adjusted tree fall to keep its base grounded while its crown moves along the worker-selected fall direction.
- Generated original raster artwork, not meshes or purchased premium asset packs. Different generated facades are visually related but not guaranteed to be the same building rotated; age variants cover the 12 core sprites, not every fortification or utility. No browser visual acceptance or gameplay tests were performed.

## 0.11.0 — 2026-10-04 — Settlement renewal
- Replaced upright building art with cohesive Roman/Persian settlement, utility, fortification and landmark packs. Each upright structure can face South/East/North/West using R during placement or Rotate building after selection. Placement shows its actual facade; saves retain orientation and recruitment exits prefer the facing side. Farms and roads retain their ground artwork. Camel stable shares stable art; both landmark roles share the regional complex.
- 17 new unchanged original PNGs (50 integrated atlases total). Alpha-component crop metadata avoids clipped roofs, tree crowns and adjacent sprites. Scene objects use alpha-aware picking, consistent projected foundations and feathered contact shadows.
- Shared terrain mesh is rasterized into a cached continuous bitmap with interpolated lighting and slope materials; removed stroked/antialiased triangle borders. Added western dry ravine, limestone banks and shoreline boulders. Scenery rocks are decorative; existing gold/stone nodes remain mineable. Terrain geometry is shared with navigation; old saves retain their entities on the updated map.
- Replaced live trees with 10 woodland species variants selected by region, retaining existing chop/fall/log/stump lifecycle. Ground litter stays feathered. Added shallow-to-deep coastal color and time-driven foam/specular ripples.
- Damaged buildings gain cached scorch/crack stages and fire/smoke from four-frame VFX. Combat destruction creates collapsing sections, dust and persistent low debris. Canceled construction does not create ruins; rebuilding at the site hides old debris. Repair reverses damage art as HP recovers.
- Compilation: TypeScript and production bundle checks only; no gameplay tests or browser visual acceptance. The previous browser policy restriction remains in effect. Art direction and perspective consistency across generated rotations are approximate; variants can differ in details. This is original generated 2.5D art, not an exact AoE reproduction or premium licensed asset pack. No measured FPS claim.


## 0.10.0 — 2026-10-04 — Elephants and chariots
- Added four original atlases: war-elephant and chariot walking/attack packs. Eight source cells per direction; special unit art is used for movement, idle, combat and stable training.
- Elephant visual height is calibrated to 5.3 world units; chariot side length to 6.2. Stride lengths 4.6/4.8 and turn rates 1.7/2.4 radians per second distinguish these units from normal cavalry. Chariot collision footprint increases to 1.1; elephant retains 1.3.
- Renderers share a mounted-family lookup, avoiding different unit artwork in combat versus training. Projectile heights account for chariot crew and elephant targets.
- Source row bands were measured from alpha gaps. The malformed/clipped elephant walking east row is excluded; its complete west row supplies the mirrored east view. Original PNGs remain unchanged.
- Art count is 33 atlases. Generated anatomy, horse/crew continuity and facing still need refinement. Navigation is still based on the shared point grid; larger dynamic spacing does not provide full swept vehicle collision against terrain.


## 0.9.0 — 2026-10-04 — Mounted armies
- Added camel lancer, camel swordsman and horse archer attack sheets, each with eight source pose cells per heading. Mirrored selected headings correct inconsistent source directions at the cost of mirrored equipment handedness.
- Added horse archer and camel swordsman walking sheets. Their idle state uses a resting attack pose, retaining their weapons. Stable training artwork follows the first queued mounted type.
- Attack rendering and simulation share a 0.5-second windup; a floating-point tolerance prevents an unintended extra tick before release. Existing four-pose families remain supported.
- Projectiles launch at troop/building-specific heights and follow a zoom-scaled arc between projected endpoints, rather than inheriting hills below their trajectory. Flame trails follow the arc tangent; shots outside current player vision are hidden.
- Combat sprites support alpha-aware selection. Asset loading counts derive from the registered families (29 total PNG sheets).
- One malformed camel walking candidate was rejected, then regenerated. Selected originals and source prompts are preserved. Generated frame continuity, exact anatomy and headings still need review; elephant/chariot art remains incomplete.


## 0.8.1 — 2026-10-03 — Movement continuity
- Movement follows bounded steering angles with acceleration/braking, stable passing preferences and same-tick waypoint consumption. Segment clearance samples all four corner offsets.
- Worker action poses wait until interpolated movement has settled. Unsupported camel and mounted ranged attack types keep mounted art instead of switching to foot soldiers; dedicated mounted attack art is still missing.
- Visual effects, windmills, garrison entry, tree fall and projectiles share the interpolated render clock. Arrow orientation follows the derivative of the flight arc.
- Added subtle shore ripples below the fog layer. No extra image assets generated in this patch.
- Local Vite server restarted as a detached local process with output at /tmp/iron-crown-vite.log. No browser access-policy workaround attempted.
- Gameplay crowd navigation and visual acceptance remain unverified; source changes do not establish that every traffic jam is resolved.


## 0.8.0 — 2026-10-03 — Walking and terrain
- Added six walking sheets (worker, sword, spear, archer, horse, camel), eight source cells per directional row. Torso registration reduces per-frame lateral drift. Three views are mirrored to correct source heading inconsistencies.
- Replaced position chasing with interpolation between fixed simulation steps; stride phase follows actual visual distance and turning has a bounded angular rate.
- Added original ground materials blended with coherent noise, textured tracks and limestone cliff faces; cached terrain replaces the previous 380,000-dot ground pass.
- New maps use irregular starting groves and elongated forest clusters. Highland rims have varied outlines. Old saves retain forest positions.
- No claim of finished animation continuity or full unique-unit coverage. Latest browser visual review remains unavailable after the earlier security-policy rejection.

## 0.7.0 — 2026-10-03 — Working settlements and attack directions
- Seven attack families with four poses and directional source rows, target-facing windup and aligned projectiles.
- Villager-built road routes, queued construction and road movement bonus.
- Council Hall, University, Temple & Infirmary and functioning blacksmith tool repair; new research and direct building research actions.
- Delivery-linked industry activity, windmill sails and queue-linked infantry/archery/cavalry training animations.
- Forest-floor litter and distinct institutional architecture.
- Windmill rotation now eases between idle and processing speeds without angle jumps; removed the unrelated fruit-picking gesture from research buildings.
- TypeScript and production build pass. Latest browser inspection blocked by the browser security policy; full visual acceptance remains pending.


## 0.6.0 — 2026-10-03 — Living terrain and economy
- Added raised terrain, blocked cliffs, sloped approaches and routed settlement roads.
- Added worker job cycles, tree fall/timber/stump, berry picking, excavated ore states and crop growth/harvest/reseed.
- Added dedicated production buildings, shelter entry, siege/melee action poses and impact effects.
- Added Imperial incendiary projectile research, with unchanged siege damage.
- Improved directional walking, unit proportions, pathfinding, camera controls and alpha-aware picking.
- Art and gameplay limitations remain explicit in IMPLEMENTATION-STATUS.md.

## 0.5.0 — 2026-10-03 — Direction and map foundations
- Added eight-facing sprites for six families, normalized cavalry size and a 256 × 256 coastal map.
- Replaced frontier search with bounded heap A* and cached dropoff routes.


## 0.4.0 — 2026-10-02 — Isometric direction
- Replaced active WebGL renderer with Canvas 2D isometric renderer after user rejected the 3D visual direction.
- Integrated original world/unit PNG atlases; Roman/Persian art and developed-city scenario.
- Added classical unit definitions, research technologies, formation spacing and combat windup.
- Final sprite coverage and eight-direction animations remain pending; see IMPLEMENTATION-STATUS.md and PRD-v4-isometric.md.


Catatan perubahan yang terlihat pemain. Setiap pembaruan gameplay/konten wajib memperbarui `src/game/updates.ts` dan menambahkan entri di dokumen ini.

## PRD v3 — 2026-10-02 — Spesifikasi RTS rinci (dokumentasi)
- Menulis ulang PRD dengan 12 persyaratan wajib, audit kekurangan prototype, dan aturan selesai berbasis bukti.
- Menentukan 25 keluarga unit, 21 bangunan, lima paket peradaban target, ekonomi gather/carry/deposit, produksi, empat era, siege dan upgrade benteng.
- Menambah standar anatomi/rig/animasi, target performa, save/load, AI dan campaign.
- Menambah ASSET-PRODUCTION-MATRIX.csv (67 keluarga aset; pending/not_acquired) dan ACCEPTANCE-MATRIX.csv (48 skenario; not_run).
- Mengarsipkan PRD v2 di archive/PRD-iron-crown-rts-v2.md. Dokumen v3 menjadi rujukan keputusan produk yang bertentangan.
- Tidak ada perubahan source gameplay atau penambahan model produksi pada update dokumentasi ini.

## 0.2.0 — 2026-10-02 — Civilization foundations
- Tambah empat profil peradaban dengan konteks sejarah, arsitektur, bonus ekonomi, identitas militer, landmark dan unit unik.
- Tambah katalog unit bersama: era buka, biaya, stat tempur, kelas armor, counter, serta deskripsi.
- Tambah definisi bangunan/landmark dan panel inspeksi peradaban/roster dalam game.
- Catatan ruang lingkup sejarah dapat dibaca dari panel faksi.

## 0.1.0 — 2026-10-02 — 3D browser prototype
- Scene WebGL, kamera, HUD resource, seleksi unit, gerakan, dan interaksi ekonomi awal.
