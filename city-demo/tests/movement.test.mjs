import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation,movementDirection,createKeyboardInput} from '../src/movement.js';

test('WASD and arrows share a direction; diagonals have the same speed',()=>{
  const cardinal=movementDirection(new Set(['KeyD'])),diagonal=movementDirection(new Set(['KeyD','ArrowUp']));
  assert.equal(Math.hypot(cardinal.x,cardinal.z),1);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-12);
  assert.deepEqual(movementDirection(new Set(['KeyW','ArrowDown'])),{x:0,z:0});
  assert.deepEqual(movementDirection(new Set(['KeyW','ArrowUp'])),{x:0,z:-1});
});

test('high-speed motion stops at a thin wall rather than tunnelling',()=>{
  const nav=createNavigation([{x:0,z:0,w:.1,d:10}]);const p={x:-2,z:0};
  assert.equal(nav.move(p,4,0),true);assert.ok(p.x<-.32);assert.ok(!nav.blocked(p.x,p.z));
});
test('collision slides along walls and stays within the office bounds',()=>{
  const nav=createNavigation([{x:0,z:0,w:.2,d:10}]);const p={x:-.4,z:0};nav.move(p,1,1);
  assert.ok(p.x<-.37);assert.ok(p.z>.9);
  const edge={x:11.3,z:9};nav.move(edge,6,6);assert.ok(edge.x<=11.4&&edge.z<=9.2);
});
test('path goes around furniture with clearance on every segment',()=>{
  const nav=createNavigation([{x:0,z:0,w:2,d:2}]);let previous={x:-3,z:0};const goal={x:3,z:0},path=nav.findPath(previous,goal);
  assert.ok(path.length>1);assert.deepEqual(path.at(-1),goal);
  for(const p of path){assert.ok(nav.clearSegment(previous,p));assert.ok(!nav.blocked(p.x,p.z));previous=p;}
});
test('blocked and unreachable targets do not create routes',()=>{
  const nav=createNavigation([{x:0,z:0,w:.1,d:30}]);
  assert.deepEqual(nav.findPath({x:-2,z:0},{x:2,z:0}),[]);
  assert.deepEqual(nav.findPath({x:-2,z:0},{x:0,z:0}),[]);
});
test('nearby clicks still move to their exact destination',()=>{
  const nav=createNavigation([]);const target={x:.03,z:.02};assert.deepEqual(nav.findPath({x:0,z:0},target),[target]);
});
test('two touching obstacles cannot be crossed through their diagonal corner',()=>{
  const nav=createNavigation([{x:-.5,z:.5,w:1,d:1},{x:.5,z:-.5,w:1,d:1}],{minX:-1.5,maxX:1.5,minZ:-1.5,maxZ:1.5});
  const path=nav.findPath({x:-1.3,z:-1.3},{x:1.3,z:1.3});let p={x:-1.3,z:-1.3};
  for(const next of path){assert.ok(nav.clearSegment(p,next));p=next;}
  assert.equal(nav.clearSegment({x:-1.3,z:-1.3},{x:1.3,z:1.3}),false);
});

class Events {
  listeners=new Map();
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,props={}){const e={code:'',target:{closest:()=>null},preventDefault(){this.prevented=true;},...props};for(const fn of this.listeners.get(type)||[])fn(e);return e;}
}
function keyboard(){const events=new Events(),calls={change:0,stop:0,home:0};let enabled=true;const input=createKeyboardInput({eventTarget:events,onChange:()=>calls.change++,onStop:()=>calls.stop++,onHome:()=>calls.home++,canUse:()=>enabled});return {events,calls,input,disable:()=>{enabled=false;}};}
test('physical key codes work with Cyrillic letters and release normally',()=>{
  const {events,input}=keyboard();const e=events.emit('keydown',{code:'KeyW',key:'ц'});assert.ok(input.keys.has('KeyW'));assert.equal(e.prevented,true);
  events.emit('keyup',{code:'KeyW'});assert.equal(input.keys.size,0);input.dispose();
});
test('D and Cyrillic В work when a keyboard event has no usable physical code',()=>{
  for(const props of [{code:'',key:'d'},{code:'Unidentified',key:'D'},{code:'',key:'в'},{code:'Unidentified',key:'В'}]){
    const {events,input}=keyboard();
    const e=events.emit('keydown',props);assert.equal(e.prevented,true);
    assert.deepEqual(movementDirection(input.keys),{x:1,z:0});
    events.emit('keydown',{...props,repeat:true});assert.equal(input.keys.size,1);
    events.emit('keyup',props);assert.equal(input.keys.size,0);input.dispose();
  }
});
test('Rightward keys survive mixed presses, layouts and release order',()=>{
  const {events,input}=keyboard();
  events.emit('keydown',{code:'KeyD',key:'в'});
  events.emit('keydown',{code:'ArrowRight',key:'ArrowRight'});
  events.emit('keyup',{code:'KeyD',key:'d'});
  assert.deepEqual(movementDirection(input.keys),{x:1,z:0});
  events.emit('keyup',{code:'ArrowRight',key:'ArrowRight'});
  assert.equal(input.keys.size,0);
  events.emit('keydown',{code:'KeyA',key:'d'});assert.deepEqual(movementDirection(input.keys),{x:-1,z:0},'Recognised physical WASD positions keep priority over layout');
  input.dispose();
});

test('D/В are accepted with unrelated, remapped or nonstandard browser codes',()=>{
  for(const props of [{code:'KeyB',key:'d'},{code:'D',key:'D'},{code:'KeyВ',key:'в'},{code:'Process',key:'В'}]){
    const {events,input}=keyboard();events.emit('keydown',props);
    assert.deepEqual(movementDirection(input.keys),{x:1,z:0});
    events.emit('keyup',props);assert.equal(input.keys.size,0);input.dispose();
  }
});

test('Legacy keyboard values work only when the printed key is unavailable',()=>{
  for(const props of [{key:'Unidentified',keyCode:68},{code:'Unidentified',which:68},{key:'',keyCode:39}]){
    const {events,input}=keyboard();events.emit('keydown',props);
    assert.deepEqual(movementDirection(input.keys),{x:1,z:0});
    events.emit('keyup',props);assert.equal(input.keys.size,0);input.dispose();
  }
  const {events,input}=keyboard();events.emit('keydown',{key:'b',code:'KeyB',keyCode:68});
  assert.equal(input.keys.size,0);events.emit('keydown',{key:'Unidentified',keyCode:68,isComposing:true});
  assert.equal(input.keys.size,0);input.dispose();
});

test('A remapped key releases even when the layout changes before keyup',()=>{
  const {events,input}=keyboard();
  events.emit('keydown',{code:'KeyB',key:'d'});
  events.emit('keydown',{code:'KeyD',key:'в'});
  events.emit('keyup',{code:'KeyB',key:'b'});
  assert.deepEqual(movementDirection(input.keys),{x:1,z:0},'Physical D is still held');
  events.emit('keyup',{code:'',key:'D'});
  assert.equal(input.keys.size,0,'Fallback release cannot leave D stuck');input.dispose();
});

test('Blocked input also rejects remapped and numeric movement keys',()=>{
  const {events,input,disable}=keyboard();
  for(const props of [{target:{closest:()=>({})}},{ctrlKey:true},{altKey:true},{metaKey:true},{isComposing:true}]){
    events.emit('keydown',{code:'KeyB',key:'d',...props});assert.equal(input.keys.size,0);
    events.emit('keydown',{keyCode:68,...props});assert.equal(input.keys.size,0);
  }
  disable();events.emit('keydown',{code:'KeyB',key:'в'});assert.equal(input.keys.size,0);input.dispose();
});

test('Movement down/up use matching capture listeners and fully detach',()=>{
  const calls=[],events=new Events();
  const add=events.addEventListener.bind(events),remove=events.removeEventListener.bind(events);
  events.addEventListener=(type,fn,capture)=>{calls.push(['add',type,capture]);add(type,fn);};
  events.removeEventListener=(type,fn,capture)=>{calls.push(['remove',type,capture]);remove(type,fn);};
  const input=createKeyboardInput({eventTarget:events,onChange(){},onStop(){},onHome(){}});
  input.dispose();
  for(const operation of ['add','remove'])for(const type of ['keydown','keyup'])
    assert.ok(calls.some(c=>c[0]===operation&&c[1]===type&&c[2]===true));
  assert.ok([...events.listeners.values()].every(set=>set.size===0));
});
test('typing, editable descendants, shortcuts and composing do not move the player',()=>{
  const {events,input}=keyboard();
  for(const props of [{target:{closest:()=>({})}},{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true}]){const e=events.emit('keydown',{code:'KeyW',...props});assert.equal(input.keys.size,0);assert.equal(e.prevented,undefined);}
  input.dispose();
});
test('blur, focus in a field, Escape and disabling UI clear movement',()=>{
  const {events,calls,input,disable}=keyboard();
  for(const event of ['blur','focusin']){events.emit('keydown',{code:'ArrowLeft'});events.emit(event,{target:{closest:()=>({})}});assert.equal(input.keys.size,0);}
  events.emit('keydown',{code:'KeyW'});events.emit('keydown',{code:'Escape'});assert.equal(input.keys.size,0);assert.equal(calls.stop,3);
  disable();events.emit('keydown',{code:'KeyD'});assert.equal(input.keys.size,0);input.dispose();
});
test('Home resets the view once, and disposal removes every listener',()=>{
  const {events,calls,input}=keyboard();events.emit('keydown',{code:'Home'});events.emit('keydown',{code:'Home',repeat:true});assert.equal(calls.home,1);
  input.dispose();events.emit('keydown',{code:'KeyW'});assert.equal(input.keys.size,0);assert.ok([...events.listeners.values()].every(set=>set.size===0));
});

test('Optional keyboard diagnostics explain accepted, unmapped and blocked events without changing input',()=>{
  const events=new Events(),reports=[];
  const input=createKeyboardInput({eventTarget:events,onChange(){},onStop(){},onHome(){},onInput:r=>reports.push(r)});
  events.emit('keydown',{code:'KeyD',key:'в'});
  assert.deepEqual(movementDirection(input.keys),{x:1,z:0});
  assert.equal(reports.at(-1).result,'accepted');assert.equal(reports.at(-1).resolved,'KeyD');
  events.emit('keyup',{code:'KeyD',key:'в'});assert.equal(input.keys.size,0);
  events.emit('keydown',{code:'KeyB',key:'b'});assert.equal(reports.at(-1).result,'unmapped');
  events.emit('keydown',{code:'KeyD',key:'d',ctrlKey:true});assert.equal(reports.at(-1).result,'shortcut');assert.equal(input.keys.size,0);
  input.dispose();
});

test('Keyboard diagnostics never expose text or key codes from editable fields',()=>{
  const events=new Events(),reports=[];
  const input=createKeyboardInput({eventTarget:events,onChange(){},onStop(){},onHome(){},onInput:r=>reports.push(r)});
  for(const type of ['keydown','keyup'])events.emit(type,{code:'KeyD',key:'private text',target:{closest:()=>({})}});
  assert.deepEqual(reports,[{phase:'down',result:'text-entry',keys:[]},{phase:'up',result:'text-entry',keys:[]}]);
  input.dispose();
});
