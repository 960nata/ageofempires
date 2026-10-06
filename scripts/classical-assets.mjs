import * as T from 'three';
const mat=(name,color,metalness=0)=>new T.MeshStandardMaterial({name,color,metalness,roughness:metalness?.4:.85});
const stone=mat('limestone','#c5bca3'),marble=mat('limestone','#d4cfbd'),tile=mat('roof','#a56843'),blue=mat('team-cloth','#414e86'),red=mat('team-cloth','#9e3c2c'),gold=mat('brass','#c7a360',.65),wood=mat('oak','#776149'),dark=mat('shadow','#38362e');
function add(p,g,m,x=0,y=0,z=0){const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);p.add(mesh);return mesh;}
const box=(p,size,m,x=0,y=0,z=0)=>add(p,new T.BoxGeometry(...size),m,x,y,z);
function column(p,x,z,h,persian){add(p,new T.CylinderGeometry(.13,.19,h,20),persian?stone:marble,x,h/2+.45,z);box(p,[.46,.18,.46],stone,x,.45,z);box(p,[.5,.16,.5],stone,x,h+.4,z);if(persian){for(const sign of [-1,1]){const capital=add(p,new T.SphereGeometry(.18,14,10),stone,x+sign*.16,h+.65,z);capital.scale.set(1,.65,1.1);}}}
function roof(p,x,z,w,d,y){const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,.8);shape.lineTo(w/2,0);shape.closePath();const r=add(p,new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),tile,x,y,z-d/2);for(let i=0;i<Math.ceil(w/.28);i++){const dx=-w/2+i*.28;box(p,[.05,.04,d],tile,x+dx,y+.8*(1-Math.abs(dx)/(w/2))+.03,z);}return r;}
export function classicalStructure(id,faction){
 const root=new T.Group();root.name='Structure';const persian=faction==='persian',big=['town','keep','landmark','specialist'].includes(id),r=big?3.2:2,h=big?3.2:2.1,cloth=persian?blue:red;
 box(root,[r*2+.35,.3,r*1.9+.35],stone,0,.15,0);
 const ceremonial=['town','landmark','academy','healing','specialist'].includes(id);
 if(ceremonial){
  box(root,[r*1.55,h,r*1.3],persian?stone:marble,0,h/2+.3,-.35);
  for(let step=0;step<4;step++)box(root,[r*1.65,.12,r*.3+.5],stone,0,.06+step*.12,r*.8+.2-step*.12);
  const columns=big?6:4;for(let i=0;i<columns;i++)column(root,-r+.3+i*(r*2-.6)/(columns-1),r*.78,h,persian);
  if(persian){box(root,[r*2+.5,.4,r*1.95],stone,0,h+.75,0);box(root,[r*2+.55,.3,.07],cloth,0,h+.72,r*.98);for(let i=0;i<14;i++)box(root,[.14,.12,.06],gold,-r+i*r*2/14,h+.74,r+.02);for(const x of [-r,r])column(root,x,-r*.65,h,true);}
  else{box(root,[r*2+.4,.24,r*1.95],marble,0,h+.5,0);roof(root,0,0,r*2+.6,r*2,h+.6);}
 }else{
  // Courtyard plan separates homes, workshops and military compounds.
  for(const x of [-r*.65,r*.65]){box(root,[r*.65,h,r*1.7],stone,x,h/2+.3,0);if(!persian)roof(root,x,0,r*.8,r*1.9,h+.3);else box(root,[r*.75,.25,r*1.8],stone,x,h+.45,0);}
  box(root,[r*2,h,r*.55],stone,0,h/2+.3,-r*.65);if(!persian)roof(root,0,-r*.65,r*2+.2,r*.7,h+.3);
  box(root,[r*2,.12,.14],cloth,0,1.5,r*.7);for(const x of [-r*.8,r*.8])column(root,x,r*.7,1.7,persian);
 }
 // Recessed entrances and shutters remain readable from the tactical camera.
 box(root,[.75,1.5,.06],dark,0,1.05,ceremonial?r*.31:-r*.35);
 for(const x of [-r*.75,r*.75]){box(root,[.4,.65,.04],dark,x,1.35,r*.86);box(root,[.42,.04,.09],wood,x,1.15,r*.88);}
 const pole=add(root,new T.CylinderGeometry(.025,.035,1.8,10),wood,r*.65,h+1.6,0);box(root,[.7,.5,.025],cloth,r*.65+.33,h+2.1,0);
 if(id==='keep'){for(const x of [-r,r])for(const z of [-r*.8,r*.8]){box(root,[1.1,h+1,1.1],stone,x,(h+1)/2,z);for(let k=0;k<3;k++)box(root,[.2,.4,1.12],stone,x-.4+k*.4,h+1.1,z);}for(const tier of [2,3]){const g=new T.Group();g.name='fortification'+tier;for(const x of [-r,r])box(g,[.4,h+.5,.8],stone,x,h/2,0);g.scale.set(1+(tier-2)*.1,1+(tier-2)*.15,1);root.add(g);}}
 if(id==='market'){for(const x of [-1,1]){box(root,[1,.6,.6],wood,x,.6,r*.7);box(root,[1.2,.1,1],cloth,x,1.8,r*.65);}}
 if(['stable','camel'].includes(id)){for(let i=0;i<6;i++)box(root,[.09,.9,.09],wood,-r+i*r*2/5,.65,r);box(root,[r*2,.12,.12],wood,0,1.0,r);}
 if(id==='range'){for(const x of [-1,1]){const target=add(root,new T.CylinderGeometry(.4,.4,.1,24),marble,x,1.1,r*.8);target.rotation.x=Math.PI/2;const center=add(root,new T.CylinderGeometry(.13,.13,.12,20),cloth,x,1.1,r*.87);center.rotation.x=Math.PI/2;}}
 if(id==='lumber'||id==='siege'){for(let i=0;i<5;i++){const log=add(root,new T.CylinderGeometry(.13,.13,1.6,12),wood,-.8+i*.35,.53,r*.65);log.rotation.x=Math.PI/2;}}
 if(id==='smithy'){box(root,[.5,3,.5],stone,-r*.7,1.8,-r*.5);box(root,[.6,.25,.3],dark,0,.85,r*.55);}
 if(id==='mill'){const rotor=new T.Group();rotor.name='rotor';rotor.position.set(0,1.8,r*.8);for(let i=0;i<8;i++){const spoke=box(rotor,[.09,1.5,.12],wood);spoke.rotation.z=i*Math.PI/4;}const rim=add(rotor,new T.TorusGeometry(.72,.1,8,32),wood);root.add(rotor);}
 for(const era of [1,2,3]){const g=new T.Group();g.name='era'+era;for(const x of [-r,r])box(g,[.12,.45,.08],era===3?gold:cloth,x,h+.3+era*.12,r*.88);root.add(g);}
 return root;
}

export function equipClassical(man,id){
 const roman=['legionary','centurion','equites'].includes(id),persian=['immortal','royal-archer','cataphract','war-elephant','chariot'].includes(id);if(!roman&&!persian)return;
 const head=man.getObjectByName('head'),body=man.getObjectByName('hips'),left=man.getObjectByName('handLeft');
 if(roman){
  // Scutum with a shallow curved face and central metal boss.
  if(id!=='equites'){left.clear();const face=new T.CylinderGeometry(.42,.42,.82,20,1,true,-Math.PI*.26,Math.PI*.52);const shield=add(left,face,red,0,-.08,-.3);box(left,[.045,.65,.05],gold,0,-.08,.13);const boss=add(left,new T.SphereGeometry(.07,16,12),gold,0,-.08,.15);boss.scale.z=.4;}
  for(let i=0;i<5;i++)box(body,[.47,.045,.34],gold,0,.12+i*.065,0);
  if(id==='centurion'){const crest=add(head,new T.TorusGeometry(.17,.075,8,24,Math.PI),red,0,.3,0);crest.rotation.y=Math.PI/2;}
 }else{
  const cloth=blue;for(let i=0;i<6;i++)box(body,[.42,.018,.3],gold,0,.08+i*.052,0);
  if(id==='immortal'){left.clear();box(left,[.48,.85,.055],wood,0,-.12,.1);for(let i=0;i<10;i++)box(left,[.48,.022,.016],gold,0,-.49+i*.08,.135);}
  const headdress=add(head,new T.CylinderGeometry(.09,.14,.21,20),cloth,0,.24,0);if(id==='immortal')box(head,[.21,.25,.06],cloth,0,0,-.13);
 }
}

export function elephant(){
 const root=new T.Group();root.name='Mount';const skin=mat('elephant-skin','#8b8879'),ivory=mat('ivory','#dbcfad'),body=new T.Group();body.name='mountBody';body.position.y=1.85;root.add(body);
 const torso=add(body,new T.SphereGeometry(1,32,22),skin);torso.scale.set(.85,.87,1.35);const head=add(body,new T.SphereGeometry(1,28,20),skin,0,.17,1.05);head.scale.set(.64,.72,.68);
 for(const sign of [-1,1]){const ear=add(body,new T.SphereGeometry(1,20,14),skin,sign*.68,.25,.9);ear.scale.set(.38,.62,.12);const tusk=new T.CatmullRomCurve3([new T.Vector3(sign*.32,-.2,1.4),new T.Vector3(sign*.43,-.3,1.9),new T.Vector3(sign*.42,-.05,2.2)]);add(body,new T.TubeGeometry(tusk,20,.055,10,false),ivory);add(body,new T.SphereGeometry(.045,12,8),dark,sign*.51,.38,1.47);}
 const trunk=new T.CatmullRomCurve3([new T.Vector3(0,.1,1.6),new T.Vector3(0,-.6,1.9),new T.Vector3(0,-1.4,2),new T.Vector3(0,-1.6,2.2)]);add(body,new T.TubeGeometry(trunk,24,.15,14,false),skin);
 for(const [side,front] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const name=`hoof${side<0?'L':'R'}${front<0?'Back':'Front'}`;const leg=new T.Group();leg.name=name;leg.position.set(side*.57,-.4,front*.8);add(leg,new T.CylinderGeometry(.23,.19,.7,18),skin,0,-.3,0);const lower=new T.Group();lower.name=name+'Lower';lower.position.y=-.6;add(lower,new T.CylinderGeometry(.19,.24,.8,18),skin,0,-.35,0);leg.add(lower);body.add(leg);}
 box(body,[1.55,.12,1.5],blue,0,.74,0);for(const x of [-.62,.62])box(body,[.08,.6,1.2],wood,x,1.02,0);return root;
}
