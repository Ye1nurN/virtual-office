import {createNavigation} from '../movement.js';
import {INTERIOR_BOUNDS} from './catalog.js';
import {TYNYSH_STAFF,TYNYSH_TABLES,tynyshObstacles} from './tynyshLayout.js';
// A visual task completes only after the employee has walked to its service point.
export function createTynyshDirector(){
  const nav=createNavigation(tynyshObstacles(),INTERIOR_BOUNDS);
  let epoch=-1,clock=0,actors=[];
  const reset=state=>{epoch=state.epoch;clock=0;actors=TYNYSH_STAFF.map(a=>({...a,yaw:Math.PI,path:[],table:null,work:0,sent:false}));};
  return {update(state,dt){
    if(!state)return {actors:[],view:{},active:false};if(epoch!==state.epoch)reset(state);
    const active=state.phase==='preparation'&&!state.automation.paused;
    const step=Math.max(0,Math.min(dt,.1))*state.automation.speed;if(active)clock+=step;
    let command=null;
    for(const a of actors){
      a.moving=false;a.working=false;a.carrying=false;
      if(a.id==='admin')continue;
      const task=state.tasks.find(t=>!t.done&&t.staff===a.id);
      if(a.table!==task?.table){a.table=task?.table??null;a.work=0;a.sent=false;a.path=task?nav.findPath(a,TYNYSH_TABLES.find(t=>t.id===task.table).approach):[];}
      if(!task||!active)continue;
      if(a.path.length){const p=a.path[0],dx=p.x-a.x,dz=p.z-a.z,len=Math.hypot(dx,dz),distance=Math.min(len,step*1.7);if(len<.035)a.path.shift();else{a.x+=dx/len*distance;a.z+=dz/len*distance;a.yaw=Math.atan2(dx,dz);a.moving=true;}a.carrying=true;}
      else{a.yaw=a.x<0?-Math.PI/2:Math.PI/2;a.work+=step;a.working=true;a.carrying=true;if(a.work>=4&&!a.sent&&!command){command={type:'DONE',table:task.table,epoch,automatic:true};a.sent=true;}}
    }
    const focused=actors.find(a=>a.table===state.selected)||actors.find(a=>a.table)||actors[0];
    const done=state.tasks.filter(t=>t.staff===focused.id&&t.done).length,total=state.tasks.filter(t=>t.staff===focused.id).length;
    const text=state.phase==='ready'?'Зал готов к встрече гостей':state.phase==='seating'?'Проверьте рассадку и меню':state.automation.paused?'Подготовка на паузе':focused.moving?`Несёт посуду к столу ${focused.table}`:`Сервирует стол ${focused.table}`;
    return {actors:actors.map(a=>({...a})),clock,command,active,view:{phase:state.phase,actor:focused.id,name:focused.name,text,done,total,progress:total?(done+(focused.working?Math.min(focused.work/4,1):0))/total:1,table:focused.table}};
  }};
}
