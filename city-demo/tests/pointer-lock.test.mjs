import test from 'node:test';
import assert from 'node:assert/strict';
import {createLookInput} from '../src/world/firstPerson.js';

class Target {
  handlers=new Map();captured=null;
  addEventListener(type,fn){if(!this.handlers.has(type))this.handlers.set(type,new Set());this.handlers.get(type).add(fn);}
  removeEventListener(type,fn){this.handlers.get(type)?.delete(fn);}
  emit(type,props={}){for(const fn of this.handlers.get(type)||[])fn({button:0,pointerId:1,pointerType:'mouse',clientX:0,clientY:0,preventDefault(){},...props});}
  focus(){} setPointerCapture(id){this.captured=id;}hasPointerCapture(id){return this.captured===id;}releasePointerCapture(){this.captured=null;}
}
function setup({promise=false}={}){
  const canvas=new Target(),doc=new Target(),events=new Target(),deltas=[];
  let enabled=true,first=true,requests=0,unlocks=0,resolve,reject;
  doc.pointerLockElement=null;canvas.ownerDocument=doc;
  canvas.requestPointerLock=()=>{requests++;if(promise)return new Promise((ok,fail)=>{resolve=ok;reject=fail;});};
  doc.exitPointerLock=()=>{doc.pointerLockElement=null;doc.emit('pointerlockchange');};
  const input=createLookInput(canvas,{eventTarget:events,canUse:()=>enabled,isFirstPerson:()=>first,onLook:(...d)=>deltas.push(d),onToggle(){first=!first;input.release();if(first)input.capture();},onUnlock(){unlocks++;}});
  return {canvas,doc,events,input,deltas,get requests(){return requests;},get unlocks(){return unlocks;},enable(v){enabled=v;},first(v){first=v;},grant(){doc.pointerLockElement=canvas;doc.emit('pointerlockchange');resolve?.();},reject(){reject?.(new Error('Denied'));doc.emit('pointerlockerror');}};
}

test('Mouse lock rotates without buttons, survives pointerup, and ignores duplicate pointermove deltas',()=>{
  const s=setup();s.input.capture();assert.equal(s.requests,1);s.grant();
  s.canvas.emit('pointerup');s.doc.emit('mousemove',{buttons:0,movementX:24,movementY:-7});
  s.canvas.emit('pointermove',{clientX:200,clientY:300});
  assert.deepEqual(s.deltas,[[24,-7]]);assert.equal(s.doc.pointerLockElement,s.canvas);
  s.events.emit('keydown',{key:'Escape'});assert.equal(s.doc.pointerLockElement,null);assert.equal(s.unlocks,1);
  s.doc.emit('mousemove',{buttons:0,movementX:50});assert.equal(s.deltas.length,1);assert.equal(s.requests,1,'Esc never automatically recaptures');
  s.canvas.emit('pointerdown');assert.equal(s.requests,2);s.grant();
  s.events.emit('keydown',{code:'KeyV'});assert.equal(s.doc.pointerLockElement,null);s.input.dispose();
});

test('Panels, text entry, blur, hidden tabs and disposal release only this scene lock',()=>{
  for(const reason of ['panel','text','blur','hidden','dispose']){
    const s=setup();s.input.capture();s.grant();
    if(reason==='panel'){s.enable(false);s.input.release();}
    if(reason==='text')s.events.emit('focusin',{target:{closest:()=>true}});
    if(reason==='blur')s.events.emit('blur');
    if(reason==='hidden'){s.doc.hidden=true;s.doc.emit('visibilitychange');}
    if(reason==='dispose')s.input.dispose();
    assert.equal(s.doc.pointerLockElement,null,reason);
    s.doc.emit('mousemove',{movementX:15});assert.equal(s.deltas.length,0);
    const other={};s.doc.pointerLockElement=other;s.input.release();assert.equal(s.doc.pointerLockElement,other);
    s.input.dispose();assert.ok([...s.canvas.handlers.values(),...s.doc.handlers.values(),...s.events.handlers.values()].every(h=>h.size===0));
  }
});

test('Denied lock leaves drag fallback usable; a later click can acquire it',async()=>{
  const s=setup({promise:true});s.canvas.emit('pointerdown');s.input.capture();assert.equal(s.requests,1);
  s.reject();await Promise.resolve();
  s.canvas.emit('pointermove',{clientX:20,clientY:5});assert.deepEqual(s.deltas,[[20,5]]);
  s.canvas.emit('pointerup');s.doc.emit('mousemove',{movementX:99});assert.equal(s.deltas.length,1);
  s.canvas.emit('pointerdown');s.grant();await Promise.resolve();s.canvas.emit('pointerup');
  s.doc.emit('mousemove',{buttons:0,movementX:10,movementY:2});assert.deepEqual(s.deltas.at(-1),[10,2]);s.input.dispose();
});

test('Pending requests cannot capture the mouse after exit, a blocked panel or scene disposal',async()=>{
  for(const reason of ['release','mode','panel','dispose']){
    const s=setup({promise:true});s.input.capture();
    if(reason==='release')s.input.release();
    if(reason==='mode')s.first(false);
    if(reason==='panel')s.enable(false);
    if(reason==='dispose')s.input.dispose();
    s.grant();await Promise.resolve();assert.equal(s.doc.pointerLockElement,null,reason);s.input.dispose();
  }
});

test('Touch and unsupported browsers keep drag controls without requesting mouse lock',()=>{
  const s=setup();s.canvas.emit('pointerdown',{pointerType:'touch'});assert.equal(s.requests,0);
  s.canvas.emit('pointermove',{clientX:12,clientY:-4});assert.deepEqual(s.deltas,[[12,-4]]);s.canvas.emit('pointerup');
  s.doc.defaultView={matchMedia:()=>({matches:false})};s.input.capture();assert.equal(s.requests,0);
  delete s.canvas.requestPointerLock;s.input.capture();s.canvas.emit('pointerdown');s.canvas.emit('pointermove',{clientX:5});assert.deepEqual(s.deltas.at(-1),[5,0]);s.input.dispose();
});
