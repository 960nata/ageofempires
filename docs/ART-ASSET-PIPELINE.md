# Production 3D asset and rights pipeline

## Visual bar: detailed 3D, not low-poly art direction

The current Three.js primitives are greybox proxies. The shipping art target is detailed, realistic historical 3D. Polygon reduction is permitted only as invisible technical LOD for distance/performance; it must not change the art style into visibly low-poly silhouettes.

- **Characters:** detailed production mesh, clean deformation topology, 30–60k triangles at LOD0 target, humanoid rig, separate weapon/armor attachments, 2K PBR textures, normal/roughness/metalness/AO maps, cloth and metal material response. Horse and rider use compatible skeletons and synchronized clips.
- **Buildings and landmarks:** modular, detailed 20–120k triangle LOD0 target depending on structure size, construction stages, damage states, 2K–4K PBR materials, real scale and clean collision proxies.
- **Environment:** high quality tree/rock/terrain source assets with authored LODs, biome variants and instanced rendering. Distant LODs preserve silhouette and material response.
- **Animation:** named clips in the manifest; at minimum idle, locomotion, attack/work, hit and death for troops. Buildings have construction/damage states; cavalry clips are synchronized.
- **Delivery:** GLB/glTF 2.0, embedded PBR materials, consistent metres/Y-up/pivot conventions, compressed textures where tested, LOD groups and source file retained outside the public download bundle.

The numerical triangle/texture targets are initial art budgets, not permission to decimate every model. Review captures at the actual game camera zooms and on the target MacBook before approval.

## Required per-asset rights record

For every asset save: asset ID, marketplace/page URL, creator, purchase/claim receipt, exact license and version/date, project entitlement/account, permitted commercial use, attribution text if needed, modification rights, redistribution constraints, source file hash, conversion history, and approval status. A model marked `pending` is not cleared for release.

**Allowed license classes:** Fab Standard License or custom license explicitly permitting commercial game use and distribution as an integrated game asset; CC0; CC-BY-4.0 with required attribution. Reject non-commercial/no-derivative terms, unclear ownership, ripped game assets, and licenses that prohibit web game delivery. Never distribute source models as a standalone asset pack.

## Import workflow

1. Select a source asset and verify its license permits commercial use in an online/browser game and modified GLB delivery as integrated game content.
2. Download/purchase under the project owner's account; save receipt and license terms in a private project rights archive (do not commit payment details).
3. Convert FBX/OBJ to GLB using Blender or an approved converter; check scale, normals, UVs, material maps, rig and animation clips.
4. Run visual/historical review; optimize with LODs and texture compression while retaining high-detail close-up appearance.
5. Put the GLB under `public/assets/3d/`, update `src/game/model-assets.ts`, and replace the matching proxy through `loadGameModel`.
6. Add a dated item to `src/game/updates.ts` and `docs/CHANGELOG.md` when player-facing assets change.

## Current rights status

No production asset is licensed or imported yet. `public/assets/3d/` contains only this README. The manifest accurately marks every model `pending`; marketplace pages are candidates, not project licenses.
