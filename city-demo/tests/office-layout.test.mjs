import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3,Group,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FLOORS,NAV_BOUNDS,BUILDING_BOUNDS} from '../src/world/floors.js';
import {objectCollider,doorCollider} from '../src/world/colliders.js';
import {seatApproaches,seatSegmentClear} from '../src/world/interactions.js';
import {createNavigation} from '../src/movement.js';
const registry=new Map(JSON.parse(readFileSync(new URL('../public/models/manifest.json',import.meta.url))).assets.map(a=>[a.id,a]));
const templates=new Map(),loader=new GLTFLoader();
for(const id of new Set(FLOORS.flatMap(f=>f.objects.map(o=>o.assetId)))){
  const bytes=readFileSync(new URL('../public/models/'+registry.get(id).file,import.meta.url));
  const model=(await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
  templates.set(id,model);registry.get(id).bounds=new Box3().setFromObject(model);
}
function placed(o){const group=new Group();group.add(templates.get(o.assetId).clone(true));group.position.fromArray(o.position);group.rotation.y=o.yaw;group.scale.fromArray(o.scale);group.updateMatrixWorld(true);return group;}
const floors=FLOORS.map(f=>{
  const obstacles=[...f.objects.map(o=>objectCollider(o,registry)).filter(Boolean),...f.doors.map(d=>doorCollider(d,true))];
  return {...f,obstacles,nav:createNavigation(obstacles,NAV_BOUNDS),boxes:new Map(f.objects.map(o=>[o.id,new Box3().setFromObject(placed(o))]))};
});
const structure=o=>/^(wall_|glass_|window_|entrance_)/.test(o.assetId);
function overlap(a,b){return Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x)>.025&&Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z)>.025;}
function assertWalk(f,to){
  const path=f.nav.findPath(f.liftSpawn,to);assert.ok(path.length,'No route on floor '+f.id+' to '+JSON.stringify(to));
  const p={...f.liftSpawn};
  for(const next of path){
    for(let frame=0;frame<3000&&Math.hypot(next.x-p.x,next.z-p.z)>.005;frame++){
      const dx=next.x-p.x,dz=next.z-p.z,d=Math.hypot(dx,dz),step=Math.min(d,2.4/60);
      if(!f.nav.move(p,dx/d*step,dz/d*step))break;
    }
    assert.ok(Math.hypot(p.x-next.x,p.z-next.z)<.005,'Route stuck on floor '+f.id+' at '+JSON.stringify(p)+' toward '+JSON.stringify(next));
  }
}
test('All placed GLB geometry, including offset stair landings, remains inside the floor',()=>{
  const failures=[];
  for(const f of floors)for(const o of f.objects){const b=f.boxes.get(o.id),e=.001;
    if(b.min.x<BUILDING_BOUNDS.minX-e||b.max.x>BUILDING_BOUNDS.maxX+e||b.min.z<BUILDING_BOUNDS.minZ-e||b.max.z>BUILDING_BOUNDS.maxZ+e)failures.push(o.id);
  }
  assert.deepEqual(failures,[]);
});
test('Ground furniture does not intersect other furniture, partitions or open door leaves',()=>{
  const failures=[];
  for(const f of floors){
    const items=f.objects.filter(o=>o.solid);
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
      const a=items[i],b=items[j];if(structure(a)&&structure(b))continue; // Intentional wall junctions.
      // The portal threshold joins the cabin floor; its alignment is checked below.
      if([a.assetId,b.assetId].sort().join('/')==='elevator_cabin/elevator_portal')continue;
      if(overlap(f.boxes.get(a.id),f.boxes.get(b.id)))failures.push([a.id,b.id]);
    }
    for(const door of f.doors){const group=placed(f.objects.find(o=>o.id===door.id));let leaf;
      group.traverse(n=>{if(n.name.startsWith('hinge_left')){n.rotation.y=-Math.PI/2;leaf=n;}});group.updateMatrixWorld(true);
      const box=new Box3().setFromObject(leaf);
      for(const item of items.filter(o=>!structure(o)))if(overlap(box,f.boxes.get(item.id)))failures.push([door.id,item.id]);
    }
  }
  assert.deepEqual(failures,[]);
});
test('Both sides of every room door and all lift/stair approaches have executable routes',()=>{
  for(const f of floors){
    for(const d of f.doors)for(const side of [-1,1])assertWalk(f,{x:d.x+Math.sin(d.yaw)*.5*side,z:d.z+Math.cos(d.yaw)*.5*side});
    for(const point of f.interactions.filter(i=>i.type!=='seat'))assertWalk(f,point);
  }
});
test('Lift portals face the corridor and join a covered, enclosed service shaft on every floor',()=>{
  for(const f of floors){
    const cabin=f.objects.find(o=>o.assetId==='elevator_cabin'),portal=f.objects.find(o=>o.assetId==='elevator_portal');
    const cb=f.boxes.get(cabin.id),pb=f.boxes.get(portal.id),call=f.interactions.find(i=>i.type==='lift');
    assert.equal(portal.yaw,0,'Lift doors must face the +Z corridor');
    assert.equal(cabin.yaw,portal.yaw,'Cabin opening must face the portal');
    assert.equal(cabin.position[0],portal.position[0]);
    assert.ok(Math.abs(cb.max.z-portal.position[2])<.01,'Cabin front must meet the portal');
    assert.ok(pb.min.x<cb.min.x&&pb.max.x>cb.max.x,'Portal must cover the cabin opening');
    assert.ok(call.z>pb.max.z+NAV_BOUNDS.radius,'Call point must be in front of the closed doors');
    assert.ok(f.nav.blocked(portal.position[0],portal.position[2]),'Closed lift must block walking through its doors');
    const roof=f.objects.find(o=>o.roomId==='lift-shaft'),rb=roof&&f.boxes.get(roof.id);
    assert.ok(rb&&rb.min.y>=cb.max.y&&rb.min.x<=cb.min.x&&rb.max.x>=cb.max.x&&rb.min.z<=cb.min.z&&rb.max.z>=cb.max.z,'Cabin must sit entirely under the shaft roof');
    // A detached cabin would allow the avatar to circle around its rear.
    for(const x of [cb.min.x-.6,cabin.position[0],cb.max.x+.6]){
      assert.equal(f.nav.findPath(f.liftSpawn,{x,z:cb.min.z-.55}).length,0,'Space inside/behind the shaft must not be accessible');
    }
  }
});
test('Lift call points and both adjoining service approaches remain walkable',()=>{
  for(const f of floors){
    const call=f.interactions.find(i=>i.type==='lift');
    assertWalk(f,call);
    assert.ok(f.nav.clearSegment(f.liftSpawn,call),'Lift selection requires an unobstructed approach');
    for(const x of [-3.9,1.6]){
      const side={x,z:call.z};assertWalk(f,side);
      assert.ok(f.nav.clearSegment(side,call),'Lift frontage must not narrow the cross corridor');
    }
  }
});
test('Every chair, occupied workstation and sofa has one continuously reachable seating approach',()=>{
  for(const f of floors)for(const o of f.objects.filter(o=>/^(chair_|stool_|sofa_|armchair_)/.test(o.assetId))){
    const seat={id:o.id,x:o.position[0],z:o.position[2],yaw:o.yaw};
    const approach=seatApproaches(seat).find(p=>!f.nav.blocked(p.x,p.z)&&seatSegmentClear(seat,p,f.obstacles)&&f.nav.findPath(f.liftSpawn,p).length);
    assert.ok(approach,o.id+' cannot be reached and exited without crossing furniture');assertWalk(f,approach);
  }
});
test('Storage, boards, screens and service fixtures can be approached from their visible front',()=>{
  for(const f of floors)for(const o of f.objects.filter(o=>/^(bookshelf|cabinet|filing_|server_|whiteboard|presentation|coffee_counter|fridge|washbasin|toilet)/.test(o.assetId))){
    const front={x:Math.sin(o.yaw),z:Math.cos(o.yaw)};
    const candidates=[.75,1,1.3].flatMap(d=>[-.3,0,.3].map(t=>({x:o.position[0]+front.x*d+Math.cos(o.yaw)*t,z:o.position[2]+front.z*d-Math.sin(o.yaw)*t})));
    const approach=candidates.find(p=>!f.nav.blocked(p.x,p.z)&&f.nav.findPath(f.liftSpawn,p).length);
    assert.ok(approach,o.id+' faces a wall or blocked space');assertWalk(f,approach);
  }
});
test('Chairs and seated employees face the working side of their table; monitors face the user',()=>{
  for(const f of floors){
    const tables=f.objects.filter(o=>/^(desk_compact|desk_classroom|reception_counter|table_training|table_meeting_small|table_round|table_cafe)$/.test(o.assetId));
    for(const o of f.objects.filter(o=>/^(chair_task_green|chair_training|chair_meeting|stool_cafe|employee_seated.*)$/.test(o.assetId))){
      const table=[...tables].sort((a,b)=>Math.hypot(a.position[0]-o.position[0],a.position[2]-o.position[2])-Math.hypot(b.position[0]-o.position[0],b.position[2]-o.position[2]))[0];
      const b=f.boxes.get(table.id);
      assert.ok(Array.from({length:60},(_,i)=>(i+1)*.05).some(t=>{const x=o.position[0]+Math.sin(o.yaw)*t,z=o.position[2]+Math.cos(o.yaw)*t;return x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z;}),o.id+' faces away from '+table.id);
    }
    for(const monitor of f.objects.filter(o=>o.assetId==='monitor')){
      const chair=f.objects.filter(o=>o.assetId==='chair_task_green').sort((a,b)=>Math.hypot(a.position[0]-monitor.position[0],a.position[2]-monitor.position[2])-Math.hypot(b.position[0]-monitor.position[0],b.position[2]-monitor.position[2]))[0];
      const dx=chair.position[0]-monitor.position[0],dz=chair.position[2]-monitor.position[2];
      assert.ok((dx*Math.sin(monitor.yaw)+dz*Math.cos(monitor.yaw))/Math.hypot(dx,dz)>.8,monitor.id+' shows its back to the user');
    }
  }
});
test('Open door collider encloses the actual GLB leaf and handles at every door rotation',()=>{
  for(const f of floors)for(const d of f.doors){
    const group=placed(f.objects.find(o=>o.id===d.id));let leaf;
    group.traverse(n=>{if(n.name.startsWith('hinge_left')){n.rotation.y=-Math.PI/2;leaf=n;}});group.updateMatrixWorld(true);
    const b=new Box3().setFromObject(leaf),c=doorCollider(d,true),e=.001;
    assert.ok(c.x-c.w/2<=b.min.x+e&&c.x+c.w/2>=b.max.x-e&&c.z-c.d/2<=b.min.z+e&&c.z+c.d/2>=b.max.z-e,d.id+' has an inaccurate open collision');
  }
});
test('Offset GLB collision stays aligned after scaling and rotation',()=>{
  const o={id:'offset',assetId:'offset',solid:true,position:[3,0,7],scale:[2,1,3],yaw:Math.PI/2};
  const bounds=new Box3(new Vector3(-1,0,-3),new Vector3(2,1,1));
  const c=objectCollider(o,new Map(),bounds);
  assert.ok(Math.abs(c.x)<1e-8&&Math.abs(c.z-6)<1e-8&&Math.abs(c.w-12)<1e-8&&Math.abs(c.d-6)<1e-8);
});
