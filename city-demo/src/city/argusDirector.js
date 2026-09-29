import {createNavigation} from '../movement.js';
import {INTERIOR_BOUNDS} from './catalog.js';
import {ARGUS_BOTS,ARGUS_STATIONS,argusObstacles} from './argusLayout.js';
import {ARGUS_ACTIONS,ARGUS_SCENARIOS} from './argusDemo.js';

const durations={stream:4,detect:5,analyze:6,respond:5,verify:5};
const descriptions={stream:'Собираю показания счётчиков',detect:'Проверяю поток на стенде ARGUS',analyze:'Сопоставляю признаки события',respond:'Применяю учебное решение на шлюзе',verify:'Проверяю поток после решения'};
export function createArgusDirector(){
  const navigation=createNavigation(argusObstacles(),INTERIOR_BOUNDS);
  const actors=ARGUS_BOTS.map(b=>({...b,yaw:Math.PI,moving:false,working:false,tablet:false}));
  let run=-1,revision=-1,route=null,elapsed=0,awaiting=null,clock=0,error='';
  function update(s,seconds=0){
    if(!s)return {active:false,actors,clock,view:{phase:'idle',text:'Команда готова'}};
    if(run!==s.run){run=s.run;revision=-1;clock=0;actors.forEach((a,i)=>Object.assign(a,ARGUS_BOTS[i],{yaw:Math.PI,moving:false,working:false,tablet:false}));}
    if(revision!==s.revision){revision=s.revision;route=null;elapsed=0;awaiting=null;error='';}
    if(awaiting!==null&&awaiting!==s.automation.version)awaiting=null;
    const action=ARGUS_ACTIONS[s.phase],actor=actors.find(a=>a.id===action?.role),target=ARGUS_STATIONS[s.phase];
    const runnable=!!action&&s.automation.mode==='auto'&&!s.automation.paused&&!s.error&&!error&&awaiting===null;
    let command=null;
    if(!s.automation.paused||s.automation.mode==='manual')actors.forEach(a=>{a.moving=false;a.working=false;a.tablet=false;});
    if(runnable){
      const dt=Math.max(0,Math.min(seconds,1))*s.automation.speed;clock+=dt;
      if(route===null){route=navigation.findPath(actor,target);if(!route.length&&Math.hypot(actor.x-target.x,actor.z-target.z)>.06)error='Проход к рабочему месту недоступен.';}
      let distance=dt*1.65;
      while(route?.length&&distance>0){
        const to=route[0],dx=to.x-actor.x,dz=to.z-actor.z,len=Math.hypot(dx,dz);
        if(len<.015){route.shift();continue;}
        const step=Math.min(len,distance),x=actor.x,z=actor.z;
        if(!navigation.move(actor,dx/len*step,dz/len*step)){error='Проход к рабочему месту недоступен.';break;}
        actor.yaw=Math.atan2(actor.x-x,actor.z-z);actor.moving=true;distance-=step;if(step>=len-.001)route.shift();
      }
      if(!error&&!route?.length&&!actor.moving){
        elapsed+=dt;actor.yaw=Math.PI;actor.working=true;actor.tablet=true;
        if(elapsed>=durations[s.phase]){awaiting=s.automation.version;command={type:'BOT_COMMAND',command:action.command,run:s.run,revision:s.revision,version:s.automation.version};}
      }
    }
    const complete=s.phase==='complete',idle=s.phase==='setup',manual=s.automation.mode==='manual';
    const phase=error||s.error?'error':complete?'complete':idle?'idle':manual?'manual':s.automation.paused?'paused':route?.length?'walk':'work';
    const text=error||s.error||(complete?ARGUS_SCENARIOS[s.scenario].result:idle?'Выберите сценарий и запустите поток':manual?'Выполните шаг за сотрудника':s.automation.paused?'Сценарий на паузе':route?.length?'Иду к рабочей станции':descriptions[s.phase]);
    return {active:runnable&&!error,actors,clock,command,view:{phase,text,actor:actor?.id,name:actor?.name||'Команда ARGUS',progress:action?Math.min(1,elapsed/durations[s.phase]):complete?1:0}};
  }
  return {actors,update};
}
