import {createSceneKit as kit} from './sceneKit.js';
import {buildPharmacy} from './pharmacy.js';
export {buildExterior} from './exterior.js';
export const COMMON_ASSETS=['employee_base','employee_blond','employee_seated','employee_seated_blond','tree_atrium','planter_square','plant_floor','plant_desk','bookshelf','reception_counter','monitor','desk_oak','chair_task','sofa_two','server_rack','table_coffee','coffee_mug'];
export function buildInterior(kind,templates){
  if(kind==='pharmacy')return buildPharmacy(templates);
  const k=kit(templates),obstacles=[],interactions=[{id:'exit',type:'exit',title:'Выйти в город',x:0,z:5.6,radius:1.8}],markers=[];
  k.box(0,-.12,0,18,.24,14,'#d9d2b7');
  for(let x=-8.5;x<9;x+=1)for(let z=-6.5;z<7;z+=1)k.box(x,.004,z,.96,.018,.96,(Math.round(x+z)%2)?'#d5d0b9':'#e0dac4');
  for(const x of [-8.9,8.9])k.box(x,1.8,0,.25,3.6,14,'#546b76');
  k.box(0,1.8,-6.9,18,3.6,.25,'#546b76');
  for(const x of [-5.3,5.3])k.box(x,.55,6.9,7.4,1.1,.2,'#8eaa9c');
  for(const x of [-7.7,7.7])k.model('plant_floor',x,5,1.5);
  k.sign('В ГОРОД  →',-5.3,.6,7.04,2.8,.6,{bg:'#eee7d2',fg:'#38524c'});
  {
    k.sign('ARGUS  /  AMI LAB',0,2.8,-6.7,8.7,1.1,{bg:'#203e54',fg:'#b1e6db',sub:'Синтетическая сеть · учебная демонстрация'});
    for(const x of [-7,-5,5,7]){
      k.model('server_rack',x,-4.8,1.3);obstacles.push({x,z:-4.8,w:1,d:1.3});
    }
    for(const x of [-3,0,3]){
      k.model('desk_oak',x,-1.6,1.25);k.model('monitor',x,-1.6,1.5,0,1.01);k.model('chair_task',x,-.2,1.2,Math.PI);
      obstacles.push({x,z:-1.6,w:2.1,d:1.1},{x,z:-.2,w:.8,d:.8});
    }
    interactions.push({id:'console',type:'argus',title:'Открыть мониторинг ARGUS',x:0,z:1.2,radius:2.6});
    markers.push({id:'console',name:'Мониторинг сети',x:0,y:2.2,z:-1.6});
    k.box(-6,.08,1.9,1.8,.07,3.4,'#688f94');k.box(6,.08,1.9,1.8,.07,3.4,'#688f94');
  }
  return {...k.finish(),obstacles,markers,interactions};
}
