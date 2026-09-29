import {PROJECTS,RESERVE_PLOTS,CITY_OBSTACLES} from './catalog.js';
import {buildingPoint,rotatedFootprint,buildingBackGarden} from './buildingFrame.js';
import {cityBoundaryObstacles} from './cityBoundary.js';

// A plan records visible furniture and its collision footprint together. Tests use the
// same obstacle list that the renderer returns, including plants and street furniture.
export function districtFurniture(){
  const items=[];
  const add=(type,x,z,w,d,options={})=>items.push({type,x,z,w,d,...options});
  for(const p of RESERVE_PLOTS){
    const seed=Number(p.id);
    add('tree',p.x-6.7,p.z-5.4,2.5,2.5,{s:1.19,seed,planter:false});
    add('bench',p.x+5.7,p.z-6.95,3.1,1.35,{s:1.12});
    add('plot-sign',p.x,p.z+1.5,5.7,.6,{id:p.id});
    for(const dx of [-8.3,8.3])for(let zz=-7;zz<=7;zz+=2.6)add('flowers',p.x+dx,p.z+zz,1.05,2.2,{seed:seed+zz});
    for(const dz of [-8.1,8.1])for(const dx of [-6,-3,3,6])add('flowers',p.x+dx,p.z+dz,2.4,1.1,{seed:seed+dx});
  }
  for(const p of PROJECTS){
    const front=p.d/2,garden=buildingBackGarden(p);
    const local=(type,x,z,w,d,options={})=>{const at=buildingPoint(p,x,z),size=rotatedFootprint(w,d,p.yaw);add(type,at.x,at.z,size.w,size.d,options);};
    add('back-garden',garden.x,garden.z,garden.w,garden.d);
    for(const dx of [-5,5])local('building-flowers',dx,front+2.45,3.33,.97);
    for(const dx of [-6.4,6.4])local('building-pot',dx,front+1.28,1.1,1.1);
    for(const dx of [-8.7,8.7])for(const dz of [-4,0,4])local('potted-tree',dx,dz,1.2,1.2,{s:.61,seed:dx+dz});
  }
  add('tree',2,-1.2,4.1,4.1,{s:1.55,seed:100,planter:true});
  add('flowers',2,-1.2,4.8,4.8,{seed:32,central:true});
  add('bench',-6.7,-1.7,1.4,3.3,{yaw:Math.PI/2,s:1.22});
  add('bench',6.8,1.4,1.4,3.3,{id:'plaza-east-bench',yaw:-Math.PI/2,s:1.22});
  add('bench',2,-6.8,3.3,1.4,{id:'plaza-north-bench',yaw:0,s:1.22});
  add('map',-3.6,-2,3.4,.6);
  for(const x of [-7.8,7.8])for(const z of [-7.8,7.8])add('potted-tree',x,z,1.5,1.5,{s:.72,seed:x+z});
  for(const x of [-6.5,6.5])for(const z of [15,22,29])add('potted-tree',x,z,1.65,1.65,{s:.91,seed:z});
  for(const x of [-3.3,3.3])for(const z of [19,27])add('flowers',x,z,1.25,2.5,{seed:z+x});
  for(const x of [-10.5,10.5])for(const z of [-32.9,-11.4,11.4,33])add('lamp',x,z,.75,.75,{s:1});
  for(const x of [-34.4,34.4])for(const z of [-32.9,-11.4,11.4,33])add('lamp',x,z,.75,.75,{s:1});
  for(const x of [-4.5,4.5])add('banner',x,21.5,.7,.7);
  for(const x of [-39,39])for(let z=-39;z<=39;z+=5.4)if(Math.abs(z)>7)add('tree',x,z,2.6,2.6,{s:1.06,seed:Math.abs(z),planter:true});
  for(const z of [-38.5,38.5])for(let x=-34;x<=34;x+=5.4)if(Math.abs(x)>8)add('tree',x,z,2.6,2.6,{s:1.01,seed:Math.abs(x),planter:true});
  return items;
}
// People at project entrances use the same local frame as the facade. Never
// leave a world-space NPC behind when a building is moved or turned.
export function districtPeople(){
  const standing=(id,assetId,x,z,yaw,extra={})=>({id,assetId,x,z,yaw,s:2.3,y:.085,...extra});
  const people=PROJECTS.map(p=>{
    const point=buildingPoint(p,p.id==='pharmacy'?-2.3:2.3,p.d/2+3.65);
    return standing(p.id+'-visitor',p.id==='argus'?'employee_blond':'employee_base',point.x,point.z,p.yaw||0,{project:p.id});
  });
  people.push(standing('plaza-west-visitor','employee_blond',-6.3,-5.5,.7),
    standing('plaza-east-visitor','employee_blond',5.6,5.5,-1),
    standing('entry-visitor','employee_base',1.2,28,Math.PI));
  for(const bench of districtFurniture().filter(i=>i.id?.endsWith('-bench'))){
    const s=1.65,yaw=bench.yaw||0;
    // GLB seat contact is local y=.53; the slatted bench top is .8 * its scale.
    // This also leaves the feet just above the plaza paving instead of floating.
    people.push({id:bench.id+'-reader',assetId:bench.id==='plaza-east-bench'?'employee_seated':'employee_seated_blond',
      x:bench.x+Math.sin(yaw)*.02*bench.s,z:bench.z+Math.cos(yaw)*.02*bench.s,
      y:.8*bench.s-.53*s,s,yaw,seat:bench.id});
  }
  return people;
}
export function standingPersonFootprint(person){
  return {x:person.x,z:person.z,...rotatedFootprint(.535*person.s+.2,.4*person.s+.2,person.yaw)};
}
export function districtObstacles(){return [...CITY_OBSTACLES,...districtFurniture().map(({x,z,w,d})=>({x,z,w,d})),...cityBoundaryObstacles(),...districtPeople().filter(p=>!p.seat).map(standingPersonFootprint)];}
