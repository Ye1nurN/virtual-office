import {createSceneKit} from './sceneKit.js';
import {createRoomEnvelope} from '../world/firstPerson.js';
import {createEntranceOutlook} from './entranceOutlook.js';

import {AUTOFIX_OBSTACLES,AUTOFIX_TERMINAL} from './autofixLayout.js';

function car(k,x,z,color,scale=1){
  const box=(dx,y,dz,w,h,d,c)=>k.box(x+dx*scale,y*scale,z+dz*scale,w*scale,h*scale,d*scale,c);
  box(0,.42,0,1.8,.42,3.9,'#253638');box(0,.76,0,1.96,.65,3.7,color);
  box(0,1.28,-.15,1.62,.56,1.9,'#34565c');box(0,1.61,-.2,1.68,.12,1.65,color);
  box(0,1.16,1,1.68,.12,.16,'#cee5da');box(0,.86,1.91,1.23,.12,.05,'#263937');
  for(const side of [-1,1]){
    for(const dz of [-1.15,1.15]){box(side*.99,.4,dz,.26,.7,.7,'#263132');box(side*1.14,.4,dz,.035,.36,.36,'#bfc9c3');}
    box(side*.69,.91,1.88,.44,.18,.09,k.glow('#fff0cb',.6));box(side*.7,.9,-1.88,.38,.14,.06,'#bb654a');
    box(side*.96,1.2,.62,.26,.16,.25,color);
  }
}

export function buildAutofix(templates){
  const k=createSceneKit(templates),interactions=[{id:'exit',type:'exit',title:'Выйти в город',x:0,z:5.6,radius:1.6},AUTOFIX_TERMINAL];
  k.box(0,-.12,0,18,.24,14,'#d2cdb6');
  for(let x=-8.5;x<9;x++)for(let z=-6.5;z<7;z++)k.box(x,.008,z,.98,.02,.98,(Math.round(x+z)%2)?'#d9d7c7':'#cecebe');
  for(const x of [-8.9,8.9])k.box(x,1.8,0,.22,3.6,14,'#668373');
  k.box(0,1.8,-6.9,18,3.6,.22,'#46665c');
  k.sign('AUTOFIX HUB',0,2.85,-6.74,8.6,.85,{bg:'#2b5045',fg:'#f6dda3',sub:'Детейлинг · запись · аналитика'});
  for(const [i,x] of [-4.3,4.3].entries()){
    k.box(x,.045,-1.5,3.6,.055,5.6,'#8d9d8c');
    for(const dx of [-1.7,1.7])k.box(x+dx,.078,-1.5,.07,.025,5.6,'#ebcb7c');
    for(const dz of [-4.25,1.25])k.box(x,.078,dz,3.4,.025,.07,'#ebcb7c');
    car(k,x,-1.6,i?'#cdad73':'#79a8a0');
    k.sign('БОКС 0'+(i+1),x,2.92,-6.72,3,.48,{bg:'#46665c',fg:'#f8eccd',size:90});
    k.box(x,1.05,-5.45,3,.9,.6,'#bdab85');
    for(let j=0;j<5;j++)k.box(x-1.1+j*.52,1.7,-5.45,.23,.39,.23,['#cfab58','#ebe6cc','#688d81'][j%3]);
    for(const dx of [-1.75,1.75])k.box(x+dx,1.9,-4.6,.08,3.5,.12,k.glow('#f2ecd3',.4));
  }
  k.box(0,.6,-4.9,3.3,1.2,1,'#b6a787');k.box(0,1.24,-4.9,3.45,.12,1.1,'#e7dcc0');
  k.model('monitor',0,-4.9,1.35,0,1.3);k.model('employee_base',1.8,-5.9,2.1);
  for(const x of [-7.6,7.6]){k.model('plant_floor',x,4.7,1.5);k.box(x,.28,4.7,1,.56,1,'#a88e67');}
  for(const side of [-1,1])k.box(side*5.25,.55,6.9,7.25,1.1,.2,'#91a894');
  k.sign('В ГОРОД →',-5.2,.63,7.03,3,.5,{bg:'#eee4c9',fg:'#395b4b'});
  const built=k.finish(),envelope=createRoomEnvelope({width:17.8,depth:13.8,height:3.6,front:{width:17.55,z:6.9,baseHeight:1.1,doorWidth:3.2,doorHeight:2.4,wallColor:'#668373',frameColor:'#35594b'}});
  const street=createEntranceOutlook({frontZ:6.9});built.root.add(envelope.root,street);
  return {...built,obstacles:AUTOFIX_OBSTACLES,interactions,markers:[{id:AUTOFIX_TERMINAL.id,name:'Запись и аналитика',x:0,y:2.6,z:-4.9}],setFirstPerson:value=>{envelope.root.visible=street.visible=value;}};
}
