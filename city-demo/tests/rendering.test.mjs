import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {mergeCharacter,disposeScene} from '../src/rendering.js';

test('merged body preserves colour, world bounds and independent leg pivots',()=>{
  const root=new T.Group();root.position.set(4,0,-7);root.rotation.y=.4;
  const geometry=new T.BoxGeometry(1,1,1),red=new T.MeshStandardMaterial({color:'#994422'}),blue=new T.MeshStandardMaterial({color:'#225599'}),batchMaterial=new T.MeshStandardMaterial({vertexColors:true});
  const a=new T.Mesh(geometry,red),b=new T.Mesh(geometry,blue);b.position.y=1;root.add(a,b);
  const leg=new T.Group();leg.position.set(.2,-1,0);leg.add(new T.Mesh(geometry,blue));root.add(leg);
  const before=new T.Box3().setFromObject(root);const merged=mergeCharacter(root,batchMaterial,false);mergeCharacter(leg,batchMaterial);
  const after=new T.Box3().setFromObject(root);assert.ok(before.min.distanceTo(after.min)<1e-6);assert.ok(before.max.distanceTo(after.max)<1e-6);
  assert.equal(root.children.filter(c=>c.isMesh).length,1);assert.equal(merged.geometry.attributes.position.count,48);
  const colors=merged.geometry.attributes.color;assert.ok(Math.abs(colors.getX(0)-red.color.r)<1e-6);assert.ok(Math.abs(colors.getZ(24)-blue.color.b)<1e-6);
  leg.rotation.x=.8;assert.ok(new T.Box3().setFromObject(root).min.distanceTo(after.min)>0);
});
test('cleanup disposes shared resources, detached materials and textures exactly once',()=>{
  const scene=new T.Scene(),geo=new T.BoxGeometry(),mat=new T.MeshStandardMaterial(),extra=new T.MeshBasicMaterial(),texture=new T.Texture();scene.add(new T.Mesh(geo,mat),new T.Mesh(geo,mat));
  const counts=[0,0,0,0];[geo,mat,extra,texture].forEach((resource,i)=>resource.addEventListener('dispose',()=>counts[i]++));
  disposeScene(scene,[mat,extra],[texture]);assert.deepEqual(counts,[1,1,1,1]);
});
