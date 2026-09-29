import test from 'node:test';
import assert from 'node:assert/strict';
import {createGuideWalker,guideMeetingPoint,GUIDE_SPEED} from '../src/guide/guideWalker.js';
import {GUIDE_POSITION} from '../src/guide/knowledge.js';
import {createNavigation} from '../src/movement.js';
import {districtObstacles} from '../src/city/districtLayout.js';
import {CITY_BOUNDS,PROJECTS} from '../src/city/catalog.js';

test('the NPC walks collision-free between every project entrance and waits beside the door',()=>{
  const nav=createNavigation(districtObstacles(),CITY_BOUNDS);
  const stops=PROJECTS.map(p=>({...guideMeetingPoint(p,nav),yaw:p.yaw||0}));
  for(const from of [GUIDE_POSITION,...stops])for(const to of stops){
    const walker=createGuideWalker(nav,from);assert.ok(walker.goTo(to,to.yaw));
    for(let i=0;i<3000&&walker.snapshot().phase==='walking';i++){
      const previous=walker.snapshot(),pose=walker.update(1/30);
      assert.equal(nav.blocked(pose.x,pose.z),false);assert.ok(nav.clearSegment(previous,pose));
      assert.ok(Math.hypot(pose.x-previous.x,pose.z-previous.z)<=GUIDE_SPEED/30+1e-6);
    }
    const pose=walker.snapshot();assert.equal(pose.phase,'arrived');assert.ok(Math.hypot(pose.x-to.x,pose.z-to.z)<.001);assert.equal(pose.yaw,to.yaw);
    assert.deepEqual(walker.update(20),pose,'An arrived guide stays at the entrance');
  }
  stops.forEach((stop,i)=>assert.ok(Math.hypot(stop.x-PROJECTS[i].entry.x,stop.z-PROJECTS[i].entry.z)>1,'Door centre remains clear'));
});
test('NPC pause, resume and delayed frames never move a visitor or jump across obstacles',()=>{
  const nav=createNavigation([{x:0,z:0,w:1,d:3}],{minX:-5,maxX:5,minZ:-5,maxZ:5,radius:.3});
  const visitor={x:-4,z:0},walker=createGuideWalker(nav,visitor),target={x:4,z:0};
  assert.ok(walker.goTo(target));const pose=walker.update(20);assert.ok(Math.hypot(pose.x+4,pose.z)<=GUIDE_SPEED*.1+1e-6);assert.deepEqual(visitor,{x:-4,z:0});
  const paused=walker.pause();assert.deepEqual(walker.update(1),paused);assert.ok(walker.goTo(target));
  assert.equal(walker.goTo({x:0,z:0}),false);assert.equal(walker.snapshot().phase,'paused');assert.equal(walker.goTo({x:NaN,z:0}),false);
  walker.restore({x:4,z:4,yaw:1});assert.equal(walker.snapshot().x,4);walker.restore({x:0,z:0});assert.equal(walker.snapshot().x,4,'Blocked restore is ignored');
});
