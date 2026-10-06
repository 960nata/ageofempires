/// <reference types="vite/client" />
// Atlases ship as WebP (see scripts/optimize-assets.py); metadata keeps the original .png names.
export const assetUrl=(file:string)=>import.meta.env.BASE_URL+'assets/isometric/'+file.replace(/\.png$/,'.webp');
