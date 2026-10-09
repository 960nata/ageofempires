import {isolatedAtlas} from './isolated-sprites';
/// <reference types="vite/client" />
import avifAssets from './avif-assets.json';
// Atlases ship as WebP, newer ones as AVIF (see scripts/optimize-assets.py); metadata keeps the original .png names.
const avif=new Set<string>(avifAssets);
export const assetUrl=(file:string)=>{const packed=isolatedAtlas(file);if(packed)return import.meta.env.BASE_URL+'assets/isometric/'+packed.file;const name=file.replace(/\.png$/,'');return import.meta.env.BASE_URL+'assets/isometric/'+(name===file?file:name+(avif.has(name)?'.avif':'.webp'));};

/** Load the isolated AVIF, with its matching WebP if this browser cannot decode AVIF. */
export function setSpriteSource(image:HTMLImageElement,file:string){const atlas=isolatedAtlas(file),failure=image.onerror;let fallback=false;
 image.onerror=(event)=>{if(atlas&&!fallback){fallback=true;image.src=import.meta.env.BASE_URL+'assets/isometric/'+atlas.fallback;return;}if(failure)failure.call(image,event);};
 image.src=assetUrl(file);
}
