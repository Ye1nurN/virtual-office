// A deterministic local teaching sample, not inference or a connection to AMI.
export const METERS = [
  {id:'031',house:'Дом на Солнечной',signal:'Повтор сообщений',suspect:true},
  {id:'014',house:'Дом у сквера',signal:'Обычная телеметрия',suspect:false},
  {id:'008',house:'Дом на Набережной',signal:'Обычная телеметрия',suspect:false},
  {id:'022',house:'Дом на Лесной',signal:'Обычная телеметрия',suspect:false},
];
export const ROWS = {
  '031':[
    {id:'a',sequence:1042,time:'10:24:01',reading:'18,6'},
    {id:'b',sequence:1043,time:'10:24:02',reading:'18,7'},
    {id:'c',sequence:1042,time:'10:24:01',reading:'18,6'},
    {id:'d',sequence:1044,time:'10:24:04',reading:'18,8'},
  ],
};
for(const [i,meter] of METERS.entries())if(!ROWS[meter.id])ROWS[meter.id]=Array.from({length:4},(_,n)=>({id:String(n),sequence:2000+i*10+n,time:'10:24:0'+(n+1),reading:(12+i+n/10).toFixed(1).replace('.',',')}));
export function createExperiment(){return {selected:null,rows:[],panel:null,paused:false,hint:false,complete:false,evidence:[],feedback:null,checked:[]};}
export function experimentReducer(state,event){
  switch(event.type){
    case 'OPEN':return {...state,panel:event.panel==='help'?'help':'nodes',feedback:null};
    case 'SELECT':return METERS.some(m=>m.id===event.id)?{...state,selected:event.id,rows:[],panel:'inspect',hint:false,feedback:null}:state;
    case 'CLOSE':return {...state,panel:null};
    case 'PAUSE':return {...state,paused:!state.paused};
    case 'HINT':return {...state,hint:!state.hint};
    case 'ROW':{
      if(state.complete||state.panel!=='inspect'||!ROWS[state.selected]?.some(r=>r.id===event.id))return state;
      const selected=state.rows.includes(event.id),rows=selected?state.rows.filter(id=>id!==event.id):[...state.rows,event.id].slice(-2);
      return {...state,rows,feedback:null};
    }
    case 'CHECK':{
      if(state.complete||state.panel!=='inspect')return state;
      const data=ROWS[state.selected],meter=METERS.find(m=>m.id===state.selected);
      if(!meter)return state;
      if(!meter.suspect)return {...state,checked:[...new Set([...state.checked,meter.id])],feedback:{kind:'normal',text:'У этого счётчика номера идут по порядку, а время меняется. Здесь повторов нет. Исследуйте другой узел.'}};
      if(state.rows.length!==2)return {...state,feedback:{kind:'error',text:'Выберите два сообщения, которые хотите сравнить.'}};
      const [a,b]=state.rows.map(id=>data.find(row=>row.id===id));
      if(a.sequence!==b.sequence||a.time!==b.time||a.reading!==b.reading)return {...state,feedback:{kind:'error',text:'Эти сообщения отличаются. Сравните одновременно номер, время и показание.'}};
      return {...state,complete:true,evidence:[a,b].map(row=>({...row})),panel:'result',feedback:null};
    }
    case 'RESULT':return state.complete?{...state,panel:'result'}:state;
    case 'RESET':return createExperiment();
    default:return state;
  }
}
export function experimentReport(state){
  if(!state.complete)return null;
  return {demo:true,modelExecuted:false,networkConnected:false,node:'meter-031',finding:'Повтор сообщения',classification:'Replay (учебный сценарий)',evidence:state.evidence.map(row=>({...row})),response:'Событие подтверждено пользователем. Сеть не изменялась.'};
}
