import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation} from '../src/movement.js';
import {CITY_SPAWN} from '../src/city/catalog.js';
import {districtObstacles} from '../src/city/districtLayout.js';
import {CITY_BOUNDS,CITY_EDGE,CITY_GATEWAYS,CITY_PAVING_SIZE,boundaryPoint,cityBoundaryPlan,cityBoundaryObstacles,buildCityBoundary} from '../src/city/cityBoundary.js';

test('The entire visible perimeter, including gate seams and corners, stops a fast dash',()=>{
  const navigation=createNavigation(cityBoundaryObstacles(),CITY_BOUNDS);
  for(const side of CITY_GATEWAYS){
    for(let along=-CITY_EDGE;along<=CITY_EDGE;along+=.21){
      const at=boundaryPoint(side,along);
      assert.ok(navigation.blocked(at.x,at.z),side.id+' unbroken boundary at '+along);
      if(Math.abs(along)>CITY_EDGE-2)continue;
      const position=boundaryPoint(side,along,2);
      assert.equal(navigation.blocked(position.x,position.z),false);
      navigation.move(position,Math.sin(side.yaw)*30,Math.cos(side.yaw)*30);
      const distance=position.x*Math.sin(side.yaw)+position.z*Math.cos(side.yaw);
      assert.ok(distance<CITY_EDGE-.35,side.id+' stops before fence, not at safety limit');
      assert.equal(navigation.blocked(position.x,position.z),false);
    }
  }
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const position={x:sx*(CITY_EDGE-3),z:sz*(CITY_EDGE-3)};
    navigation.move(position,sx*50,sz*50);
    assert.ok(Math.abs(position.x)<CITY_EDGE&&Math.abs(position.z)<CITY_EDGE,'no diagonal corner escape');
  }
});

test('Every gateway is reachable and lets the player turn back; outside clicks have no route',()=>{
  const navigation=createNavigation(districtObstacles(),CITY_BOUNDS);
  for(const {side,approach} of cityBoundaryPlan().gates){
    assert.equal(navigation.blocked(approach.x,approach.z),false,side.id+' clear approach');
    const route=navigation.findPath(CITY_SPAWN,approach);
    assert.ok(route.length,side.id+' reachable from plaza');
    let previous=CITY_SPAWN;
    for(const point of route){assert.ok(navigation.clearSegment(previous,point));previous=point;}
    const position={...approach};
    navigation.move(position,Math.sin(side.yaw)*20,Math.cos(side.yaw)*20);
    const stopped={...position};
    navigation.move(position,-Math.sin(side.yaw)*2,-Math.cos(side.yaw)*2);
    assert.ok(Math.hypot(position.x-stopped.x,position.z-stopped.z)>1.9,side.id+' can leave gate');
    assert.ok(navigation.findPath(position,CITY_SPAWN).length,side.id+' return to city');
    assert.deepEqual(navigation.findPath(approach,boundaryPoint(side,0,-1)),[],side.id+' closed gate');
    assert.deepEqual(navigation.findPath(approach,boundaryPoint(side,0,-12)),[],side.id+' outside map');
  }
});

test('Visible wall bases, gate thresholds and pillars match collision footprints and fit the paving',()=>{
  const boxes=[];
  buildCityBoundary({box:(...args)=>boxes.push(args),sign(){},bush(){},glow:c=>c});
  for(const obstacle of cityBoundaryObstacles()){
    assert.ok(Math.abs(obstacle.x)+obstacle.w/2<CITY_PAVING_SIZE/2);
    assert.ok(Math.abs(obstacle.z)+obstacle.d/2<CITY_PAVING_SIZE/2);
    const matching=boxes.some(([x,y,z,w,h,d,color,yaw=0])=>{
      const worldW=Math.abs(Math.cos(yaw))*w+Math.abs(Math.sin(yaw))*d;
      const worldD=Math.abs(Math.sin(yaw))*w+Math.abs(Math.cos(yaw))*d;
      return y<.3&&Math.hypot(x-obstacle.x,z-obstacle.z)<1e-7&&Math.abs(worldW-obstacle.w)<1e-7&&Math.abs(worldD-obstacle.d)<1e-7;
    });
    assert.ok(matching,'solid obstacle has a visible base at '+obstacle.x+', '+obstacle.z);
  }
});
