// The rendered perimeter and its solid footprints share one plan. Keep the
// navigation safety limit outside the visible fence, never across an open path.
export const CITY_BOUNDS={minX:-41,maxX:41,minZ:-41,maxZ:41,cellSize:.6,radius:.38};
export const CITY_EDGE=40.6;
export const CITY_PAVING_SIZE=(CITY_EDGE+1.4)*2;
const GATE_HALF=4.2,WALL_DEPTH=.64,POST_SIZE=.88;
export const CITY_GATEWAYS=[
  {id:'north',x:0,z:-CITY_EDGE,yaw:Math.PI,title:'СЕВЕРНЫЙ РАЙОН'},
  {id:'east',x:CITY_EDGE,z:0,yaw:Math.PI/2,title:'ВОСТОЧНЫЙ РАЙОН'},
  {id:'south',x:0,z:CITY_EDGE,yaw:0,title:'ГОРОД ПРОЕКТОВ',main:true},
  {id:'west',x:-CITY_EDGE,z:0,yaw:-Math.PI/2,title:'ЗАПАДНЫЙ РАЙОН'},
];

export function boundaryPoint(side,along=0,inset=0){
  const c=Math.cos(side.yaw),s=Math.sin(side.yaw);
  return {x:side.x+along*c-inset*s,z:side.z-along*s-inset*c};
}
function footprint(side,along,length,depth){
  const p=boundaryPoint(side,along),vertical=Math.abs(Math.sin(side.yaw))>.5;
  return {...p,w:vertical?depth:length,d:vertical?length:depth};
}
export function cityBoundaryPlan(){
  const walls=[],posts=[],gates=[],seen=new Set();
  for(const side of CITY_GATEWAYS){
    for(const [from,to] of [[-CITY_EDGE,-GATE_HALF],[GATE_HALF,CITY_EDGE]]){
      const count=Math.ceil((to-from)/4.6),length=(to-from)/count;
      for(let i=0;i<count;i++){
        const along=from+(i+.5)*length;
        walls.push({...footprint(side,along,length,WALL_DEPTH),side,along,length});
      }
      for(let i=0;i<=count;i++){
        const along=from+i*length,p=boundaryPoint(side,along),key=p.x.toFixed(3)+':'+p.z.toFixed(3);
        if(seen.has(key))continue;seen.add(key);
        posts.push({...p,w:POST_SIZE,d:POST_SIZE,gate:Math.abs(Math.abs(along)-GATE_HALF)<.01});
      }
    }
    gates.push({...footprint(side,0,GATE_HALF*2,.36),side,length:GATE_HALF*2,approach:boundaryPoint(side,0,3.2)});
  }
  return {walls,posts,gates};
}
export function cityBoundaryObstacles(){
  const {walls,posts,gates}=cityBoundaryPlan();
  return [...walls,...posts,...gates].map(({x,z,w,d})=>({x,z,w,d}));
}

export function buildCityBoundary(k){
  const {walls,posts,gates}=cityBoundaryPlan(),iron='#344b43',stone='#b4a790',cap='#e0d3b9';
  const localBox=(side,along,y,inset,w,h,d,color)=>{
    const p=boundaryPoint(side,along,inset);k.box(p.x,y,p.z,w,h,d,color,side.yaw);
  };
  for(const wall of walls){
    const {side,along,length}=wall;
    localBox(side,along,.18,0,length,.36,WALL_DEPTH,stone);
    localBox(side,along,.41,0,length,.12,WALL_DEPTH,cap);
    // Open metal panels keep the city readable from the overhead camera.
    for(const y of [.68,1.42])localBox(side,along,y,0,length,.085,.11,iron);
    for(let dx=-length/2+.29;dx<length/2;dx+=.38)
      localBox(side,along+dx,.99,0,.065,1.04,.065,iron);
    // A narrow planted strip softens the OUTSIDE edge without occupying paths.
    localBox(side,along,.035,-1.05,length,.13,1.2,'#708752');
    for(let dx=-length/2+.45;dx<length/2;dx+=.95){
      const p=boundaryPoint(side,along+dx,-1.04);
      k.bush(p.x,p.z,1.08,wall.x*7+wall.z+dx,.1);
    }
  }
  for(const post of posts){
    const {x,z,w,d,gate}=post,h=gate?2.52:1.62;
    k.box(x,h/2,z,w*.79,h,d*.79,stone);
    k.box(x,.16,z,w,.32,d,'#928571');
    k.box(x,h,z,w,.16,d,cap);
    for(const y of [.48,1.0])k.box(x,y,z,w*.81,.035,d*.81,'#938773');
    if(gate){
      k.box(x,h+.22,z,.35,.3,.35,k.glow('#ffdc99',.75));
      k.box(x,h+.43,z,.53,.12,.53,iron);
      for(const dx of [-.19,.19])for(const dz of [-.19,.19])k.box(x+dx,h+.22,z+dz,.04,.34,.04,iron);
    }
  }
  for(const {side,length} of gates){
    // Closed, visibly solid gates reserve the street axes for future districts.
    // They are decorative until a neighbouring district is actually connected.
    for(const y of [.28,1.34])localBox(side,0,y,0,length,.12,.25,iron);
    for(let along=-GATE_HALF+.3;along<GATE_HALF;along+=.32)
      localBox(side,along,.81,0,.07,1.06,.07,iron);
    for(const along of [-.08,.08])localBox(side,along,.84,0,.1,1.32,.28,iron);
    localBox(side,0,.035,0,length,.07,.36,'#978c75');
    const signY=side.main?3.06:1.73,signW=side.main?6.6:4.2,signH=side.main?.8:.9;
    if(side.main){
      for(const along of [-GATE_HALF,GATE_HALF])localBox(side,along,2.9,0,.15,1.35,.15,iron);
      localBox(side,0,3.5,0,length+.3,.16,.24,iron);
    }
    for(const inside of [true,false]){
      const p=boundaryPoint(side,0,inside?.21:-.21);
      k.sign(side.title,p.x,signY,p.z,signW,signH,{yaw:side.yaw+(inside?Math.PI:0),bg:iron,fg:'#f2e7ce',border:'#9eaf8b',sub:side.main?'ЦЕНТРАЛЬНЫЙ КВАРТАЛ':'БУДУЩЕЕ РАСШИРЕНИЕ'});
    }
  }
}
