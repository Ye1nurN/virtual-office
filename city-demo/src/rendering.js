import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Bake material colours into vertices so a body needs one draw call. Keep the
// player's legs as separate batches: their pivots still animate when walking.
export function mergeCharacter(root,material,recursive=true){
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert(),meshes=[];
  if(recursive)root.traverse(o=>{if(o.isMesh&&o.material.visible)meshes.push(o);});
  else root.children.forEach(o=>{if(o.isMesh&&o.material.visible)meshes.push(o);});
  const geometries=meshes.map(mesh=>{
    const geometry=mesh.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
    const colors=new Float32Array(geometry.attributes.position.count*3),c=mesh.material.color;
    for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
    geometry.setAttribute('color',new T.BufferAttribute(colors,3));return geometry;
  });
  const merged=mergeGeometries(geometries);
  geometries.forEach(g=>g.dispose());meshes.forEach(m=>m.removeFromParent());
  const mesh=new T.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  return mesh;
}

export function disposeScene(scene,extraMaterials=[],textures=[]){
  const geometries=new Set(),materials=new Set(extraMaterials),lights=[];
  scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o.shadow)lights.push(o);if(o.isInstancedMesh)o.dispose();});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());lights.forEach(l=>l.shadow.dispose());
}
