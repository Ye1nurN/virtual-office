// Choose an approach outside both the seat footprint and adjacent desk.
// The final short step into the seat may cross that seat only, never a wall.
export function seatApproaches(seat){
  const result=[];
  for(const distance of [.85,1.1,1.4])for(const offset of [0,Math.PI,Math.PI/2,-Math.PI/2,Math.PI/4,-Math.PI/4,Math.PI*3/4,-Math.PI*3/4]){
    const a=seat.yaw+offset;result.push({x:seat.x+Math.sin(a)*distance,z:seat.z+Math.cos(a)*distance});
  }
  return result;
}
export function seatSegmentClear(seat,from,obstacles,radius=.25){
  const steps=Math.ceil(Math.hypot(from.x-seat.x,from.z-seat.z)/.08);
  for(let i=0;i<=steps;i++){
    const t=steps?i/steps:0,x=from.x+(seat.x-from.x)*t,z=from.z+(seat.z-from.z)*t;
    if(obstacles.some(o=>o.id!==seat.id&&Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius))return false;
  }
  return true;
}
export function findSeatApproach(seat,navigation,from,obstacles=[]){
  return seatApproaches(seat).filter(p=>!navigation.blocked(p.x,p.z)&&(!from||navigation.clearSegment(from,p))&&seatSegmentClear(seat,p,obstacles)).sort((a,b)=>from?Math.hypot(a.x-from.x,a.z-from.z)-Math.hypot(b.x-from.x,b.z-from.z):0)[0]||null;
}
