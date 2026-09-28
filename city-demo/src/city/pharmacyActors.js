import * as T from 'three';
import {mergeCharacter} from '../rendering.js';
import {PHARMACY_BOTS} from './pharmacyDirector.js';

export function createPharmacyActors(templates){
  const root=new T.Group(),actors=new Map(),unit=new T.BoxGeometry(1,1,1);
  const skin=new T.MeshStandardMaterial({vertexColors:true,roughness:.9});
  const cardboard=new T.MeshStandardMaterial({color:'#cfa365',roughness:.9}),tape=new T.MeshStandardMaterial({color:'#f1dba7'}),green=new T.MeshStandardMaterial({color:'#237c64'}),screen=new T.MeshBasicMaterial({color:'#99eed8',toneMapped:false}),dark=new T.MeshStandardMaterial({color:'#263d43'});
  const box=(group,mat,x,y,z,w,h,d)=>{const mesh=new T.Mesh(unit,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);group.add(mesh);return mesh;};
  function parcel(){const group=new T.Group();box(group,cardboard,0,0,0,.61,.43,.42);box(group,tape,0,.22,0,.12,.016,.43);box(group,green,0,0,.217,.19,.055,.02);box(group,green,0,0,.218,.055,.19,.02);return group;}
  const stock=parcel();stock.position.set(6.2,1.99,-1.6);root.add(stock);
  for(const def of PHARMACY_BOTS){
    const group=new T.Group(),figure=templates.get('employee_base').clone(true),limbs=[];
    const shirt=new T.MeshStandardMaterial({color:def.id==='staff'?'#e9f8e9':def.color,roughness:.9});
    figure.traverse(o=>{if(o.isMesh&&o.material.name==='shirt')o.material=shirt;if(/^(arm_|leg_)[LR]/.test(o.name))limbs.push({node:o,parent:o.parent,base:o.rotation.x,arm:o.name.startsWith('arm'),side:o.name.includes('_L')?1:-1});});
    // Five batches per person retain limb pivots without multiplying GLB draw calls.
    for(const limb of limbs)limb.node.removeFromParent();
    mergeCharacter(figure,skin);for(const limb of limbs){mergeCharacter(limb.node,skin);limb.parent.add(limb.node);}shirt.dispose();
    figure.scale.setScalar(2);figure.traverse(o=>{if(o.isMesh)o.castShadow=false;});group.add(figure);
    const carried=parcel();carried.position.set(0,1.05,.52);carried.visible=false;group.add(carried);
    const tablet=new T.Group();box(tablet,dark,0,0,0,.38,.07,.29);box(tablet,screen,0,.04,0,.32,.01,.22);tablet.position.set(0,1.28,.47);tablet.rotation.x=-.3;tablet.visible=false;group.add(tablet);
    const camera=new T.Group();box(camera,dark,0,0,0,.36,.25,.15);box(camera,screen,0,0,.1,.12,.12,.08);camera.position.set(0,1.53,.5);camera.visible=false;group.add(camera);
    const shadow=new T.Mesh(new T.CircleGeometry(.43,24),new T.MeshBasicMaterial({color:'#263c32',transparent:true,opacity:.16,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;shadow.scale.y=.8;group.add(shadow);
    const halo=new T.Mesh(new T.RingGeometry(.52,.57,32),new T.MeshBasicMaterial({color:def.color,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.023;group.add(halo);
    group.position.set(def.x,.08,def.z);root.add(group);actors.set(def.id,{group,limbs,carried,tablet,camera,halo});
  }
  function update(result,state){
    for(const pose of result.actors){
      const actor=actors.get(pose.id);actor.group.position.set(pose.x,.08,pose.z);actor.group.rotation.y=pose.yaw;
      actor.carried.visible=pose.carrying&&!state?.installed;actor.camera.visible=pose.camera;actor.tablet.visible=pose.tablet;
      const working=pose.working,clock=result.clock||0;
      for(const limb of actor.limbs)limb.node.rotation.x=limb.base+(limb.arm&&(pose.carrying||pose.camera||pose.tablet)?-.72:pose.moving?Math.sin(clock*10+limb.side*Math.PI/2)*(limb.arm?-.28:.44):limb.arm&&working?-.25-Math.sin(clock*5)*.10:0);
      actor.halo.visible=pose.id===result.view.actor&&!!state?.request;
    }
    stock.visible=!state?.installed&&!result.actors.find(a=>a.id==='staff').carrying;
  }
  return {root,update};
}
