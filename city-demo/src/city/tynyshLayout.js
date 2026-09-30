// Scene furniture and navigation share stable table IDs and free service points.
export const TYNYSH_TABLES=[-1,1].flatMap((side,column)=>[-3,.65,4.25].map((z,row)=>({id:column*3+row+1,x:side*4.5,z,approach:{x:side*2.35,z}})));
export const TYNYSH_STAFF=[{id:'daniyar',name:'Данияр',color:'#f6f0db',x:1.05,z:5.6},{id:'aida',name:'Аида',color:'#72907b',x:-1.05,z:5.6},{id:'admin',name:'Администратор',color:'#287b66',x:-7.1,z:3.1}];
export const TYNYSH_SPAWN={x:0,z:6};
export const TYNYSH_EXIT={id:'exit',type:'exit',title:'Выйти в город',x:0,z:6.3,radius:1};
export function tynyshObstacles(){return [
  ...TYNYSH_TABLES.map(t=>({x:t.x,z:t.z,w:3.25,d:3.25})),
  {x:0,z:-5.45,w:8.3,d:2.2},{x:-7.7,z:5.05,w:.9,d:2.2},{x:7.4,z:5.1,w:1.2,d:2},
  ...[-1,1].map(side=>({x:side*7.55,z:-5.5,w:1.2,d:1.2})),
  {x:-5.1,z:6.85,w:6.9,d:.25},{x:5.1,z:6.85,w:6.9,d:.25},
];}
