/** Find transparent gutters near the nominal grid, without deleting image pixels.
 * Generated sheets can drift by several pixels; dividing width/height alone clips
 * helmets and transfers them to the neighbouring animation frame.
 */
export function atlasGutters(alpha:Uint8Array,width:number,height:number,rows:number,columns:number){
 // Touching neighbours (a raised sabre, a horse tail) leave no empty line. Cut through
 // the least-occupied line instead of rejecting the whole sheet; a few stray pixels
 // beat silently falling back to the recoloured base atlas.
 const cut=(profile:Uint32Array,ideal:number,span:number)=>{
  let best=-1,score=Infinity,thin=-1,least=Infinity;
  for(let i=Math.max(1,Math.floor(ideal-span));i<Math.min(profile.length-1,Math.ceil(ideal+span));i++){
   const d=Math.abs(i-ideal),load=profile[i]*4+d/span;if(load<least){thin=i;least=load;}
   if(profile[i-1]||profile[i]||profile[i+1])continue;
   if(d<score){best=i;score=d;}
  }
  return best>=0?best:thin;
 };
 const yp=new Uint32Array(height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(alpha[y*width+x]>70)yp[y]++;
 const ys=[0];for(let r=1;r<rows;r++){const y=cut(yp,r*height/rows,height/rows*.2);if(y<0)return null;ys.push(y);}ys.push(height);
 const cells:{x0:number;x1:number;y0:number;y1:number}[][]=[];
 for(let r=0;r<rows;r++){
  const xp=new Uint32Array(width),y0=ys[r],y1=ys[r+1];
  for(let y=y0;y<y1;y++)for(let x=0;x<width;x++)if(alpha[y*width+x]>70)xp[x]++;
  const xs=[0];for(let col=1;col<columns;col++){const x=cut(xp,col*width/columns,width/columns*.18);if(x<0)return null;xs.push(x);}xs.push(width);
  cells.push(Array.from({length:columns},(_,col)=>({x0:xs[col],x1:xs[col+1],y0,y1})));
 }
 return cells;
}
