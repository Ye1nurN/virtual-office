import * as T from 'three';
import {mergeCharacter} from '../rendering.js';
import {GUIDE_POSITION} from './knowledge.js';

export function createGuideActor(templates){
  const root=new T.Group(),figure=templates.get('employee_base').clone(true);
  mergeCharacter(figure,new T.MeshStandardMaterial({vertexColors:true,roughness:.9}));
  figure.scale.setScalar(2.4);root.add(figure);root.position.set(GUIDE_POSITION.x,.08,GUIDE_POSITION.z);
  const cube=new T.BoxGeometry(1,1,1),coat=new T.MeshStandardMaterial({color:'#347d70',roughness:.9}),gold=new T.MeshStandardMaterial({color:'#f0d080',roughness:.8});
  const bag=new T.Mesh(cube,coat);bag.scale.set(.66,.73,.24);bag.position.set(0,1.34,-.4);bag.castShadow=true;root.add(bag);
  const badge=new T.Mesh(cube,gold);badge.scale.set(.2,.24,.07);badge.position.set(.33,1.53,.34);root.add(badge);
  const ring=new T.Mesh(new T.RingGeometry(.67,.74,32),new T.MeshBasicMaterial({color:'#edc879',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.015;root.add(ring);
  return {root,interaction:{id:'city-guide',type:'guide',title:'Поговорить с гидом',...GUIDE_POSITION,radius:2.1},marker:{id:'city-guide',kind:'guide',name:'Гид · поговорим?',...GUIDE_POSITION,y:3.6}};
}
