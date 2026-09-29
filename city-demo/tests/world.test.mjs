import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {FLOORS,NAV_BOUNDS,BUILDING_BOUNDS,rotatedFootprint} from '../src/world/floors.js';
import {Box3,Vector3,OrthographicCamera,Group} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {followPlayer,cameraRelativeDirection} from '../src/world/camera.js';
import {objectCollider,doorCollider} from '../src/world/colliders.js';
import {createNavigation,movementDirection,createKeyboardInput} from '../src/movement.js';
import {findSeatApproach,seatApproaches,seatSegmentClear} from '../src/world/interactions.js';
const manifest=JSON.parse(readFileSync(new URL('../public/models/manifest.json',import.meta.url)));
const registry=new Map(manifest.assets.map(a=>[a.id,a]));
// Use the same loaded GLB bounds as assembleFloor, not centred manifest dimensions.
const loader=new GLTFLoader();
for(const id of new Set(FLOORS.flatMap(f=>f.objects.filter(o=>o.solid).map(o=>o.assetId)))){
  const bytes=readFileSync(new URL('../public/models/'+registry.get(id).file,import.meta.url));
  registry.get(id).bounds=new Box3().setFromObject((await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene);
}
function nav(f,open=true){return createNavigation([...f.objects.map(o=>objectCollider(o,registry)).filter(Boolean),...f.doors.map(d=>doorCollider(d,open))],NAV_BOUNDS);}
test('Every placed asset exists and has finite transforms and unique instance IDs',()=>{
  for(const f of FLOORS){
    assert.equal(new Set(f.objects.map(o=>o.id)).size,f.objects.length);
    for(const o of f.objects){const asset=registry.get(o.assetId);assert.ok(asset,o.assetId);assert.ok(existsSync(new URL('../public/models/'+asset.file,import.meta.url)));assert.ok([...o.position,...o.scale,o.yaw].every(Number.isFinite));}
  }
});
test('The entrance-to-reception path is directly clear, including shoulders',()=>{
  const navigation=nav(FLOORS[0],false);
  for(const x of [-.6,0,.6])assert.ok(navigation.clearSegment({x,z:8.9},{x,z:1.05}),'Blocked reception approach at x='+x);
});
test('Every floor arrival is outside furniture and can reach the lift',()=>{
  for(const f of FLOORS){const navigation=nav(f);assert.equal(navigation.blocked(f.spawn.x,f.spawn.z),false,'spawn '+f.id);assert.equal(navigation.blocked(f.liftSpawn.x,f.liftSpawn.z),false,'lift '+f.id);assert.ok(navigation.findPath(f.spawn,f.liftSpawn).length,'lift route '+f.id);}
});
test('Every room doorway is traversable when open and blocks when closed',()=>{
  for(const f of FLOORS)for(const door of f.doors){
    const opened=nav(f),closed=nav(f,false);
    const a={x:door.x+Math.sin(door.yaw)*.44,z:door.z+Math.cos(door.yaw)*.44},b={x:door.x-Math.sin(door.yaw)*.44,z:door.z-Math.cos(door.yaw)*.44};
    assert.ok(opened.clearSegment(a,b),'Door opening '+f.id+' '+door.title);
    assert.equal(closed.clearSegment(a,b),false,'Closed '+door.title);
    assert.ok(opened.findPath(f.liftSpawn,a).length||opened.findPath(f.liftSpawn,b).length,'Reachable door '+f.id+' '+door.title);
  }
});
test('Seat interactions include free exit points and reachable approaches',()=>{
  for(const f of FLOORS){const navigation=nav(f),obstacles=[...f.objects.map(o=>objectCollider(o,registry)).filter(Boolean),...f.doors.map(d=>doorCollider(d,true))];for(const seat of f.interactions.filter(i=>i.type==='seat')){
    const approach=findSeatApproach(seat,navigation,undefined,obstacles);assert.ok(approach,'Seat exit '+seat.id);
    assert.ok(seatApproaches(seat).some(p=>!navigation.blocked(p.x,p.z)&&seatSegmentClear(seat,p,obstacles)&&navigation.findPath(f.liftSpawn,p).length),'Seat route '+seat.id);
  }}
});
test('Holding D/В and ArrowRight follows the same collision-safe route from each floor arrival',()=>{
  for(const f of FLOORS){
    const ends=[];
    for(const [code,key] of [['KeyD','d'],['KeyD','в'],['ArrowRight','ArrowRight']]){
      const eventTarget=new EventTarget();
      const input=createKeyboardInput({eventTarget,onChange(){},onStop(){},onHome(){}});
      const press=new Event('keydown',{cancelable:true});Object.assign(press,{code,key});eventTarget.dispatchEvent(press);
      const navigation=nav(f,false),start=f.id===1?f.spawn:f.liftSpawn,position={...start};
      for(let frame=0;frame<90;frame++){
        const direction=cameraRelativeDirection(movementDirection(input.keys));
        navigation.move(position,direction.x*2.4/30,direction.z*2.4/30);
        assert.equal(navigation.blocked(position.x,position.z),false);
      }
      assert.ok(Math.hypot(position.x-start.x,position.z-start.z)>4,'No sustained movement on floor '+f.id);
      const release=new Event('keyup');Object.assign(release,{code,key});eventTarget.dispatchEvent(release);
      assert.deepEqual(movementDirection(input.keys),{x:0,z:0});ends.push(position);input.dispose();
    }
    assert.deepEqual(ends[0],ends[1]);assert.deepEqual(ends[0],ends[2]);
  }
});
test('Sitting can cross its own chair but never a partition or another desk',()=>{
  const seat={id:'chair',x:0,z:0,yaw:0};
  const obstacles=[{id:'chair',x:0,z:0,w:.6,d:.5},{id:'wall',x:0,z:.6,w:3,d:.12}];
  assert.equal(seatSegmentClear(seat,{x:0,z:1.4},obstacles),false);
  assert.equal(seatSegmentClear(seat,{x:0,z:-1.4},obstacles),true);
});
test('Footprints respect rotations and local scale without changing height',()=>{
  const box=rotatedFootprint(2,4,3,1,Math.PI/2);assert.ok(Math.abs(box.w-1)<1e-6);assert.ok(Math.abs(box.d-3)<1e-6);
  const c=objectCollider({id:'test',assetId:'test',position:[0,8,0],scale:[2,7,3],yaw:Math.PI/2,solid:true},new Map([['test',{dimensions:[2,1,9]}]]));
  assert.ok(Math.abs(c.w-3)<1e-6);assert.ok(Math.abs(c.d-4)<1e-6);
});
test('Open-door collision follows the hinge and leaves the doorway clear',()=>{
  const d={id:'d',x:0,z:0,width:1.49,yaw:0};
  const a=doorCollider(d,false),b=doorCollider(d,true);assert.equal(a.x,0);assert.ok(b.x<0&&b.z>0);assert.ok(b.w<.2);
});

test('The camera keeps the avatar and its label at fixed screen anchors throughout a route',()=>{
  const camera=new OrthographicCamera(-8,8,5.25,-5.25,.1,100),target=new Vector3();
  for(const zoom of [.65,1,2.1]){
    camera.zoom=zoom;camera.updateProjectionMatrix();let headAnchor,bodyAnchor;
    for(let i=0;i<100;i++){
      const position={x:Math.sin(i*.3)*10,z:-9+i*.18};
      followPlayer(camera,target,position);
      const head=new Vector3(position.x,1.7,position.z).project(camera);
      const body=new Vector3(position.x,.65,position.z).project(camera);
      headAnchor??=head.clone();bodyAnchor??=body.clone();
      assert.ok(head.distanceTo(headAnchor)<1e-12,'Label drifts with movement');
      assert.ok(body.distanceTo(bodyAnchor)<1e-12,'Avatar drifts with movement');
    }
  }
});

test('Keyboard movement stays aligned with the screen in the diagonal view without a speed boost',()=>{
  const camera=new OrthographicCamera(-8,8,5.25,-5.25,.1,100),target=new Vector3();
  followPlayer(camera,target,{x:0,z:0});
  const origin=new Vector3(0,.65,0).project(camera);
  for(const [code,axis,sign]of [['KeyW','y',1],['ArrowUp','y',1],['KeyS','y',-1],['KeyA','x',-1],['KeyD','x',1]]){
    const d=cameraRelativeDirection(movementDirection(new Set([code])));
    const delta=new Vector3(d.x,.65,d.z).project(camera).sub(origin);
    assert.ok(delta[axis]*sign>0,code+' goes the wrong way on screen');
    assert.ok(Math.abs(delta[axis==='x'?'y':'x'])<1e-12,code+' drifts sideways');
    assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<1e-12);
  }
  for(const keys of [['KeyW','KeyD'],['KeyS','KeyA'],[]]){
    const d=cameraRelativeDirection(movementDirection(new Set(keys)));
    assert.ok(Math.abs(Math.hypot(d.x,d.z)-(keys.length?1:0))<1e-12,'Rotation changes walking speed');
  }
});

test('Only the ground floor has an exterior entrance; upper front walls block the whole facade',()=>{
  for(const f of FLOORS){
    assert.equal(f.objects.filter(o=>o.entrance).length,f.id===1?1:0);
    assert.equal(!!f.entranceId,f.id===1);
    if(f.id>1){const walls=f.objects.filter(o=>o.assetId==='wall_half'&&o.position[2]>9.7).map(o=>objectCollider(o,registry));
      for(let x=-11.7;x<=11.7;x+=.2)assert.ok(walls.some(w=>Math.abs(x-w.x)<=w.w/2),'Open facade '+f.id+' at '+x);
    }
  }
});

test('Back hallway cannot bypass side-room doors through missing rear walls',()=>{
  for(const f of FLOORS){const navigation=nav(f,false);
    for(const room of f.rooms.filter(r=>r.bounds?.minZ===-4)){
      const x=(room.bounds.minX+room.bounds.maxX)/2;
      assert.equal(navigation.clearSegment({x,z:-4.6},{x,z:-3.4}),false,room.id+' has an open back wall');
    }
  }
});

test('Actual GLB wall, window, partition and plant geometry stays inside the slab',async()=>{
  const loader=new GLTFLoader(),templates=new Map();
  const checked=/^(wall_|window_|glass_|entrance_|plant_|tree_)/;
  const assets=new Set(FLOORS.flatMap(f=>f.objects.filter(o=>checked.test(o.assetId)).map(o=>o.assetId)));
  for(const id of assets){const bytes=readFileSync(new URL('../public/models/'+registry.get(id).file,import.meta.url));
    const model=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');templates.set(id,model.scene);
  }
  const failures=[],walls=new Map(FLOORS.map(f=>[f.id,[]]));
  for(const f of FLOORS)for(const o of f.objects.filter(o=>checked.test(o.assetId))){
    const holder=new Group(),model=templates.get(o.assetId).clone(true);holder.add(model);
    holder.position.fromArray(o.position);holder.rotation.y=o.yaw;holder.scale.fromArray(o.scale);
    const b=new Box3().setFromObject(holder),e=.0001;
    if(o.assetId==='wall_half')walls.get(f.id).push(b);
    if(b.min.x<BUILDING_BOUNDS.minX-e||b.max.x>BUILDING_BOUNDS.maxX+e||b.min.z<BUILDING_BOUNDS.minZ-e||b.max.z>BUILDING_BOUNDS.maxZ+e)failures.push({id:o.id,min:b.min.toArray(),max:b.max.toArray()});
  }
  assert.deepEqual(failures,[]);
  for(const f of FLOORS)for(const x of [-11.98,11.98])for(const z of [-9.98,9.98])
    assert.ok(walls.get(f.id).some(b=>b.containsPoint(new Vector3(x,.5,z))),'Missing wall corner on floor '+f.id);
});
