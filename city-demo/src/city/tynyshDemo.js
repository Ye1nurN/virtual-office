import {TYNYSH_TABLES} from './tynyshLayout.js';
export const TYNYSH_MENUS={classic:{name:'Классическое',price:15000},festive:{name:'Праздничное',price:19000}};
export const TYNYSH_OCCUPIED='2026-10-18';
export const tynyshMoney=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₸';
const tasks=()=>TYNYSH_TABLES.map((t,i)=>({table:t.id,staff:i%2?'aida':'daniyar',done:i<2}));
export function createTynyshDemo(epoch=0){return {epoch,revision:0,phase:'preparation',role:'admin',event:{title:'Семейный банкет',date:'2026-10-17',guests:48,menu:'classic'},selected:3,tasks:tasks(),automation:{mode:'auto',paused:false,speed:1},payments:[{id:1,kind:'income',label:'Предоплата',amount:150000},{id:2,kind:'expense',label:'Декор и цветы',amount:45000}],history:['Бронь на 17 октября подтверждена','Рассадка: 6 столов по 8 гостей','Меню: классическое','Данияр и Аида начали подготовку'],error:''};}
export function tynyshTotals(state){const total=state.event.guests*TYNYSH_MENUS[state.event.menu].price;const income=state.payments.filter(p=>p.kind==='income').reduce((s,p)=>s+p.amount,0),expenses=state.payments.filter(p=>p.kind==='expense').reduce((s,p)=>s+p.amount,0);return {total,income,expenses,balance:Math.max(0,total-income),overpaid:Math.max(0,income-total),net:income-expenses};}
function record(state,patch,line){return {...state,...patch,revision:state.revision+1,error:'',history:line?[...state.history,line].slice(-40):state.history};}
export function tynyshReducer(state,action){
  if(action.type==='RESET')return createTynyshDemo(state.epoch+1);
  if(action.type==='SELECT')return TYNYSH_TABLES.some(t=>t.id===action.table)?{...state,selected:action.table}:state;
  if(action.type==='ROLE')return ['admin','staff'].includes(action.role)?{...state,role:action.role,error:''}:state;
  if(action.type==='CONTROL')return {...state,automation:{...state.automation,...(action.mode?{mode:action.mode}:{}),...(typeof action.paused==='boolean'?{paused:action.paused}:{}),...([1,2].includes(action.speed)?{speed:action.speed}:{})}};
  if(action.type==='DONE'){
    if(action.epoch!==undefined&&action.epoch!==state.epoch)return state;
    const task=state.tasks.find(t=>t.table===action.table);if(!task||task.done||state.phase!=='preparation')return state;
    if(!action.automatic&&state.role==='staff'&&task.staff!=='daniyar')return {...state,error:'В этом режиме доступны задачи Данияра.'};
    const next=state.tasks.map(t=>t===task?{...t,done:true}:t),ready=next.every(t=>t.done);
    return record(state,{tasks:next,phase:ready?'ready':state.phase},ready?'Все столы готовы. Можно встречать гостей.':`Стол ${task.table}: сервировка завершена`);
  }
  if(state.role!=='admin')return {...state,error:'Это действие доступно администратору.'};
  if(action.type==='BOOK'){
    const date=String(action.date||''),guests=Number(action.guests),title=String(action.title||'').trim().slice(0,60);
    const parsed=new Date(date+'T12:00:00Z');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||!title||!Number.isInteger(guests)||guests<6||guests>48)return {...state,error:'Укажите название, корректную дату и от 6 до 48 гостей.'};
    if(date===TYNYSH_OCCUPIED)return {...state,error:'18 октября зал уже занят. Выберите другую дату.'};
    return record(state,{epoch:state.epoch+1,phase:'seating',event:{...state.event,title,date,guests},tasks:tasks().map(t=>({...t,done:false})),payments:[],automation:{...state.automation,mode:'manual',paused:true}},`Подтверждена бронь «${title}» на ${date}, ${guests} гостей`);
  }
  if(action.type==='GUESTS'){
    if(![36,48].includes(action.guests))return state;
    return record(state,{epoch:state.epoch+1,event:{...state.event,guests:action.guests},phase:'seating',tasks:state.tasks.map(t=>({...t,done:false})),automation:{...state.automation,paused:true}},`Новая рассадка: 6 столов по ${action.guests/6} гостей`);
  }
  if(action.type==='MENU'){
    if(!TYNYSH_MENUS[action.menu]||action.menu===state.event.menu)return state;
    return record(state,{epoch:state.epoch+1,event:{...state.event,menu:action.menu},phase:'seating',tasks:state.tasks.map(t=>({...t,done:false})),automation:{...state.automation,paused:true}},`Меню изменено: ${TYNYSH_MENUS[action.menu].name}. Сервировку нужно обновить.`);
  }
  if(action.type==='PREPARE')return record(state,{phase:state.tasks.every(t=>t.done)?'ready':'preparation',automation:{...state.automation,paused:false}},'Команда приступила к подготовке');
  if(action.type==='ASSIGN'){
    if(!['daniyar','aida'].includes(action.staff))return state;
    const task=state.tasks.find(t=>t.table===action.table);if(!task||task.done||task.staff===action.staff)return state;
    return record(state,{tasks:state.tasks.map(t=>t===task?{...t,staff:action.staff}:t)},`Стол ${action.table}: назначен сотрудник ${action.staff==='daniyar'?'Данияр':'Аида'}`);
  }
  if(action.type==='PAYMENT'){
    const amount=Number(action.amount),label=String(action.label||'').trim().slice(0,60);
    if(!['income','expense'].includes(action.kind)||!label||!Number.isInteger(amount)||amount<=0||amount>10000000)return {...state,error:'Укажите назначение и целую сумму от 1 до 10 000 000 ₸.'};
    if(action.kind==='income'&&amount>tynyshTotals(state).balance)return {...state,error:'Платёж превышает остаток по банкету.'};
    return record(state,{payments:[...state.payments,{id:state.payments.length+1,kind:action.kind,amount,label}]},`${action.kind==='income'?'Поступление':'Расход'}: ${label}, ${tynyshMoney(amount)}`);
  }
  return state;
}
export function tableGuests(state,id){return Math.floor(state.event.guests/6)+(id<=state.event.guests%6?1:0);}
