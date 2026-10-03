import test from 'node:test';
import assert from 'node:assert/strict';
import {BoxGeometry,Group,Mesh,MeshStandardMaterial,Vector3} from 'three';
import {createExhibitMotion,EXHIBIT_REST_ANGLE} from '../src/collection/exhibitMotion.js';
import {createExhibitEffects} from '../src/collection/exhibitEffects.js';

function settle(motion){
  for(let i=0;i<360;i++)if(!motion.step(1/60))return i;
  assert.fail('Exhibit keeps requesting frames after six seconds');
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('Hover turns first, plays once, returns home without drift and stops rendering',()=>{
  const motion=createExhibitMotion(['pharmacy']);
  assert.equal(motion.step(1/60),false);
  for(let n=0;n<12;n++){
    motion.interest('pharmacy','pointer',true);
    for(let i=0;i<10;i++)motion.step(1/60);
    assert.ok(motion.states.get('pharmacy').angle<EXHIBIT_REST_ANGLE);
    assert.equal(motion.states.get('pharmacy').scene,0);
    settle(motion);
    assert.equal(motion.states.get('pharmacy').angle,0);
    assert.equal(motion.states.get('pharmacy').scene,1);
    motion.interest('pharmacy','pointer',false);settle(motion);
    assert.equal(motion.states.get('pharmacy').angle,EXHIBIT_REST_ANGLE);
    assert.equal(motion.states.get('pharmacy').scene,0);
  }
});

test('Stale pointer leave cannot cancel a new target; keyboard focus survives mouse exit',()=>{
  const motion=createExhibitMotion(['a','b']);
  motion.interest('a','focus',true);
  motion.interest('a','pointer',true);motion.interest('b','pointer',true);
  motion.interest('a','pointer',false);settle(motion);
  assert.equal(motion.states.get('b').scene,1);
  motion.interest('b','pointer',false);settle(motion);
  assert.equal(motion.states.get('a').scene,1);
  assert.equal(motion.states.get('b').scene,0);
  motion.clearInterest();settle(motion);
  assert.equal(motion.states.get('a').scene,0);
});

test('Selected project stays open while another preview plays; manual rotation remains controllable',()=>{
  const motion=createExhibitMotion(['a','b']);
  motion.select('a');settle(motion);
  motion.turn('a',.4,true);
  motion.interest('b','pointer',true);settle(motion);
  close(motion.states.get('a').angle,.4);
  assert.equal(motion.states.get('a').scene,1);
  assert.equal(motion.states.get('b').scene,1);
  motion.select('b');settle(motion);
  close(motion.states.get('a').angle,EXHIBIT_REST_ANGLE);
  assert.equal(motion.states.get('a').scene,0);
  assert.equal(motion.states.get('b').scene,1);
});

test('Reduced motion uses a static end pose immediately and never starts an animation loop',()=>{
  const motion=createExhibitMotion(['a','b']);
  motion.interest('a','pointer',true);
  assert.equal(motion.step(1/60,true),false);
  assert.equal(motion.states.get('a').angle,0);
  assert.equal(motion.states.get('a').scene,1);
  motion.select('b');assert.equal(motion.step(0,true),false);
  assert.equal(motion.states.get('a').scene,0);
  assert.equal(motion.states.get('b').scene,1);
});

function part(parent,{y=0,emission=.7}={}){
  const root=new Group();parent.add(root);
  const mesh=new Mesh(new BoxGeometry(1,1,1),new MeshStandardMaterial({emissive:'#ffd699',emissiveIntensity:emission}));
  mesh.position.y=y;root.add(mesh);return root;
}
function cleanup(root){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}

test('Pharmacy display lights turn on in order and return to the same unlit tint',()=>{
  const parent=new Group(),cross=part(parent),left=part(parent),right=part(parent);
  const fx=createExhibitEffects({id:'pharmacy'},new Map([['pharmacy-cross',cross],['display-left',left],['display-right',right]]));
  const tint=cross.children[0].material.color.clone(),initial=right.children[0].material.emissiveIntensity;
  try{
    for(let n=0;n<5;n++){
      fx.update(.4);
      assert.ok(left.children[0].material.emissiveIntensity>initial);
      close(right.children[0].material.emissiveIntensity,initial);
      fx.update(1);assert.ok(right.children[0].material.emissiveIntensity>initial);
      fx.update(0);assert.ok(cross.children[0].material.color.equals(tint));
      close(left.children[0].material.emissiveIntensity,initial);
    }
  }finally{cleanup(parent);}
});

test('Garage roller keeps its top attached and all lighting resets after repeated previews',()=>{
  const parent=new Group(),gate=part(parent),light=part(parent);
  const fx=createExhibitEffects({id:'autofix'},new Map([['garage-gate',gate],['garage-light',light]]));
  try{
    for(let n=0;n<5;n++){
      for(const t of [0,.2,.65,1,.65,.2,0]){
        fx.update(t);parent.updateMatrixWorld(true);
        close(gate.localToWorld(new Vector3(0,3.45,0)).y,3.45);
        assert.ok(gate.scale.y>0&&gate.scale.y<=1);
      }
      close(gate.position.y,0);close(gate.scale.y,1);
      close(light.children[0].material.emissiveIntensity,.7);
    }
  }finally{cleanup(parent);}
});

test('Hall doors rotate about fixed jambs and close exactly without accumulating offsets',()=>{
  const parent=new Group(),left=part(parent),right=part(parent),front=4;
  const fx=createExhibitEffects({id:'tynysh',d:8},new Map([['hall-door-left',left],['hall-door-right',right]]));
  try{
    for(let n=0;n<5;n++)for(const t of [0,.4,1,.4,0]){
      fx.update(t);parent.updateMatrixWorld(true);
      for(const [root,x] of [[left,-1.16],[right,1.16]]){
        const jamb=root.localToWorld(new Vector3(x,1,front+.15));
        close(jamb.x,x);close(jamb.z,front+.15);
      }
      if(t===0){close(left.parent.rotation.y,0);close(right.parent.rotation.y,0);}
    }
  }finally{cleanup(parent);}
});

test('ARGUS sweep ends, employee appears at the window, and replacement GLBs tolerate missing parts',()=>{
  const parent=new Group(),scan=part(parent),person=part(parent);
  const scanFx=createExhibitEffects({id:'argus',heightScale:1.35},new Map([['argus-scan',scan]]));
  const officeFx=createExhibitEffects({id:'office'},new Map([['office-employee',person]]));
  try{
    assert.equal(scan.visible,false);assert.equal(person.visible,false);
    scanFx.update(.5);assert.equal(scan.visible,true);
    scanFx.update(1);assert.equal(scan.visible,false);
    officeFx.update(1);assert.equal(person.visible,true);close(person.position.x,0);
    officeFx.update(0);assert.equal(person.visible,false);
    for(const id of ['pharmacy','autofix','argus','office','tynysh']){
      const fx=createExhibitEffects({id,d:8},new Map());
      assert.doesNotThrow(()=>{fx.update(.5);fx.update(1);fx.update(0);});
    }
  }finally{cleanup(parent);}
});
