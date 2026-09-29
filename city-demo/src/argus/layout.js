export const LAB_BOUNDS={minX:-10.4,maxX:10.4,minZ:-6.6,maxZ:7.2,radius:.34,cellSize:.25};
export const LAB_SPAWN={x:0,z:3.1};
export const LAB_SPOTS={
  console:{x:0,z:1.6,title:'Сравнить сообщения',action:'nodes'},
  analyst:{x:-4.7,z:1.5,title:'Спросить аналитика',action:'help'},
  exit:{x:0,z:6.7,title:'Выйти в город',action:'exit'},
};
export const DESKS=[{x:-7,z:-.9},{x:-7,z:2.0},{x:7,z:-.9},{x:7,z:2.0}];
export const LAB_OBSTACLES=[
  {x:0,z:-.25,w:3.8,d:1.4},
  ...DESKS.flatMap(({x,z})=>[{x,z,w:3.15,d:1.7},{x,z:z+1.07,w:1,d:.7}]),
  {x:8.6,z:-5.3,w:3,d:1.6},{x:-9.2,z:-5.1,w:1.4,d:1.4},
  {x:-9.6,z:-6.3,w:1.5,d:.65},
  ...[-9.6,9.6].map(x=>({x,z:-2.7,w:1,d:1})),
  ...[-9.6,9.6].map(x=>({x,z:5.65,w:1,d:1})),
  ...[-6.55,6.55].map(x=>({x,z:7.4,w:8.9,d:.25})),
];
export function nearestSpot(position){
  const sorted=Object.entries(LAB_SPOTS).map(([id,s])=>({...s,id,distance:Math.hypot(position.x-s.x,position.z-s.z)})).sort((a,b)=>a.distance-b.distance);
  return sorted[0].distance<1.8?sorted[0]:null;
}
