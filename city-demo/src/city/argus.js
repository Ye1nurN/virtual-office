import * as T from 'three';
import {createSceneKit} from './sceneKit.js';
import {createRoomEnvelope} from '../world/firstPerson.js';
import {createEntranceOutlook} from './entranceOutlook.js';
import {ARGUS_DESKS,ARGUS_SERVERS,argusObstacles} from './argusLayout.js';
import {ARGUS_SCENARIOS,ARGUS_PHASES} from './argusDemo.js';

export function buildArgus(templates){
  const k=createSceneKit(templates);
  k.box(0,-.12,0,18,.24,14,'#aebec4');
  for(let x=-8.5;x<9;x++)for(let z=-6.5;z<7;z++)k.box(x,.015,z,.965,.028,.965,(x+z)%2?'#b9cbd0':'#c7d7d7');
  for(const x of [-8.9,8.9]){k.box(x,1.7,0,.25,3.4,14,'#365365');k.box(x,3.4,0,.3,.1,14,'#7eb7bf');}
  k.box(0,2.15,-6.9,18,4.3,.25,'#294656');
  for(const x of [-5.3,5.3])k.box(x,.48,6.8,7.4,.96,.2,'#627e89');
  k.sign('ARGUS  /  AMI LAB',0,4,-6.72,8,.55,{bg:'#203b4c',fg:'#b5eeeb'});
  for(const x of ARGUS_SERVERS){k.model('server_rack',x,-5,1.3);k.box(x,.055,-5,1.3,.05,1.5,'#517c87');}
  for(const [i,x] of ARGUS_DESKS.entries()){
    k.model('desk_oak',x,-2.4,1.25);k.model('monitor',x,-2.4,1.5,0,1.01);k.model('chair_task',x,-1,1.2,Math.PI);
    k.sign(['01 · ПОТОК','02 · АНАЛИЗ','03 · ПРОВЕРКА'][i],x,1.22,-1.7,2.25,.36,{bg:'#254959',fg:'#daf7ee'});
    k.box(x,.04,.4,2.8,.02,1.4,'#8daeb4');
  }
  for(const x of [-7.7,7.7])k.model('plant_floor',x,4.5,1.3);
  k.sign('В ГОРОД  →',-5.3,.58,6.94,2.8,.5,{bg:'#dce6e4',fg:'#38524c'});
  // A live scene display reflects the same state as the HUD; no remote stream.
  const display=document.createElement('canvas');display.width=1200;display.height=430;
  const texture=new T.CanvasTexture(display);texture.colorSpace=T.SRGBColorSpace;k.textures.push(texture);
  const screen=new T.Mesh(new T.PlaneGeometry(8.3,2.97),new T.MeshBasicMaterial({map:texture,toneMapped:false}));screen.position.set(0,2.35,-6.69);k.root.add(screen);
  const lights=ARGUS_SERVERS.map(x=>{const mat=new T.MeshBasicMaterial({color:'#58d8c3'}),light=new T.Mesh(new T.BoxGeometry(.65,.06,.04),mat);light.position.set(x,1.85,-4.48);k.root.add(light);return light;});
  const packetMat=new T.MeshBasicMaterial({color:'#73e1e3'}),packetGeo=new T.SphereGeometry(.07,6,4);
  const packets=Array.from({length:5},()=>{const p=new T.Mesh(packetGeo,packetMat);p.visible=false;k.root.add(p);return p;});
  let signature='';
  function updateIncident(state,result){
    if(!state)return;
    const data=ARGUS_SCENARIOS[state.scenario],step=ARGUS_PHASES.indexOf(state.phase),alert=data.risk&&step>=2&&step<5;
    const next=state.run+':'+state.phase+':'+state.scenario;
    if(next!==signature){
      signature=next;const c=display.getContext('2d');
      c.fillStyle='#112e3e';c.fillRect(0,0,1200,430);c.textAlign='left';c.font='bold 33px Arial';c.fillStyle='#c6eff0';c.fillText('AMI  /  СИНТЕТИЧЕСКАЯ СЕТЬ',36,52);
      c.font='24px Arial';c.fillStyle='#87a9ba';c.fillText(step===0?'Выберите сценарий в панели справа':step>=5?'Проверка завершена · '+data.response:step>=3?'Учебная метка: '+data.label+' · '+data.node:'Счётчики передают поток на анализ',36,97,1120);
      const xs=[150,570,1010],labels=['СЧЁТЧИКИ','ШЛЮЗ','ARGUS'],col=alert?'#f1a660':'#61dcc8';
      c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.moveTo(xs[0],230);c.lineTo(xs[2],230);c.stroke();
      xs.forEach((x,i)=>{c.fillStyle=i===1&&alert?'#805033':'#22566a';c.fillRect(x-72,171,144,116);c.strokeStyle=col;c.strokeRect(x-72,171,144,116);c.fillStyle='#eefbfa';c.textAlign='center';c.font='bold 22px Arial';c.fillText(labels[i],x,237);});
      c.textAlign='left';c.font='24px Arial';c.fillStyle='#87a9ba';c.fillText('01  Сбор потока',50,357);c.fillText('02  Анализ признаков',432,357);c.fillText('03  Решение',878,357);
      c.font='19px Arial';c.fillText('Локальное демо · ML-модель не запущена',36,407);
      texture.needsUpdate=true;lights.forEach((p,i)=>p.material.color.set(alert&&i>1?'#f49b5d':'#58d8c3'));packetMat.color.set(alert?'#ffb264':'#73e1e3');
    }
    packets.forEach((p,i)=>{p.visible=step>0&&step<6;if(p.visible)p.position.set(-3.2+(((result?.clock||0)*.22+i/5)%1)*6.4,2.25,-6.59);});
  }
  const built=k.finish(),envelope=createRoomEnvelope({width:17.8,depth:13.8,height:4.3,front:{width:17.55,z:6.8,baseHeight:.96,doorWidth:3.2,doorHeight:2.4,wallColor:'#365365',frameColor:'#7eb7bf'}});built.root.add(envelope.root);
  envelope.wall.color.set('#365365');
  for(const x of [-8.9,8.9])envelope.box(x,3.875,0,.25,.85,14,envelope.wall);
  const street=createEntranceOutlook({frontZ:6.8});built.root.add(street);
  return {...built,obstacles:argusObstacles(),interactions:[{id:'exit',type:'exit',title:'Выйти в город',x:0,z:5.8,radius:1.45},{id:'console',type:'argus',title:'Открыть инцидент ARGUS',x:0,z:.4,radius:2}],markers:[],updateIncident,setFirstPerson:value=>{envelope.root.visible=street.visible=value;}};
}
