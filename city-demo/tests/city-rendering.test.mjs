import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createVoxelBatches} from '../src/city/voxelBatches.js';
import {cityPixelRatio} from '../src/city/renderBudget.js';
import {compactCharacter,disposeScene} from '../src/rendering.js';

test('Voxel batching preserves transforms and linear colours, while distant cells can be culled',()=>{
  const geometry=new T.BoxGeometry(),batch=createVoxelBatches(geometry);
  const red=new T.MeshStandardMaterial({color:'#cc6633'}),blue=new T.MeshStandardMaterial({color:'#2266aa'});
  red.userData.voxelTint=blue.userData.voxelTint=true;
  const transforms=[new T.Matrix4().makeTranslation(2,1,2),new T.Matrix4().makeTranslation(3,1,2),new T.Matrix4().makeTranslation(80,1,2)];
  transforms.forEach((matrix,i)=>batch.add(matrix,i===1?blue:red));
  const {meshes,count}=batch.finish();assert.equal(count,3);assert.equal(meshes.length,2);
  const near=meshes.find(m=>m.count===2),far=meshes.find(m=>m.count===1),color=new T.Color(),matrix=new T.Matrix4();
  near.getColorAt(1,color);for(const channel of ['r','g','b'])assert.ok(Math.abs(color[channel]-blue.color[channel])<1e-6);
  near.getMatrixAt(1,matrix);assert.deepEqual(matrix.elements,transforms[1].elements);
  const camera=new T.OrthographicCamera(-8,8,8,-8,.1,30);camera.position.set(0,5,12);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  assert.equal(frustum.intersectsObject(near),true);assert.equal(frustum.intersectsObject(far),false);
  disposeScene(new T.Group().add(...meshes),[red,blue]);
});

test('Textured and emissive voxel materials are retained without colour-batch substitution',()=>{
  const geometry=new T.BoxGeometry(),texture=new T.Texture();
  const textured=new T.MeshStandardMaterial({map:texture}),glow=new T.MeshStandardMaterial({emissive:'#ffaa33',emissiveIntensity:2});
  const batch=createVoxelBatches(geometry);batch.add(new T.Matrix4(),textured);batch.add(new T.Matrix4(),glow);
  const {meshes}=batch.finish();assert.equal(meshes.length,2);assert.deepEqual(meshes.map(m=>m.material),[textured,glow]);
  assert.ok(meshes.every(m=>m.instanceColor===null));disposeScene(new T.Group().add(...meshes),[],[texture]);
});

test('Actual GLB avatar keeps geometry, bounds and moving limb pivots with five draw batches',async()=>{
  const bytes=readFileSync(new URL('../public/models/employee_base.glb',import.meta.url));
  const {scene:source}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const before=new T.Box3().setFromObject(source),copy=source.clone(true),vertices=root=>{let count=0;root.traverse(o=>{if(o.isMesh)count+=o.geometry.index?.count??o.geometry.attributes.position.count;});return count;};
  const vertexCount=vertices(source);compactCharacter(copy);const after=new T.Box3().setFromObject(copy),meshes=[],limbs=[];
  copy.traverse(o=>{if(o.isMesh)meshes.push(o);if(/^(arm_|leg_)[LR]/.test(o.name))limbs.push(o);});
  assert.equal(meshes.length,5);assert.equal(limbs.length,4);assert.equal(vertices(copy),vertexCount);
  assert.ok(before.min.distanceTo(after.min)<1e-5);assert.ok(before.max.distanceTo(after.max)<1e-5);
  assert.ok(meshes.every(m=>!m.castShadow&&m.geometry.attributes.color));
  const limb=limbs[0],initial=new T.Box3().setFromObject(limb);limb.rotation.x+=.6;
  assert.ok(new T.Box3().setFromObject(limb).min.distanceTo(initial.min)>1e-5);
  let namedShirt=false;source.traverse(o=>{if(o.isMesh&&o.material.name==='shirt')namedShirt=true;});assert.ok(namedShirt);
  disposeScene(copy);disposeScene(source);
});

test('Physical render budget bounds work on mobile, Retina and 4K without oversampling the display',()=>{
  for(const [w,h,dpr] of [[390,844,3],[1280,720,1],[1920,1080,2],[3840,2160,2]]){
    const ratio=cityPixelRatio(w,h,dpr);assert.ok(ratio>0&&ratio<=dpr&&ratio<=1.25);assert.ok(w*h*ratio*ratio<=1800000.01);
  }
  assert.equal(cityPixelRatio(1280,720,1),1);
});
