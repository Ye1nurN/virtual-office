import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Matrix4,Quaternion,Euler,Vector3} from 'three';
import {createVegetation} from '../src/city/vegetation.js';

const green=new Set(['#245529','#367229','#518d29','#73a32c','#92b532','#b0c440']);
function record(kind,args,detail){
  const boxes=[];createVegetation((...box)=>boxes.push(box),{detail})[kind](...args);return boxes;
}
function envelope(boxes){
  const bounds=new Box3(),matrix=new Matrix4(),position=new Vector3(),rotation=new Quaternion(),scale=new Vector3();
  for(const [x,y,z,w,h,d,,yaw=0,rx=0,rz=0,fit] of boxes){
    matrix.compose(position.set(x,y,z),rotation.setFromEuler(new Euler(rx,yaw,rz)),scale.set(w,h,d));
    if(fit)matrix.premultiply(fit);
    for(const dx of [-.5,.5])for(const dy of [-.5,.5])for(const dz of [-.5,.5])bounds.expandByPoint(new Vector3(dx,dy,dz).applyMatrix4(matrix));
  }
  return bounds;
}

test('Balanced geometry meets the approved budgets while keeping wood, flowers and planters intact',()=>{
  for(const [kind,args,originalTriangles,balancedTriangles] of [
    ['tree',[0,0,1,100,{planter:true}],8364,2364],
    ['bush',[0,0,1,17,0],384,144],
    ['flowerbed',[0,0,3,1,12,0],5928,3048],
  ]){
    const original=record(kind,args,'original'),balanced=record(kind,args,'balanced');
    assert.equal(original.length*12,originalTriangles,kind+' baseline');
    assert.equal(balanced.length*12,balancedTriangles,kind+' selected budget');
    assert.deepEqual(balanced.filter(b=>!green.has(b[6])),original.filter(b=>!green.has(b[6])),kind+' non-foliage unchanged');
    assert.deepEqual(record(kind,args,undefined),balanced,kind+' balanced is default');
  }
});

test('Different seeds, raised planters and narrow beds retain the original world envelope',()=>{
  for(const seed of [0,100,-8.7,17.3])for(const [kind,args] of [
    ['tree',[12,-15,.61,seed,{planter:false,base:.66}]],
    ['tree',[-25,11,1.55,seed,{planter:true}]],
    ['bush',[39,-38,.3,seed,1.4]],
    ['flowerbed',[-3,9,.65,4.8,seed,.4]],
  ]){
    const original=envelope(record(kind,args,'original')),balanced=envelope(record(kind,args,'balanced'));
    assert.ok(original.min.distanceTo(balanced.min)<1e-9,kind+' minimum envelope');
    assert.ok(original.max.distanceTo(balanced.max)<1e-9,kind+' maximum envelope');
  }
});

test('Seeded foliage is deterministic, varied and finite, including the tiny lawn tufts',()=>{
  const first=record('tree',[0,0,1,7],'balanced');
  assert.deepEqual(record('tree',[0,0,1,7],'balanced'),first);
  assert.notDeepEqual(record('tree',[0,0,1,8],'balanced'),first);
  for(const box of record('bush',[30,12,.25,1,.12],'balanced')){
    assert.ok(box.slice(0,6).every(Number.isFinite));
    assert.ok(box.slice(3,6).every(n=>n>0));
    assert.ok(box[10].elements.every(Number.isFinite));
    assert.ok(box[10].determinant()>0);
  }
});
