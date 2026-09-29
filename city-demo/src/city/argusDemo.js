// Scripted portfolio demonstration. Never sends packets, runs inference or changes a real network.
export const ARGUS_SCENARIOS = {
  dos: {name:'Всплеск запросов · DoS', node:'gateway-002', label:'DoS', risk:true, rate:840, repeats:2, description:'Шлюз получает слишком много запросов. Найдите источник и ограничьте поток.', evidence:'840 пакетов/с при учебной норме 24. Большинство запросов направлено на один шлюз.', response:'Ограничен поток к gateway-002', result:'Поток стабилизирован, соседние узлы продолжают передавать показания.'},
  replay: {name:'Повтор пакетов · Replay', node:'meter-031', label:'Replay', risk:true, rate:96, repeats:38, description:'Счётчик повторно отправляет одинаковые записи. Проверьте последовательности пакетов.', evidence:'38 повторов с одинаковыми номерами последовательности и устаревшими метками времени.', response:'Повторные записи meter-031 отфильтрованы', result:'Повторные пакеты отброшены, новые показания проходят проверку.'},
  normal: {name:'Обычная телеметрия', node:'meter-014', label:'Normal', risk:false, rate:24, repeats:0, description:'Проверьте штатную передачу показаний и оставьте исправный узел в работе.', evidence:'24 пакета/с, последовательности уникальны, временные метки согласованы.', response:'Узел оставлен под наблюдением', result:'Штатный трафик подтверждён. Ограничения не понадобились.'},
};
export const ARGUS_PHASES=['setup','stream','detect','analyze','respond','verify','complete'];
export const ARGUS_STEPS=['Сценарий','Поток','Обнаружение','Анализ','Реакция','Проверка','Отчёт'];
export const ARGUS_ROLES={operator:'Оператор',analyst:'Аналитик',engineer:'Инженер'};
export const ARGUS_ACTIONS={
  stream:{command:'COLLECT',role:'operator',label:'Передать поток на анализ',text:'Синтетический поток собран и передан на анализ.'},
  detect:{command:'DETECT',role:'operator',label:'Показать результат классификации',text:'Получена заданная сценарием метка трафика.'},
  analyze:{command:'ANALYZE',role:'analyst',label:'Проверить признаки',text:'Аналитик проверил частоту, последовательности и время пакетов.'},
  respond:{command:'RESPOND',role:'engineer',label:'Применить учебное решение',text:'Учебная реакция применена к выбранному узлу.'},
  verify:{command:'VERIFY',role:'analyst',label:'Проверить результат и закрыть',text:'Контрольная проверка завершена. Отчёт готов.'},
};
export function createArgusDemo(){return {scenario:'dos',phase:'setup',role:'operator',run:0,revision:0,events:[],decision:null,error:null,automation:{mode:'auto',paused:false,speed:1,follow:false,version:0}};}
export function argusDemoReducer(state,event){
  if(event.type==='RESET')return {...createArgusDemo(),scenario:state.scenario,run:state.run+1};
  if(event.type==='SELECT')return state.phase==='setup'&&ARGUS_SCENARIOS[event.scenario]?{...state,scenario:event.scenario,error:null}:state;
  if(event.type==='START'){
    if(state.phase!=='setup')return state;
    return {...state,phase:'stream',run:state.run+1,revision:1,error:null,events:[{id:1,role:'visitor',source:'user',text:'Запущен сценарий: '+ARGUS_SCENARIOS[state.scenario].name}]};
  }
  if(event.type==='CONTROL'){
    const automation={...state.automation,version:state.automation.version+1};
    if(['auto','manual'].includes(event.mode))automation.mode=event.mode;
    if(typeof event.paused==='boolean')automation.paused=event.paused;
    if([1,2].includes(event.speed))automation.speed=event.speed;
    if(typeof event.follow==='boolean')automation.follow=event.follow;
    return {...state,automation,error:null,role:event.mode==='manual'?(ARGUS_ACTIONS[state.phase]?.role||'operator'):state.role};
  }
  if(event.type==='ROLE')return state.automation.mode==='manual'&&ARGUS_ROLES[event.role]?{...state,role:event.role,error:null}:state;
  if(!['BOT_COMMAND','MANUAL_COMMAND'].includes(event.type))return state;
  const bot=event.type==='BOT_COMMAND',auto=state.automation,action=ARGUS_ACTIONS[state.phase];
  if(bot&&(auto.mode!=='auto'||auto.paused||event.run!==state.run||event.revision!==state.revision||event.version!==auto.version))return state;
  if(!bot&&auto.mode!=='manual')return state;
  if(!action||event.command!==action.command)return {...state,error:'Сначала завершите текущий этап.'};
  if(!bot&&state.role!==action.role)return {...state,error:'Это действие выполняет '+ARGUS_ROLES[action.role].toLowerCase()+'.'};
  const scenario=ARGUS_SCENARIOS[state.scenario];
  let decision=state.decision;
  if(event.command==='RESPOND'){
    decision=bot?(scenario.risk?'contain':'observe'):event.decision;
    if(decision!==(scenario.risk?'contain':'observe'))return {...state,error:scenario.risk?'Признаки угрозы подтверждены. Выберите ограничение подозрительного потока.':'Поток штатный. Оставьте узел под наблюдением.'};
  }
  const phase=ARGUS_PHASES[ARGUS_PHASES.indexOf(state.phase)+1];
  const text=event.command==='DETECT'?`Учебная метка: ${scenario.label}. Узел ${scenario.node}.`:event.command==='RESPOND'?scenario.response:action.text;
  return {...state,phase,decision,revision:state.revision+1,error:null,role:!bot?(ARGUS_ACTIONS[phase]?.role||state.role):state.role,events:[...state.events,{id:state.events.length+1,role:action.role,source:bot?'bot':'user',text}]};
}
export function argusReport(state){
  if(state.phase!=='complete')return null;
  const s=ARGUS_SCENARIOS[state.scenario];
  return {demo:true,modelExecuted:false,networkConnected:false,scenario:s.name,node:s.node,classification:s.label,evidence:s.evidence,response:s.response,result:s.result,events:state.events};
}
