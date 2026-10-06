// Shared by battlefield units and decorative stable training.
const families:Record<string,{walk:string;attack:string}>={
 'camel-spear':{walk:'camel',attack:'camel-spear'},
 'camel-sword':{walk:'camel-sword',attack:'camel-sword'},
 'horse-archer':{walk:'horse-archer',attack:'horse-archer'},
 'war-elephant':{walk:'war-elephant',attack:'war-elephant'},
 chariot:{walk:'chariot',attack:'chariot'},
};
export const mountedArt=(id:string)=>families[id];
