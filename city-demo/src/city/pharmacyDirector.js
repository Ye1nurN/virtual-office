import {createNavigation} from '../movement.js';
import {SHELVES,INTERIOR_BOUNDS} from './catalog.js';
import {pharmacyObstacles} from './pharmacyLayout.js';

export const BOT_STATIONS={terminal:{x:4.4,z:-3.2},manager:{x:1.35,z:-3.5},materials:{x:5.85,z:-.25}};
export const PHARMACY_BOTS=[
  {id:'admin',name:'Администратор',color:'#658ebc',x:5.7,z:-4.55},
  {id:'manager',name:'Управляющий',color:'#bc9065',x:.1,z:-4.7},
  {id:'staff',name:'Сотрудник',color:'#79b299',x:-5.8,z:-3.4},
];

function makePlan(s){
  const shelf=SHELVES.find(a=>a.id===s.request.shelf),walk=(actor,target,text)=>({actor,target,text,kind:'walk'}),work=(actor,duration,text,command,extra={})=>({actor,duration,text,command,kind:'work',...extra});
  if(s.request.status==='pending')return [work('admin',2,'Получена новая заявка'),walk('admin',BOT_STATIONS.terminal,'Иду к компьютеру'),work('admin',6,'Проверяю доступность места','APPROVE_REQUEST')];
  if(!s.task)return [walk('manager',BOT_STATIONS.manager,'Открываю согласованную заявку'),work('manager',6,'Выдаю задание сотруднику','CREATE_TASK')];
  if(!s.installed)return [walk('staff',BOT_STATIONS.materials,'Забираю рекламные материалы'),work('staff',3,'Комплектую коробку',null,{pickup:true}),walk('staff',shelf,'Несу материалы к полке '+shelf.id),work('staff',6,'Устанавливаю рекламную выкладку','INSTALL',{installing:true})];
  if(!s.report?.image&&s.report?.status!=='pending')return [walk('staff',shelf,s.report?.status==='rejected'?'Возвращаюсь на пересъёмку':'Проверяю готовую выкладку'),work('staff',5,s.attempts.length?'Переснимаю крупным планом':'Фотографирую полку','CAPTURE',{camera:true})];
  if(s.report?.status==='draft')return [work('staff',4,'Отправляю фотоотчёт управляющему','SUBMIT_REPORT',{tablet:true})];
  if(s.report?.status==='pending'){
    const reshoot=s.automation.scenario==='reshoot'&&s.attempts.length===1;
    return [walk('manager',BOT_STATIONS.manager,'Открываю фотоотчёт'),work('manager',7,reshoot?'Нужен более крупный план':'Проверяю выкладку по фото',reshoot?'REJECT_REPORT':'APPROVE_REPORT',{tablet:true})];
  }
  return [];
}

// Pure deterministic director, shared by rendering and tests. Its lifetime belongs
// to CityApp, so leaving/re-entering the room preserves position and elapsed work.
export function createPharmacyDirector(){
  const navigation=createNavigation(pharmacyObstacles(),INTERIOR_BOUNDS);
  let generation=-1,requestKey='',businessKey='',plan=[],index=0,elapsed=0,route=null,awaiting=null,error='',clock=0;
  const actors=PHARMACY_BOTS.map(b=>({...b,yaw:Math.PI,moving:false,carrying:false,camera:false,tablet:false,working:false}));
  function reset(){for(const actor of actors){const home=PHARMACY_BOTS.find(a=>a.id===actor.id);Object.assign(actor,{x:home.x,z:home.z,yaw:Math.PI,moving:false,carrying:false,camera:false,tablet:false,working:false});}businessKey='';plan=[];index=0;elapsed=0;route=null;awaiting=null;error='';clock=0;}
  function update(s,seconds=0){
    if(!s)return {active:false,actors,view:{phase:'idle',text:'Команда готова к работе'}};
    if(generation!==s.automation.generation||requestKey!==(s.request?.createdAt||'')){generation=s.automation.generation;requestKey=s.request?.createdAt||'';reset();}
    const key=requestKey+':'+s.events.length;
    if(key!==businessKey){businessKey=key;plan=s.request?makePlan(s):[];index=0;elapsed=0;route=null;awaiting=null;error='';if(s.installed)actors.find(a=>a.id==='staff').carrying=false;}
    if(awaiting!==null&&awaiting!==s.automation.version){awaiting=null;}
    if(!s.automation.paused||s.automation.mode!=='auto')for(const a of actors){a.moving=false;a.camera=false;a.tablet=false;a.working=false;}
    const item=plan[index],actor=actors.find(a=>a.id===item?.actor),complete=s.report?.status==='approved';
    const runnable=!!item&&s.automation.mode==='auto'&&!s.automation.paused&&!s.error&&!error&&awaiting===null;
    let command=null;
    if(runnable){
      const dt=Math.max(0,Math.min(seconds,1))*s.automation.speed;clock+=dt;
      if(item.kind==='walk'){
        if(route===null){route=navigation.findPath(actor,item.target);if(!route.length&&Math.hypot(actor.x-item.target.x,actor.z-item.target.z)>.06)error='Не удалось построить маршрут сотрудника.';}
        let distance=dt*1.55;
        while(route?.length&&distance>0){
          const to=route[0],dx=to.x-actor.x,dz=to.z-actor.z,len=Math.hypot(dx,dz);
          if(len<.015){route.shift();continue;}
          const step=Math.min(len,distance),x=actor.x,z=actor.z;
          if(!navigation.move(actor,dx/len*step,dz/len*step)){error='Проход к рабочему месту недоступен.';break;}
          actor.yaw=Math.atan2(actor.x-x,actor.z-z);actor.moving=true;distance-=step;
          if(step>=len-.001)route.shift();
        }
        if(!error&&!route?.length){index++;elapsed=0;route=null;}
      }else{
        elapsed+=dt;actor.working=true;actor.camera=!!item.camera;actor.tablet=!!item.tablet||actor.id!=='staff';
        if(actor.id==='staff'&&(item.installing||item.camera)){
          const shelf=SHELVES.find(a=>a.id===s.request.shelf);actor.yaw=shelf.fixture==='vitamins'?-Math.PI/2:Math.PI;
        }else if(actor.id==='admin')actor.yaw=0;
        if(elapsed>=item.duration){
          if(item.pickup)actor.carrying=true;
          if(item.command){awaiting=s.automation.version;command={type:'BOT_COMMAND',command:item.command,generation:s.automation.generation,version:s.automation.version,revision:s.events.length,request:s.request.createdAt,detail:s.attempts.length>0,reason:'Покажите рекламную выкладку крупным планом, чтобы было видно название кампании.'};}
          else{index++;elapsed=0;route=null;}
        }
      }
    }
    const phase=error||s.error?'error':complete?'complete':!s.request?'idle':s.automation.mode==='manual'?'manual':s.automation.paused?'paused':item?.kind||'waiting';
    const text=error||s.error||(complete?'Фотоотчёт принят. Результат доступен заказчику.':!s.request?'Отправьте заявку — команда выполнит остальные шаги.':item?.text||'Переходим к следующему этапу');
    return {active:runnable&&!error,command,actors,clock,view:{phase,text,actor:actor?.id||'staff',name:actor?.name||'Команда аптеки',progress:item?.duration?Math.min(1,elapsed/item.duration):null,carrying:actors.find(a=>a.id==='staff').carrying}};
  }
  return {update,actors};
}
