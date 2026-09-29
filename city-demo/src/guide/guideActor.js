import * as T from 'three';
import {mergeCharacter} from '../rendering.js';
import {GUIDE_POSITION} from './knowledge.js';

export function createGuideActor(templates){
  const root=new T.Group(),figure=templates.get('employee_base').clone(true),limbs=[];
  figure.traverse(node=>{if(/^(arm_|leg_)[LR]/.test(node.name))limbs.push({node,parent:node.parent,base:node.rotation.x,side:node.name.includes('_L')?1:-1,arm:node.name.startsWith('arm')});});
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.9});
  limbs.forEach(({node})=>node.removeFromParent());mergeCharacter(figure,material);
  for(const limb of limbs){mergeCharacter(limb.node,material);limb.parent.add(limb.node);}
  figure.scale.setScalar(2.4);root.add(figure);root.position.set(GUIDE_POSITION.x,.08,GUIDE_POSITION.z);
  const cube=new T.BoxGeometry(1,1,1),coat=new T.MeshStandardMaterial({color:'#347d70',roughness:.9}),gold=new T.MeshStandardMaterial({color:'#f0d080',roughness:.8});
  const bag=new T.Mesh(cube,coat);bag.scale.set(.66,.73,.24);bag.position.set(0,1.34,-.4);bag.castShadow=true;root.add(bag);
  const badge=new T.Mesh(cube,gold);badge.scale.set(.2,.24,.07);badge.position.set(.33,1.53,.34);root.add(badge);
  const ring=new T.Mesh(new T.RingGeometry(.67,.74,32),new T.MeshBasicMaterial({color:'#edc879',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.015;root.add(ring);
  // A contact shadow moves with the NPC without refreshing the static sun map.
  root.traverse(node=>{if(node.isMesh)node.castShadow=false;});
  const shadow=new T.Mesh(new T.CircleGeometry(.64,24),new T.MeshBasicMaterial({color:'#263c32',transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.008;root.add(shadow);
  const interaction={id:'city-guide',type:'guide',title:'Поговорить с гидом',...GUIDE_POSITION,radius:2.1};
  const marker={id:'city-guide',kind:'guide',name:'Гид · поговорим?',...GUIDE_POSITION,y:3.6};
  function update(pose,clock){
    root.position.set(pose.x,.08,pose.z);root.rotation.y=pose.yaw;
    interaction.x=marker.x=pose.x;interaction.z=marker.z=pose.z;
    marker.name=pose.phase==='walking'?'Гид · следуйте за мной':pose.phase==='arrived'?'Гид · жду у входа':'Гид · поговорим?';
    for(const limb of limbs)limb.node.rotation.x=limb.base+(pose.moving?Math.sin(clock*10+limb.side*Math.PI/2)*(limb.arm?-.28:.44):0);
  }
  return {root,interaction,marker,update};
}
