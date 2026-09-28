import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation} from '../src/movement.js';
import {INTERIOR_BOUNDS,SHELVES} from '../src/city/catalog.js';
import {PHARMACY_FIXTURES,PHARMACY_SPAWN,PHARMACY_EXIT,pharmacyObstacles,pharmacyDirection} from '../src/city/pharmacyLayout.js';

test('Pharmacy entrance, all advertising shelves and the counter have collision-free approaches',()=>{
  const nav=createNavigation(pharmacyObstacles(),INTERIOR_BOUNDS);
  const targets=[...SHELVES,PHARMACY_EXIT,{id:'counter',x:4.5,z:-.1}];
  assert.equal(nav.blocked(PHARMACY_SPAWN.x,PHARMACY_SPAWN.z),false);
  for(const start of [PHARMACY_SPAWN,...SHELVES])for(const target of targets){
    assert.equal(nav.blocked(target.x,target.z),false,target.id+' free approach');
    if(start===target)continue;
    const path=nav.findPath(start,target);assert.ok(path.length,`${start.id||'entry'} → ${target.id}`);
    let previous=start;for(const point of path){assert.ok(nav.clearSegment(previous,point));previous=point;}
  }
});
test('Pharmacy fixtures are inside the room and stop movement through cabinets and counters',()=>{
  const nav=createNavigation(pharmacyObstacles(),INTERIOR_BOUNDS);
  for(const f of PHARMACY_FIXTURES){
    assert.ok(Math.abs(f.x)+f.w/2<8.9,f.id+' width');assert.ok(Math.abs(f.z)+f.d/2<6.85,f.id+' depth');
    assert.equal(nav.blocked(f.x,f.z),true,f.id+' collider');
  }
  const position={...PHARMACY_SPAWN};nav.move(position,0,10);assert.ok(position.z<=INTERIOR_BOUNDS.maxZ);
});
test('Pharmacy keyboard follows its camera rotation without increasing diagonal speed',()=>{
  for(const dir of [{x:1,z:0},{x:0,z:-1},{x:Math.SQRT1_2,z:Math.SQRT1_2}]){
    const moved=pharmacyDirection(dir);assert.ok(Math.abs(Math.hypot(moved.x,moved.z)-1)<1e-12);
  }
  const right=pharmacyDirection({x:1,z:0});assert.ok(right.x>0&&right.z<0);
});
