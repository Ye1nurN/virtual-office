import test from 'node:test';
import assert from 'node:assert/strict';
import {Euler,Quaternion,Vector3} from 'three';
import {PROJECTS,spawnOutside,exteriorPortals} from '../src/city/catalog.js';
import {buildingPoint,buildingFootprint,buildingBackGarden} from '../src/city/buildingFrame.js';
import {buildProjectBuilding} from '../src/city/buildings.js';
import {districtFurniture} from '../src/city/districtLayout.js';

const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,message+`: ${a} != ${b}`);
function recordBuilding(project){
  const calls={box:[],plane:[],sign:[],model:[],flowerbed:[]};
  const kit={glow:c=>c,surface:()=> '#ffffff',bush(){}};
  for(const type of Object.keys(calls))kit[type]=(...args)=>{
    calls[type].push(args);
    if(type==='plane')return {quaternion:new Quaternion().setFromEuler(new Euler(-Math.PI/2,0,0))};
  };
  buildProjectBuilding(kit,project);return calls;
}

test('All facades, entry points and exit spawns point towards the plaza',()=>{
  for(const p of PROJECTS){
    const yaw=p.yaw||0,forward={x:Math.sin(yaw),z:Math.cos(yaw)};
    close((forward.x*-p.x+forward.z*-p.z)/Math.hypot(p.x,p.z),1,p.id+' faces centre');
    const door=buildingPoint(p,0,p.d/2),outside=spawnOutside(p.id),portal=exteriorPortals().find(i=>i.project===p.id);
    close(p.entry.x-door.x,forward.x*1.3,p.id+' entry x');close(p.entry.z-door.z,forward.z*1.3,p.id+' entry z');
    close(outside.x-p.entry.x,forward.x*1.4,p.id+' exit x');close(outside.z-p.entry.z,forward.z*1.4,p.id+' exit z');
    close(portal.x,p.entry.x,p.id+' portal x');close(portal.z,p.entry.z,p.id+' portal z');
    const bounds=buildingFootprint(p),px=p.parcelX??p.x,pz=p.parcelZ??p.z;
    assert.ok(Math.abs(p.x-px)+bounds.w/2+.4<9.65,p.id+' roof within parcel x');
    assert.ok(Math.abs(p.z-pz)+bounds.d/2+.4<9.3,p.id+' roof within parcel z');
    if(p.id!=='office'){close(bounds.w,p.d,p.id+' collision width');close(bounds.d,p.w,p.id+' collision depth');}
  }
});

test('Rotated procedural facade preserves every box transform, including tilted awnings',()=>{
  for(const p of PROJECTS.filter(p=>p.yaw)){
    const flat=recordBuilding({...p,yaw:0}),rotated=recordBuilding(p),turn=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),p.yaw);
    assert.equal(rotated.box.length,flat.box.length);
    flat.box.forEach(([x,y,z,w,h,d,color,angle=0,rx=0,rz=0],i)=>{
      const actual=rotated.box[i],at=buildingPoint(p,x-p.x,z-p.z);
      close(actual[0],at.x,p.id+' box x');close(actual[1],y,p.id+' box y');close(actual[2],at.z,p.id+' box z');
      assert.deepEqual(actual.slice(3,7),[w,h,d,color]);
      const expectedQ=new Quaternion().setFromEuler(new Euler(rx,angle,rz)).premultiply(turn);
      const actualQ=new Quaternion().setFromEuler(new Euler(actual[8],actual[7],actual[9]));
      close(Math.abs(actualQ.dot(expectedQ)),1,p.id+' box orientation');
    });
    for(let i=0;i<flat.sign.length;i++){
      const sign=flat.sign[i],actual=rotated.sign[i],at=buildingPoint(p,sign[1]-p.x,sign[3]-p.z);
      close(actual[1],at.x,p.id+' sign x');close(actual[3],at.z,p.id+' sign z');close(actual[6].yaw,p.yaw,p.id+' sign facing');
    }
  }
});

test('Facade flowerbeds and rear gardens share their rotated collision footprints',()=>{
  const furniture=districtFurniture();
  for(const p of PROJECTS){
    for(const [x,z,w,d] of recordBuilding(p).flowerbed){
      const obstacle=furniture.find(i=>i.type==='building-flowers'&&Math.hypot(i.x-x,i.z-z)<1e-7);
      assert.ok(obstacle,p.id+' flowerbed collision exists');
      assert.ok(obstacle.w>=w+.18-1e-8&&obstacle.w<=w+.2+1e-8,p.id+' planter width covered');
      assert.ok(obstacle.d>=d+.18-1e-8&&obstacle.d<=d+.2+1e-8,p.id+' planter depth covered');
    }
    const garden=buildingBackGarden(p);
    assert.ok(furniture.some(i=>i.type==='back-garden'&&Math.hypot(i.x-garden.x,i.z-garden.z)<1e-7));
  }
});

test('A replacement GLB combines building direction with its model calibration',()=>{
  const p={...PROJECTS.find(p=>p.id==='pharmacy'),exteriorAsset:'future-pharmacy',exteriorYaw:.25};
  const calls=recordBuilding(p);
  assert.equal(calls.box.length,0);assert.equal(calls.model.length,1);
  assert.deepEqual(calls.model[0],[p.exteriorAsset,p.x,p.z,p.exteriorScale,p.yaw+.25]);
});
