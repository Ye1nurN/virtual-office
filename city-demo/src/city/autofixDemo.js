// An isolated portfolio scenario. No network requests, accounts or real bookings.
export const AUTOFIX_SITE='https://yx-uniq-77f4c.web.app/';
export const AUTOFIX_SERVICES=[
  {id:'wash',name:'Детейлинг-мойка',minutes:60,price:12000},
  {id:'polish',name:'Полировка кузова',minutes:120,price:45000},
  {id:'interior',name:'Химчистка салона',minutes:180,price:35000},
];
export const AUTOFIX_CARS=[{id:'sedan',name:'Седан',color:'#5b9c95'},{id:'suv',name:'Кроссовер',color:'#d3aa70'}];
export const AUTOFIX_BOXES=['Бокс 01','Бокс 02'];
export const AUTOFIX_HOURS={open:600,close:1080};
export const timeLabel=minutes=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
const active=booking=>booking.status!=='cancelled';
const overlaps=(start,end,booking)=>start<booking.start+booking.minutes&&end>booking.start;
export function createAutofixDemo(){return {bookings:[
  {id:'sample-1',car:'sample-sedan',carName:'Демо · седан',service:'wash',name:'Детейлинг-мойка',start:600,minutes:60,price:12000,box:0,status:'completed',sample:true},
  {id:'sample-2',car:'sample-suv',carName:'Демо · кроссовер',service:'polish',name:'Полировка кузова',start:660,minutes:120,price:45000,box:1,status:'confirmed',sample:true},
],nextId:1,error:'',lastCreated:null};}
export function availableAutofixSlots(state,serviceId,car){
  const service=AUTOFIX_SERVICES.find(s=>s.id===serviceId);
  if(!service||!AUTOFIX_CARS.some(c=>c.id===car))return [];
  const slots=[];
  for(let start=AUTOFIX_HOURS.open;start+service.minutes<=AUTOFIX_HOURS.close;start+=60){
    const collisions=state.bookings.filter(b=>active(b)&&overlaps(start,start+service.minutes,b));
    const boxes=AUTOFIX_BOXES.map((_,i)=>i).filter(box=>!collisions.some(b=>b.box===box));
    if(boxes.length&&!collisions.some(b=>b.car===car))slots.push({start,boxes});
  }
  return slots;
}
export function autofixReducer(state,action){
  if(action.type==='reset')return createAutofixDemo();
  if(action.type==='book'){
    const service=AUTOFIX_SERVICES.find(s=>s.id===action.service),car=AUTOFIX_CARS.find(c=>c.id===action.car);
    const slot=availableAutofixSlots(state,action.service,action.car).find(s=>s.start===action.start);
    if(!service||!car||!slot)return {...state,error:'Это время недоступно. Выберите другой свободный слот.'};
    const id='visitor-'+state.nextId;
    return {...state,bookings:[...state.bookings,{id,car:car.id,carName:car.name,service:service.id,name:service.name,start:slot.start,minutes:service.minutes,price:service.price,box:slot.boxes[0],status:'confirmed',sample:false}],nextId:state.nextId+1,lastCreated:id,error:''};
  }
  if(action.type==='status'){
    const transitions={confirmed:['in-progress','cancelled'],'in-progress':['completed','cancelled']};
    const booking=state.bookings.find(b=>b.id===action.id);
    if(!booking||!transitions[booking.status]?.includes(action.status))return state;
    return {...state,bookings:state.bookings.map(b=>b.id===action.id?{...b,status:action.status}:b),error:''};
  }
  return state;
}
export function autofixMetrics(state){
  const fulfilled=state.bookings.filter(b=>b.status==='completed');
  return {total:state.bookings.length,completed:fulfilled.length,cancelled:state.bookings.filter(b=>b.status==='cancelled').length,
    revenue:fulfilled.reduce((sum,b)=>sum+b.price,0),
    utilization:AUTOFIX_BOXES.map((_,box)=>Math.round(state.bookings.filter(b=>b.box===box&&active(b)).reduce((sum,b)=>sum+b.minutes,0)/(AUTOFIX_HOURS.close-AUTOFIX_HOURS.open)*100))};
}
