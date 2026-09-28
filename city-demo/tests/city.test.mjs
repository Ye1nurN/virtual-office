import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation} from '../src/movement.js';
import {PROJECTS,CITY_OBSTACLES,CITY_BOUNDS,CITY_SPAWN,RESERVE_PLOTS,exteriorPortals,spawnOutside} from '../src/city/catalog.js';
import {districtObstacles,districtFurniture} from '../src/city/districtLayout.js';

test('Detailed landscaping keeps every building entrance and every reserve sign reachable',()=>{
  const navigation=createNavigation(districtObstacles(),CITY_BOUNDS);
  const destinations=[...PROJECTS.map(p=>({...p.entry,id:p.id})),...RESERVE_PLOTS.map(p=>({x:p.x,z:p.z+3.1,id:p.id})),{x:-3.6,z:-.6,id:'map'}];
  assert.equal(navigation.blocked(CITY_SPAWN.x,CITY_SPAWN.z),false);
  for(const target of destinations){
    assert.equal(navigation.blocked(target.x,target.z),false,target.id+' free interaction point');
    const route=navigation.findPath(CITY_SPAWN,target);assert.ok(route.length,target.id+' reachable');
    let previous=CITY_SPAWN;for(const point of route){assert.ok(navigation.clearSegment(previous,point),target.id+' clearance');previous=point;}
  }
  for(const p of PROJECTS){const outside=spawnOutside(p.id);assert.equal(navigation.blocked(outside.x,outside.z),false,p.id+' return point');assert.ok(navigation.clearSegment(p.entry,outside));}
});

test('Street furniture footprints are finite and block travel through planters and benches',()=>{
  const furniture=districtFurniture(),navigation=createNavigation(districtObstacles(),CITY_BOUNDS);
  for(const item of furniture){
    for(const key of ['x','z','w','d'])assert.ok(Number.isFinite(item[key]),item.type+' '+key);
    assert.ok(item.w>0&&item.d>0);assert.equal(navigation.blocked(item.x,item.z),true,item.type);
  }
});

test('Every city entrance and return position is reachable without passing through a building',()=>{
  const navigation=createNavigation(CITY_OBSTACLES,CITY_BOUNDS);
  for(const project of PROJECTS){
    assert.equal(navigation.blocked(project.x,project.z),true,project.id+' footprint');
    assert.equal(navigation.blocked(project.entry.x,project.entry.z),false,project.id+' entrance');
    const returned=spawnOutside(project.id);
    assert.equal(navigation.blocked(returned.x,returned.z),false,project.id+' return');
    const route=navigation.findPath(CITY_SPAWN,project.entry);assert.ok(route.length,project.id+' path');
    let previous=CITY_SPAWN;for(const point of route){assert.ok(navigation.clearSegment(previous,point),project.id);previous=point;}
    assert.ok(navigation.clearSegment(project.entry,returned));
  }
});
test('Adding a configured project creates a portal with its own stable destination',()=>{
  const future={id:'next-project',name:'Следующий проект',entry:{x:-24,z:30}};
  const portals=exteriorPortals([...PROJECTS,future]);
  assert.equal(portals.at(-1).project,future.id);assert.equal(portals.at(-1).x,-24);
  assert.equal(new Set(portals.map(p=>p.id)).size,portals.length);
});
test('Reserved plots remain distinct and avoid project buildings',()=>{
  assert.equal(new Set(RESERVE_PLOTS.map(p=>p.id)).size,4);
  for(const plot of RESERVE_PLOTS)for(const project of PROJECTS){
    assert.ok(Math.abs(plot.x-project.x)>project.w/2+8||Math.abs(plot.z-project.z)>project.d/2+8);
  }
});
test('A quick dash cannot cross a city building or leave the district',()=>{
  const navigation=createNavigation(CITY_OBSTACLES,CITY_BOUNDS);
  for(const project of PROJECTS){const position={...project.entry};navigation.move(position,0,-25);assert.ok(position.z>project.z+project.d/2);}
  const position={x:40,z:38};navigation.move(position,20,20);assert.ok(position.x<=41&&position.z<=41);
});
