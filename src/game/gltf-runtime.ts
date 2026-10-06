import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader=new GLTFLoader();
export interface LoadedModel { root:THREE.Group; mixer:THREE.AnimationMixer|null; clips:THREE.AnimationClip[] }
/** Loads a production GLB and preserves glTF PBR materials and animation clips. */
export async function loadGameModel(url:string):Promise<LoadedModel>{
 const gltf=await loader.loadAsync(url);const root=new THREE.Group();root.add(gltf.scene);
 root.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;object.frustumCulled=true;}});
 const mixer=gltf.animations.length?new THREE.AnimationMixer(gltf.scene):null;
 const idle=gltf.animations.find(clip=>/idle|stand/i.test(clip.name));if(mixer)mixer.clipAction(idle??gltf.animations[0]).play();
 return{root,mixer,clips:gltf.animations};
}
/** Normalizes artist-authored GLB height to the game's world scale and rests the model on the ground plane. */
export function fitModelToHeight(model:THREE.Object3D,targetHeight:number):void{const box=new THREE.Box3().setFromObject(model);const height=box.getSize(new THREE.Vector3()).y;if(height<=0)return;model.scale.multiplyScalar(targetHeight/height);const fitted=new THREE.Box3().setFromObject(model);model.position.y-=fitted.min.y;}
