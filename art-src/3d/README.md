# Production 3D assets

The directories are reserved for licensed, reviewed `.glb` files. **Do not put prototype proxy meshes here.** No third-party model has been purchased or imported yet.

- `characters/`: rigged unit GLBs and faction-specific variants.
- `buildings/`: modular construction, landmark and damage-state GLBs.
- `environment/`: terrain, vegetation and biome models.
- `animations/`: reusable glTF animation clips where they are authored separately.

The runtime loader is `src/game/gltf-runtime.ts`; asset IDs and rights state live in `src/game/model-assets.ts`. A model remains a proxy until the asset has a recorded license/source, passed visual and historical review, and is integrated from a GLB.
