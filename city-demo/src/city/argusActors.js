import * as T from 'three';
import {mergeCharacter} from '../rendering.js';
import {ARGUS_BOTS} from './argusLayout.js';

export function createArgusActors(templates){
  const root=new T.Group(),actors=new Map(),skin=new T.MeshStandardMaterial({vertexColors:true,roughness:.9});
  for(const def of ARGUS_BOTS){
    const group=new T.Group(),figure=templates.get('employee_base').clone(true),limbs=[];
    const shirt=new T.MeshStandardMaterial({color:def.color,roughness:.9});
    figure.traverse(o=>{if(o.isMesh&&o.material.name==='shirt')o.material=shirt;if(/^(arm_|leg_)[LR]/.test(o.name))limbs.push({node:o,parent:o.parent,base:o.rotation.x,arm:o.name.startsWith('arm'),side:o.name.includes('_L')?1:-1});});
    for(const limb of limbs)limb.node.removeFromParent();mergeCharacter(figure,skin);
    for(const limb of limbs){mergeCharacter(limb.node,skin);limb.parent.add(limb.node);}shirt.dispose();figure.scale.setScalar(2);figure.traverse(o=>{if(o.isMesh)o.castShadow=false;});group.add(figure);
    const tablet=new T.Mesh(new T.BoxGeometry(.4,.06,.3),new T.MeshStandardMaterial({color:'#193e50',emissive:'#2b8090',emissiveIntensity:.4}));tablet.position.set(0,1.2,.48);tablet.visible=false;group.add(tablet);
    const halo=new T.Mesh(new T.RingGeometry(.5,.56,24),new T.MeshBasicMaterial({color:def.color,side:T.DoubleSide,transparent:true,opacity:.9}));halo.rotation.x=-Math.PI/2;halo.position.y=.025;group.add(halo);
    const shadow=new T.Mesh(new T.CircleGeometry(.43,20),new T.MeshBasicMaterial({color:'#153c44',transparent:true,opacity:.2,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;group.add(shadow);
    root.add(group);actors.set(def.id,{group,limbs,tablet,halo});
  }
  function update(result,state){for(const pose of result.actors){const a=actors.get(pose.id);a.group.position.set(pose.x,.08,pose.z);a.group.rotation.y=pose.yaw;a.tablet.visible=pose.tablet;a.halo.visible=pose.id===result.view.actor&&state?.phase!=='setup'&&state?.phase!=='complete';for(const limb of a.limbs)limb.node.rotation.x=limb.base+(limb.arm&&pose.tablet?-.65:pose.moving?Math.sin(result.clock*10+limb.side*Math.PI/2)*(limb.arm?-.28:.44):0);}}
  return {root,update};
}
