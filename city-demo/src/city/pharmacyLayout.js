// Geometry and navigation use the same footprints, independently of future GLB models.
export const PHARMACY_SPAWN={x:0,z:4.3};
export const PHARMACY_FIXTURES=[
  ...[-4.3,-.85,2.6].map((z,i)=>({id:['hygiene','care','vitamins'][i],type:'cabinet',x:-7.92,z,w:1.18,d:3.2,height:3.65,yaw:Math.PI/2,label:['ГИГИЕНА','УХОД','ВИТАМИНЫ'][i]})),
  {id:'back-left',type:'cabinet',x:-5.95,z:-6.12,w:3.25,d:1.15,height:2.95,label:''},
  {id:'medicine',type:'cabinet',x:-2.4,z:-6.12,w:3.4,d:1.15,height:4.12,label:'ЛЕКАРСТВА'},
  {id:'medicine-low',type:'cabinet',x:1.25,z:-6.12,w:3.55,d:1.15,height:2.85,label:'ЛЕКАРСТВА'},
  {id:'back-right',type:'cabinet',x:5.6,z:-6.12,w:4.1,d:1.15,height:3.2,label:''},
  {id:'right',type:'cabinet',x:7.92,z:1.1,w:1.18,d:6.8,height:3.5,yaw:-Math.PI/2,label:'ЗДОРОВЬЕ · КРАСОТА · ЗАБОТА'},
  {id:'island',type:'island',x:-2.3,z:.6,w:3.65,d:1.65,height:2.38,label:'ЗДОРОВЫЙ ОБРАЗ ЖИЗНИ'},
  {id:'promo',type:'island',x:4.45,z:2.8,w:1.95,d:1.15,height:1.98,label:'АКЦИИ'},
  {id:'cashier',type:'counter',x:4.9,z:-1.6,w:4.65,d:1.12,height:1.65},
  {id:'cashier-return',type:'counter',x:2.98,z:-3.06,w:.82,d:2.95,height:1.65},
  ...[[-7.6,5.3],[7.5,5.4],[7.55,-4.7]].map(([x,z],i)=>({id:'plant-'+i,type:'plant',x,z,w:1.05,d:1.05,height:1.9})),
];
export function pharmacyObstacles(){return [
  ...PHARMACY_FIXTURES.map(({id,x,z,w,d})=>({id,x,z,w,d})),
  ...[-5.45,5.45].map(x=>({id:'front-wall',x,z:6.8,w:6.9,d:.3})),
  ...[-1.94,1.94].map(x=>({id:'open-door',x,z:5.7,w:.12,d:1.6})),
];}
export const PHARMACY_EXIT={id:'exit',type:'exit',title:'Выйти в город',x:0,z:6.05,radius:1.2};
export const PHARMACY_CAMERA={yaw:5*Math.PI/180,height:23,distance:24};
export function pharmacyDirection({x,z}){const yaw=PHARMACY_CAMERA.yaw;return {x:x*Math.cos(yaw)+z*Math.sin(yaw),z:-x*Math.sin(yaw)+z*Math.cos(yaw)};}
