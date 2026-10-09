import data from './isolated-sprites.json';
export interface IsolatedRect {x:number;y:number;w:number;h:number;cx:number;ground:number;}
export interface IsolatedAtlas {file:string;fallback:string;rows:number;cols:number;sourceWidth:number;sourceHeight:number;complete?:boolean;frames:IsolatedRect[];}
const atlases:Record<string,IsolatedAtlas>=data;
export function isolatedAtlas(file:string):IsolatedAtlas|undefined {const name=decodeURIComponent(file.split('?')[0].split('/').pop()??'').replace(/\.(png|webp|avif)$/,'');return atlases[name];}
