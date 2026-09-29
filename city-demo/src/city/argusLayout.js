export const ARGUS_BOTS=[
  {id:'operator',name:'Оператор',color:'#4bc3c7',x:-5.9,z:2.6},
  {id:'analyst',name:'Аналитик',color:'#e5b563',x:0,z:2.1},
  {id:'engineer',name:'Инженер',color:'#749de5',x:5.8,z:2.6},
];
export const ARGUS_STATIONS={stream:{x:-4.4,z:.4},detect:{x:-6.4,z:-3.1},analyze:{x:0,z:.4},respond:{x:6.4,z:-3.1},verify:{x:4.4,z:.4}};
export const ARGUS_DESKS=[-4.4,0,4.4];
export const ARGUS_SERVERS=[-7,-5.3,5.3,7];
export function argusObstacles(){return [
  ...ARGUS_DESKS.flatMap(x=>[{x,z:-2.4,w:2.25,d:1.25},{x,z:-1,w:.85,d:.85}]),
  ...ARGUS_SERVERS.map(x=>({x,z:-5,w:1.1,d:1.4})),
  ...[-7.7,7.7].map(x=>({x,z:4.5,w:1,d:1})),
  {x:-5.3,z:6.8,w:7.4,d:.3},{x:5.3,z:6.8,w:7.4,d:.3},
]}
