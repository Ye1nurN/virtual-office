import * as T from 'three';
import {mergeCharacter} from '../rendering.js';
import {TYNYSH_STAFF} from './tynyshLayout.js';
export function createTynyshActors(templates){
  const root=new T.Group(),actors=new Map(),skin=new T.MeshStandardMaterial({vertexColors:true,roughness:.9});
  for(const def of TYNYSH_STAFF){
    const group=new T.Group(),figure=templates.get(def.id==='aida'?'employee_blond':'employee_base').clone(true),limbs=[];
    const shirt=new T.MeshStandardMaterial({color:def.color});
    figure.traverse(o=>{if(o.isMesh&&o.material.name==='shirt')o.material=shirt;if(/^(arm_|leg_)[LR]/.test(o.name))limbs.push({node:o,parent:o.parent,base:o.rotation.x,arm:o.name.startsWith('arm'),side:o.name.includes('_L')?1:-1});});
    for(const l of limbs)l.node.removeFromParent();mergeCharacter(figure,skin);for(const l of limbs){mergeCharacter(l.node,skin);l.parent.add(l.node);}shirt.dispose();figure.scale.setScalar(2);group.add(figure);
    const plates=new T.Group(),mat=new T.MeshStandardMaterial({color:'#fff5d9'}),geo=new T.CylinderGeometry(.2,.2,.035,24);
    for(let i=0;i<5;i++){const p=new T.Mesh(geo,mat);p.position.y=i*.04;plates.add(p);}plates.position.set(0,1.1,.5);group.add(plates);
    const shadow=new T.Mesh(new T.CircleGeometry(.4,20),new T.MeshBasicMaterial({color:'#444a32',transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.04;group.add(shadow);
    group.position.set(def.x,.06,def.z);root.add(group);actors.set(def.id,{group,limbs,plates});
  }
  const dots=new T.InstancedMesh(new T.SphereGeometry(.04,6,4),new T.MeshBasicMaterial({color:'#91e6c8'}),80);dots.count=0;root.add(dots);const matrix=new T.Matrix4();
  return {root,update(result,state){
    for(const a of result.actors){const v=actors.get(a.id);v.group.position.set(a.x,.06,a.z);v.group.rotation.y=a.yaw;v.plates.visible=a.carrying;for(const l of v.limbs)l.node.rotation.x=l.base+(l.arm&&a.carrying?-.75:a.moving?Math.sin(result.clock*10+l.side*Math.PI/2)*(l.arm?-.28:.42):0);}
    const a=result.actors.find(a=>a.table===state.selected)||result.actors.find(a=>a.table);let count=0;
    if(a&&!state.automation.paused){let from=a;for(const p of a.path){const len=Math.hypot(p.x-from.x,p.z-from.z);for(let d=.12;d<len&&count<80;d+=.2){matrix.makeTranslation(from.x+(p.x-from.x)*d/len,.065,from.z+(p.z-from.z)*d/len);dots.setMatrixAt(count++,matrix);}from=p;}}
    dots.count=count;dots.instanceMatrix.needsUpdate=true;dots.computeBoundingSphere();
  }};
}
