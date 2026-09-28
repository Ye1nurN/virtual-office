import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {disposeScene} from '../rendering.js';
import manifest from '../../public/models/manifest.json';
import {objectCollider} from './colliders.js';
import {styleOfficeMaterial} from './materials.js';

export const assetRegistry=new Map(manifest.assets.map(a=>[a.id,{...a,url:'/models/'+a.file}]));
// Keep authored pivots on characters and doors; compact only immutable furniture.
function compactFurniture(template){
  let animated=false;template.traverse(o=>{if(/^(hinge_|arm_|leg_)/.test(o.name))animated=true;});
  if(animated)return;
  template.updateMatrixWorld(true);
  const groups=new Map(),oldGeometry=new Set(),meshes=[];
  template.traverse(m=>{
    if(!m.isMesh||Array.isArray(m.material)||m.isSkinnedMesh||m.morphTargetInfluences)return;
    const key=m.material.uuid+'/'+Object.keys(m.geometry.attributes).sort().join(',');
    if(!groups.has(key))groups.set(key,{material:m.material,castShadow:m.castShadow,parts:[]});
    const part=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();part.applyMatrix4(m.matrixWorld);
    groups.get(key).parts.push(part);oldGeometry.add(m.geometry);meshes.push(m);
  });
  meshes.forEach(m=>m.removeFromParent());
  for(const g of groups.values()){
    const geometry=mergeGeometries(g.parts);g.parts.forEach(p=>p.dispose());
    if(!geometry)throw new Error('Incompatible geometry in static model');
    const mesh=new T.Mesh(geometry,g.material);mesh.castShadow=g.castShadow;mesh.receiveShadow=true;template.add(mesh);
  }
  oldGeometry.forEach(g=>g.dispose());
}
// One cache belongs to one running office. Models retain shared immutable geometry/materials.
export function createAssetLibrary(){
  const cache=new Map(),missing=new Set(),loader=new GLTFLoader();let disposed=false,loaded=0,requests=0;
  async function load(id){
    if(cache.has(id))return cache.get(id);
    requests++;
    const promise=(async()=>{
      let template;
      try{
        const def=assetRegistry.get(id);if(!def)throw new Error('Unknown asset '+id);
        template=(await loader.loadAsync(def.url)).scene;
        // Transmission incurs a second scene pass. Reuse an economical tinted glass material.
        const glassMaterials=new Map(),styled=new Set();
        template.traverse(o=>{
          if(!o.isMesh)return;
          o.castShadow=true;o.receiveShadow=true;
          for(const material of Array.isArray(o.material)?o.material:[o.material]){
            if(!styled.has(material)){styleOfficeMaterial(material);styled.add(material);}
          }
          if(o.material.transmission>0){
            const old=o.material;
            if(!glassMaterials.has(old)){glassMaterials.set(old,new T.MeshStandardMaterial({color:'#a8cbd0',transparent:true,opacity:.16,roughness:.2,metalness:.05,depthWrite:false,side:T.DoubleSide}));old.dispose();}
            o.material=glassMaterials.get(old);o.castShadow=false;
          }
        });
        if(!id.startsWith('employee'))compactFurniture(template);
      }catch(error){
        missing.add(id);
        const [w,d,h]=assetRegistry.get(id)?.dimensions||[1,1,1];
        template=new T.Group();const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:'#bb9179',roughness:1}));mesh.position.y=h/2;template.add(mesh);template.userData.placeholder=id;
      }
      template.updateMatrixWorld(true);
      template.userData.bounds=new T.Box3().setFromObject(template);
      loaded++;
      if(disposed){disposeScene(template);return null;}
      return template;
    })();
    cache.set(id,promise);return promise;
  }
  async function prepare(ids,onProgress){const unique=[...new Set(ids)];let complete=0;await Promise.all(unique.map(async id=>{await load(id);onProgress?.(++complete,unique.length);}));}
  async function getTemplates(ids){const out=new Map();await Promise.all([...new Set(ids)].map(async id=>out.set(id,await load(id))));return out;}
  function dispose(){disposed=true;Promise.all(cache.values()).then(templates=>{const group=new T.Group();templates.filter(Boolean).forEach(t=>group.add(t));disposeScene(group);cache.clear();});}
  return {prepare,getTemplates,dispose,missing,stats:()=>({loaded,requests,cached:cache.size})};
}

export function assembleFloor(config,templates,doorStates){
  const root=new T.Group(),groups=new Map(),dynamic=new Map(),pickables=[],obstacles=[];
  const meshKey=(mesh)=>mesh.geometry.uuid+'/'+(Array.isArray(mesh.material)?mesh.material.map(m=>m.uuid).join(','):mesh.material.uuid);
  for(const o of config.objects){
    const template=templates.get(o.assetId);if(!template)continue;
    const node=template.clone(true);node.position.fromArray(o.position);node.rotation.y=o.yaw;node.scale.fromArray(o.scale);node.updateMatrixWorld(true);
    const collider=objectCollider(o,assetRegistry);if(collider)obstacles.push(collider);
    if(o.dynamic){
      node.userData.objectId=o.id;root.add(node);dynamic.set(o.id,node);
      if(o.personId)node.traverse(m=>{if(m.isMesh){m.userData.personId=o.personId;pickables.push(m);}});
      // The authored right hinge has mirrored X/Z Euler rotations: both Y angles
      // are +90° to swing into the lobby, within the ground-floor perimeter.
      if(o.entrance)node.traverse(p=>{if(/^hinge_(left|right)/.test(p.name))p.rotation.y=Math.PI/2;});
      continue;
    }
    node.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const key=meshKey(mesh);if(!groups.has(key))groups.set(key,{geometry:mesh.geometry,material:mesh.material,matrices:[],shadows:mesh.castShadow});
      groups.get(key).matrices.push(mesh.matrixWorld.clone());
    });
  }
  for(const g of groups.values()){
    const batch=new T.InstancedMesh(g.geometry,g.material,g.matrices.length);
    g.matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.castShadow=g.shadows;batch.receiveShadow=true;batch.computeBoundingSphere();root.add(batch);
  }
  for(const door of config.doors){
    const node=dynamic.get(door.id);
    let hinge;node?.traverse(o=>{if(o.name.startsWith('hinge_left'))hinge=o;});
    doorStates[door.id]??=false;if(hinge)hinge.rotation.y=doorStates[door.id]?-Math.PI/2:0;
    door.hinge=hinge;
  }
  root.updateMatrixWorld(true);
  function release(){config.doors.forEach(d=>delete d.hinge);root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});root.removeFromParent();dynamic.clear();pickables.length=0;root.clear();}
  return {root,dynamic,pickables,obstacles,release,batches:groups.size};
}
