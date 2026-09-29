import * as T from 'three';
import {createSceneKit} from '../city/sceneKit.js';
import {createRoomEnvelope} from '../world/firstPerson.js';
import {DESKS} from './layout.js';
import {createNetworkBoard} from './networkBoard.js';

export const LAB_ASSETS=['employee_base','employee_seated','employee_seated_blond','desk_oak','chair_task_green','monitor','keyboard_mouse','coffee_mug','server_rack','plant_floor','plant_desk','bookshelf','cabinet_drawers'];
export function buildObservationRoom(templates,paving){
  const k=createSceneKit(templates,{paving}),wood='#b67b43',navy='#35495a',trim='#26394c',gold='#cfad79';
  k.box(0,-.2,.25,22.4,.4,15.5,'#627479');
  k.plane(0,.012,.25,22,15.5,k.surface('paving',22,15.5,7,'#aebec7'));
  for(const x of [-10.75,10.75])k.box(x,.04,.2,.24,.06,15.3,'#b39b77');
  k.box(0,3.8,-7.45,22,7.6,.28,navy);
  k.box(0,7.6,-7.24,22,.14,.43,gold);
  // Upper windows and framing retain the sunlit cutaway from the selected concept.
  const glass=new T.MeshStandardMaterial({color:'#c6e3e6',transparent:true,opacity:.3,roughness:.28,depthWrite:false});
  k.box(0,8.9,-7.48,22,2.45,.12,glass);
  for(const x of [-13,-8,-3,3,8,13])k.tree(x,-17.6,2.2,Math.abs(x)+12);
  for(let x=-10.8;x<11;x+=2.7){k.box(x,8.8,-7.25,.12,2.65,.25,trim);k.model('plant_desk',x, -6.98,1.8,0,7.66);}
  k.box(0,10.2,-7.3,22,.17,.4,trim);
  k.box(0,7.77,-7.1,22,.12,.9,wood);
  for(const sign of [-1,1]){
    k.box(sign*11,1,.05,.26,2,15,navy);
    k.box(sign*11,4.85,-4.7,.26,5.8,4.7,navy);
    for(const z of [-5.6,-3.3]){k.box(sign*10.98,4.6,z,.12,3.1,1.9,k.glow('#c4d8d1',.18));for(const dz of [-1,0,1])k.box(sign*10.81,4.6,z+dz,.23,3.3,.08,trim);}
    k.box(sign*11,2.05,2,.4,.12,10.6,trim);
    k.box(sign*6.55,.64,7.4,8.9,1.28,.25,navy);
    k.box(sign*6.55,1.3,7.4,8.9,.12,.4,gold);
    k.model('plant_floor',sign*9.6,5.65,1.7);
    k.model('plant_floor',sign*9.6,-2.7,1.5);
    k.box(sign*3.5,.16,7.65,2.5,.32,1.2,'#80796c');
    k.box(sign*3.5,.34,7.65,2.6,.06,1.3,gold);
    k.model('plant_floor',sign*3.5,7.55,1.35,0,.38);
  }
  for(const {x,z} of DESKS){
    k.model('desk_oak',x,z,1.8);
    for(const dx of [-.58,.58])k.model('monitor',x+dx,z-.12,1.6,0,1.45);
    k.model('keyboard_mouse',x,z+.42,1.35,0,1.47);
    k.model('coffee_mug',x+1.05,z+.45,1.65,0,1.45);
    k.model('plant_desk',x-1.07,z-.16,1.3,0,1.45);
    k.model('chair_task_green',x,z+1.05,1.4,Math.PI);
    k.model(x<0?'employee_seated':'employee_seated_blond',x,z+1.03,1.43,Math.PI);
    k.model('cabinet_drawers',x+(x<0?-1.2:1.2),z+.03,1.6);
  }
  for(const x of [7.5,8.6,9.7])k.model('server_rack',x,-5.3,1.5);
  k.model('plant_floor',-9.2,-5.1,1.8);k.model('bookshelf',-9.6,-6.3,1.4);
  k.sign('ARGUS',-10,4.8,-7.26,1.4,.6,{bg:navy,fg:'#dce9eb',sub:''});
  k.sign('AMI LAB',-10,4.18,-7.26,1.4,.34,{bg:navy,fg:'#9cb9c7'});
  k.sign('ДАННЫЕ',10,5.05,-7.26,1.3,.35,{bg:navy,fg:'#cedde1'});
  k.sign('АНАЛИЗ',10,4.55,-7.26,1.3,.35,{bg:navy,fg:'#cedde1'});
  k.sign('НАДЁЖНОСТЬ',10,4.05,-7.26,1.3,.3,{bg:navy,fg:'#cedde1'});
  // Wide wall monitor and a separate tangible console, both on clear approaches.
  k.box(0,4.2,-7.12,18.35,6.6,.35,trim);
  const board=createNetworkBoard();board.root.position.set(0,4.2,-6.91);k.root.add(board.root);
  for(const x of [-3,3])k.box(x,4.2,-6.86,.045,6.55,.035,'#315061');
  k.box(0,.13,-.25,4.2,.24,1.9,'#b6b2a3');
  for(const x of [-1.35,1.35])k.box(x,.72,-.2,.25,1.3,.8,trim);
  k.box(0,1.44,-.25,3.8,.22,1.35,wood);
  const consoleScreen=new T.Mesh(new T.PlaneGeometry(3.5,1.23),new T.MeshBasicMaterial({map:board.texture,toneMapped:false}));
  consoleScreen.position.set(0,2.2,-.3);consoleScreen.rotation.x=-.43;k.root.add(consoleScreen);
  k.box(0,2.17,-.4,3.7,1.4,.1,trim,0,-.43);
  k.sign('В ГОРОД',-6.5,.65,7.56,2.5,.46,{bg:navy,fg:'#e5e9df'});
  const envelope=createRoomEnvelope({width:21.8,depth:15,height:9,front:{width:21.6,z:7.4,baseHeight:1.28,doorWidth:4.2,doorHeight:2.6,wallColor:navy,frameColor:trim}});
  k.root.add(envelope.root);
  // Hide the cutaway's open high side sections only in first-person view.
  for(const side of [-1,1])envelope.box(side*11,5.5,2.35,.26,7,9.6,envelope.wall);
  const built=k.finish();
  return {...built,board,consoleScreen,envelope};
}
