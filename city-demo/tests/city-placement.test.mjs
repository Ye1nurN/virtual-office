import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {PROJECTS,CITY_BOUNDS,CITY_OBSTACLES,CITY_SPAWN,spawnOutside} from '../src/city/catalog.js';
import {districtFurniture,districtPeople,districtObstacles,standingPersonFootprint} from '../src/city/districtLayout.js';
import {buildingPoint,buildingFootprint} from '../src/city/buildingFrame.js';
import {createNavigation} from '../src/movement.js';

const overlaps=(a,b,margin=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+margin&&Math.abs(a.z-b.z)<(a.d+b.d)/2+margin;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('Every project is centred on its fixed parcel with balanced building setbacks',()=>{
  for(const p of PROJECTS){
    const box=buildingFootprint(p),left=p.parcelX-9.65,right=p.parcelX+9.65,back=p.parcelZ-9.3,front=p.parcelZ+9.3;
    close(box.x-box.w/2-left,right-box.x-box.w/2);
    close(box.z-box.d/2-back,front-box.z-box.d/2);
    assert.ok(box.x-box.w/2>left&&box.x+box.w/2<right);
    assert.ok(box.z-box.d/2>back&&box.z+box.d/2<front);
  }
});

test('Standing visitors occupy free paving, do not overlap one another, and leave door routes clear',()=>{
  const people=districtPeople().filter(p=>!p.seat),solids=[...CITY_OBSTACLES,...districtFurniture()];
  const navigation=createNavigation(districtObstacles(),CITY_BOUNDS);
  assert.equal(new Set(districtPeople().map(p=>p.id)).size,districtPeople().length);
  for(const p of people){
    const box=standingPersonFootprint(p);
    for(const solid of solids)assert.equal(overlaps(box,solid,.1),false,p.id+' clear of '+(solid.type||'building'));
    for(const other of people.filter(o=>o.id!==p.id))assert.equal(overlaps(box,standingPersonFootprint(other),.2),false,p.id+' separated from '+other.id);
    assert.equal(navigation.blocked(p.x,p.z),true,p.id+' cannot be walked through');
  }
  for(const p of PROJECTS){
    const visitor=people.find(n=>n.project===p.id),expected=buildingPoint(p,p.id==='pharmacy'?-2.3:2.3,p.d/2+3.65);
    close(visitor.x,expected.x);close(visitor.z,expected.z);close(visitor.yaw,p.yaw||0);
    assert.ok(navigation.findPath(CITY_SPAWN,p.entry).length,p.id+' entrance reachable');
    assert.ok(navigation.clearSegment(p.entry,spawnOutside(p.id)),p.id+' exit clear');
    assert.ok(Math.hypot(visitor.x-p.entry.x,visitor.z-p.entry.z)>2.5,p.id+' visitor away from doorway');
  }
});

test('Actual GLB bodies fit the visitor footprints; seated characters contact their own bench',async()=>{
  const templates=new Map(),loader=new GLTFLoader();
  for(const person of districtPeople()){
    if(!templates.has(person.assetId)){
      const b=readFileSync(new URL('../public/models/'+person.assetId+'.glb',import.meta.url));
      templates.set(person.assetId,(await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene);
    }
    const mesh=templates.get(person.assetId).clone(true);mesh.position.set(person.x,person.y,person.z);mesh.scale.setScalar(person.s);mesh.rotation.y=person.yaw;
    const box=new Box3().setFromObject(mesh);
    if(!person.seat){
      const footprint=standingPersonFootprint(person);
      assert.ok(box.min.x>=footprint.x-footprint.w/2&&box.max.x<=footprint.x+footprint.w/2,person.id+' full body width');
      assert.ok(box.min.z>=footprint.z-footprint.d/2&&box.max.z<=footprint.z+footprint.d/2,person.id+' full body depth');
      close(box.min.y,.085);
    }else{
      const bench=districtFurniture().find(b=>b.id===person.seat);
      close(person.y+.53*person.s,.8*bench.s);close(person.yaw,bench.yaw);
      assert.ok(box.min.y>=.085&&box.min.y<.13,person.id+' feet at paving');
      assert.ok(Math.abs(person.x-bench.x)<.03&&Math.abs(person.z-bench.z)<.03,person.id+' centred on seat');
      const toPlaza={x:-bench.x,z:-bench.z};
      assert.ok(Math.sin(person.yaw)*toPlaza.x+Math.cos(person.yaw)*toPlaza.z>0,person.id+' faces plaza');
    }
  }
});
