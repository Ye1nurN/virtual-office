import {SHELVES} from './catalog.js';

// Local scenario adapter. The request, staff task and report have separate lifecycles,
// matching the original CRM. Nothing here creates a real reservation or calls its API.
export const DEMO_ROLES=[
  {id:'advertiser',name:'Рекламодатель',short:'Рекламодатель'},
  {id:'admin',name:'Администратор',short:'Администратор'},
  {id:'manager',name:'Управляющий',short:'Управляющий'},
  {id:'staff',name:'Сотрудник аптеки',short:'Сотрудник'},
  {id:'reviewer',name:'Управляющий · проверка',short:'Проверяющий'},
];
export const DEMO_STEPS=['Выбор места','Согласование','Задание','Размещение','Фотоотчёт','Проверка','Результат'];
export const PORTIONS={whole:'Вся полка',left:'Левая половина',right:'Правая половина'};
export function createPharmacyDemo(){return {role:'advertiser',request:null,task:null,installed:false,report:null,attempts:[],events:[],error:null,automation:{mode:'auto',paused:false,speed:1,follow:false,scenario:'standard',generation:0,version:0}};}
export function campaignStep(s){
  if(!s.request)return 0;
  if(s.request.status==='pending')return 1;
  if(!s.task)return 2;
  if(!s.installed)return 3;
  if(!s.report||['draft','rejected'].includes(s.report.status))return 4;
  return s.report.status==='pending'?5:6;
}
export function recommendedRole(s){return ['advertiser','admin','manager','staff','staff','reviewer','advertiser'][campaignStep(s)];}
export function availableReport(s){return s.role==='advertiser'&&s.report?.status!=='approved'?null:s.report;}
export function demoMonths(now=new Date()){
  return Array.from({length:3},(_,i)=>{const date=new Date(now.getFullYear(),now.getMonth()+i+1,1);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;});
}
export function monthLabel(value){return new Date(value+'-01T12:00:00').toLocaleDateString('ru-RU',{month:'long',year:'numeric'});}
const requireState=(ok,message)=>{if(!ok)throw new Error(message);};
export function transitionPharmacyDemo(state,event){
  if(event.type==='RESET'){const next=createPharmacyDemo();next.automation.generation=state.automation.generation+1;next.automation.scenario=event.scenario==='reshoot'?'reshoot':'standard';return next;}
  if(event.type==='AUTO_CONFIG'){
    const a={...state.automation,version:state.automation.version+1};
    if(['auto','manual'].includes(event.mode))a.mode=event.mode;
    if(typeof event.paused==='boolean')a.paused=event.paused;
    if([1,2].includes(event.speed))a.speed=event.speed;
    if(typeof event.follow==='boolean')a.follow=event.follow;
    return {...state,automation:a,role:event.mode==='manual'?recommendedRole(state):event.mode==='auto'?'advertiser':state.role,error:null};
  }
  if(event.type==='BOT_COMMAND'){
    // The runner can only apply a command for the exact live local scenario.
    // Stale frames after pause, reset, takeover or a manual edit are harmless.
    if(state.automation.mode!=='auto'||state.automation.paused||event.generation!==state.automation.generation||event.version!==state.automation.version||event.revision!==state.events.length||event.request!==state.request?.createdAt)return state;
    const actors={APPROVE_REQUEST:'admin',CREATE_TASK:'manager',INSTALL:'staff',CAPTURE:'staff',SUBMIT_REPORT:'staff',REJECT_REPORT:'reviewer',APPROVE_REPORT:'reviewer'};
    requireState(actors[event.command],'Неизвестное действие бота.');
    const next=transitionPharmacyDemo({...state,role:actors[event.command]},{type:event.command,image:event.image,reason:event.reason,now:event.now});
    return {...next,role:state.role,events:next.events.map((e,i)=>i===next.events.length-1?{...e,source:'bot'}:e)};
  }
  if(event.type==='ROLE'){
    requireState(DEMO_ROLES.some(r=>r.id===event.role),'Неизвестная роль.');
    return {...state,role:event.role,error:null,automation:{...state.automation,mode:'manual',paused:false,version:state.automation.version+1}};
  }
  const now=event.now??Date.now(),stamp=new Date(now).toISOString();
  const role=id=>requireState(state.role===id,'Переключитесь на роль, которая выполняет это действие.');
  const result=(patch,text)=>({...state,...patch,error:null,events:[...state.events,{id:state.events.length+1,role:state.role,text,at:stamp}]});
  switch(event.type){
    case 'REQUEST':{
      role('advertiser');requireState(!state.request,'Для новой кампании начните сценарий заново.');
      const shelf=SHELVES.find(s=>s.id===event.shelf),campaign=String(event.campaign||'').trim();
      requireState(shelf&&PORTIONS[event.portion],'Выберите полку и размер размещения.');
      requireState(campaign.length>0&&campaign.length<=80,'Укажите название кампании до 80 символов.');
      requireState(demoMonths(new Date(now)).includes(event.month),'Выберите один из трёх ближайших месяцев.');
      const price=Math.round(shelf.price*(event.portion==='whole'?1:.5));
      return result({request:{id:'DEMO-001',shelf:shelf.id,campaign,month:event.month,portion:event.portion,price,status:'pending',createdAt:stamp}},`Заявка DEMO-001: ${shelf.name}, ${PORTIONS[event.portion].toLowerCase()}.`);
    }
    case 'APPROVE_REQUEST':
      role('admin');requireState(state.request?.status==='pending','Заявка уже рассмотрена или ещё не создана.');
      return result({request:{...state.request,status:'approved'}},'Администратор согласовал рекламное место.');
    case 'CREATE_TASK':
      role('manager');requireState(state.request?.status==='approved'&&!state.task,'Задание создаётся один раз после согласования заявки.');
      return result({task:{id:'TASK-001',status:'open'}},'Управляющий выдал сотруднику задание на размещение и фотоотчёт.');
    case 'INSTALL':
      role('staff');requireState(state.task?.status==='open'&&!state.installed,'Сначала нужно получить задание на размещение.');
      return result({installed:true,task:{...state.task,status:'in_progress'},report:{status:'draft',image:null,reason:''}},'Рекламная выкладка установлена на выбранной 3D-полке.');
    case 'CAPTURE':
      role('staff');requireState(state.installed&&['draft','rejected'].includes(state.report?.status),'Снимок доступен после размещения или возврата на пересъёмку.');
      requireState(typeof event.image==='string'&&event.image.startsWith('data:image/jpeg;base64,')&&event.image.length<2000000,'Не удалось получить снимок 3D-сцены.');
      return result({report:{status:'draft',image:event.image,reason:state.report.reason||''}},'Создан демонстрационный снимок 3D-полки.');
    case 'SUBMIT_REPORT':
      role('staff');requireState(state.report?.status==='draft'&&state.report.image,'Сначала сделайте новый снимок полки.');
      return result({report:{...state.report,status:'pending'},attempts:[...state.attempts,{number:state.attempts.length+1,image:state.report.image,status:'pending',submittedAt:stamp}]},`Фотоотчёт отправлен на проверку · попытка ${state.attempts.length+1}.`);
    case 'REJECT_REPORT':{
      role('reviewer');requireState(state.report?.status==='pending','На проверке пока нет отчёта.');
      const reason=String(event.reason||'').trim();requireState(reason.length>=5&&reason.length<=200,'Укажите причину возврата: от 5 до 200 символов.');
      return result({report:{status:'rejected',image:null,reason},attempts:state.attempts.map((a,i)=>i===state.attempts.length-1?{...a,status:'rejected',reason}:a)},`Отчёт возвращён: ${reason}`);
    }
    case 'APPROVE_REPORT':
      role('reviewer');requireState(state.report?.status==='pending','Сначала сотрудник должен отправить фотоотчёт.');
      return result({report:{...state.report,status:'approved'},task:{...state.task,status:'done'},attempts:state.attempts.map((a,i)=>i===state.attempts.length-1?{...a,status:'approved'}:a)},'Фотоотчёт принят. Задание закрыто, результат доступен рекламодателю.');
    default:throw new Error('Неизвестное действие сценария.');
  }
}
export function pharmacyDemoReducer(state,event){
  try{return transitionPharmacyDemo(state,event);}catch(error){return {...state,error:error.message};}
}
