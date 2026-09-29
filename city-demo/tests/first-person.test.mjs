import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {EYE_HEIGHT,PHARMACY_HEIGHT_SCALE,LOOK_LIMIT,lookDirection,turnLook,positionEyes,createLookInput,createRoomEnvelope} from '../src/world/firstPerson.js';
import {createNavigation} from '../src/movement.js';
import {PHARMACY_FIXTURES,PHARMACY_SPAWN,pharmacyObstacles} from '../src/city/pharmacyLayout.js';
import {INTERIOR_BOUNDS} from '../src/city/catalog.js';

test('Eye-level movement follows camera heading, keeps diagonals normalized and respects shelf collisions',()=>{
  const nav=createNavigation(pharmacyObstacles(),INTERIOR_BOUNDS);
  for(const yaw of [0,Math.PI/2,-Math.PI/2,Math.PI]){
    const camera=new T.PerspectiveCamera(),p={...PHARMACY_SPAWN,y:.08};
    positionEyes(camera,p,{yaw,pitch:.6});
    const forward=camera.getWorldDirection(new T.Vector3()),move=lookDirection({x:0,z:-1},yaw);
    assert.ok(move.x*forward.x+move.z*forward.z>.8);
    const diagonal=lookDirection({x:Math.SQRT1_2,z:-Math.SQRT1_2},yaw);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-10);
    for(let i=0;i<150;i++){nav.move(p,move.x*.08,move.z*.08);assert.equal(nav.blocked(p.x,p.z),false);}
  }
});
test('Eye camera has fixed height without bobbing, clamped pitch, and seated height can be restored',()=>{
  const camera=new T.PerspectiveCamera();let pose={yaw:0,pitch:0};
  pose=turnLook(pose,100000,-100000);assert.equal(pose.pitch,LOOK_LIMIT);assert.ok(Math.abs(pose.yaw)<=Math.PI);
  pose=turnLook(pose,0,100000);assert.equal(pose.pitch,-LOOK_LIMIT);
  for(const x of [0,1,2]){positionEyes(camera,{x,y:.08,z:2},pose);assert.equal(camera.position.y,.08+EYE_HEIGHT);assert.equal(camera.position.x,x);}
  positionEyes(camera,{x:0,y:0,z:0},pose,1.05);assert.equal(camera.position.y,1.05);
  const counter=PHARMACY_FIXTURES.find(f=>f.id==='cashier');assert.ok(counter.height*PHARMACY_HEIGHT_SCALE<EYE_HEIGHT-.3);
});
class Target {
  handlers=new Map();captured=null;
  addEventListener(type,fn){if(!this.handlers.has(type))this.handlers.set(type,new Set());this.handlers.get(type).add(fn);}
  removeEventListener(type,fn){this.handlers.get(type)?.delete(fn);}
  emit(type,props={}){const e={button:0,pointerId:1,clientX:0,clientY:0,preventDefault(){},...props};for(const f of this.handlers.get(type)||[])f(e);}
  focus(){} setPointerCapture(id){this.captured=id;}hasPointerCapture(id){return this.captured===id;}releasePointerCapture(){this.captured=null;}
}
test('View hotkey and drag ignore typing/panels; cancel, blur and disposal release gestures',()=>{
  const canvas=new Target(),events=new Target();let enabled=true,first=false,toggles=0,looks=0;
  const input=createLookInput(canvas,{eventTarget:events,canUse:()=>enabled,isFirstPerson:()=>first,onToggle(){first=!first;toggles++;},onLook(){looks++;}});
  events.emit('keydown',{code:'KeyV',target:{closest:()=>true}});assert.equal(toggles,0);
  events.emit('keydown',{code:'KeyV',ctrlKey:true});assert.equal(toggles,0);
  enabled=false;events.emit('keydown',{code:'KeyV'});assert.equal(toggles,0);enabled=true;
  events.emit('keydown',{key:'м'});assert.equal(toggles,1);events.emit('keydown',{code:'KeyV',repeat:true});assert.equal(toggles,1);
  canvas.emit('pointerdown');canvas.emit('pointermove',{clientX:50});assert.equal(looks,1);assert.equal(canvas.captured,1);
  canvas.emit('pointercancel');canvas.emit('pointermove',{clientX:100});assert.equal(looks,1);assert.equal(canvas.captured,null);
  canvas.emit('pointerdown');events.emit('blur');canvas.emit('pointermove');assert.equal(looks,1);
  canvas.emit('pointerdown');events.emit('keydown',{key:'Escape'});canvas.emit('pointermove');assert.equal(canvas.captured,null);assert.equal(looks,1);
  canvas.emit('pointerdown');enabled=false;canvas.emit('pointermove');assert.equal(canvas.captured,null);assert.equal(looks,1);
  input.dispose();assert.ok([...canvas.handlers.values(),...events.handlers.values()].every(set=>set.size===0));
});
test('Interior enclosure leaves the entrance open and can be removed without disposing shared assets',()=>{
  const envelope=createRoomEnvelope({width:18,depth:14,height:4,front:true});assert.equal(envelope.root.visible,false);
  envelope.root.visible=true;envelope.root.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(0,EYE_HEIGHT,5),new T.Vector3(0,0,1),0,3);
  assert.equal(ray.intersectObjects(envelope.root.children,false).length,0);
  ray.set(new T.Vector3(0,EYE_HEIGHT,0),new T.Vector3(0,1,0));assert.ok(ray.intersectObjects(envelope.root.children,false).length>0);
  envelope.dispose();assert.equal(envelope.root.parent,null);
});
