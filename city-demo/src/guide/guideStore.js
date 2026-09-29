import {INTRO,detailReply,localReply,projectFacts,validAction,cleanReply} from './knowledge.js';

export const TOUR_ORDER=['pharmacy','argus','office'];
export function routeProgress(position,target){
  if(!position||!target)return 'loading';
  if(Math.hypot(position.x-target.x,position.z-target.z)<.9)return 'arrived';
  return position.navigating?'walking':'paused';
}
// Session-only state survives scene changes; no cookies, persistence or visitor identity.
export function createGuideStore(){
  let state={open:false,location:'city',project:null,mode:'checking',messages:[{role:'assistant',text:INTRO,actions:[{type:'tour',project:null}],sources:[]}],tour:null,busy:false,error:''};
  let scene=null,navigate=null,cityMode=null,request=null,sequence=0;
  const listeners=new Set();
  const update=patch=>{state={...state,...patch};listeners.forEach(fn=>fn());};
  const append=message=>update({messages:[...state.messages,message].slice(-40)});
  const cancel=()=>{sequence++;request?.abort();request=null;update({busy:false});};
  return {
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>state,
    setMode:mode=>update({mode}),
    setNavigator(fn){navigate=fn;return()=>{if(navigate===fn)navigate=null;};},
    setCityMode(fn){cityMode=fn;if(['starting','returning'].includes(state.tour?.phase))fn();return()=>{if(cityMode===fn)cityMode=null;};},
    setLocation(location){if(location===state.location)return;update({location});if(state.tour?.project===location){update({tour:{...state.tour,phase:'inside'}});append({role:'assistant',text:projectFacts(location).try,actions:[{type:'project',project:location}],sources:[location]});}else if(state.tour&&!['starting','returning'].includes(state.tour.phase)){update({tour:{...state.tour,phase:'paused'}});}},
    attachScene(engine,location){scene={engine,location};return()=>{if(scene?.engine===engine)scene=null;};},
    open(){scene?.engine.stop?.();if(state.tour?.phase==='walking')update({tour:{...state.tour,phase:'paused'}});update({open:true,error:''});},
    close(){update({open:false});},cancel,
    clear(){cancel();scene?.engine.stop?.();update({messages:[{role:'assistant',text:INTRO,actions:[{type:'tour',project:null}],sources:[]}],project:null,tour:null,error:''});},
    async send(text,fetcher=fetch){
      text=text.trim().slice(0,2000);if(!text||state.busy)return;
      const context={location:state.location,project:state.project},history=state.messages.slice(-12);
      append({role:'user',text});update({busy:true,error:''});
      const version=++sequence;request=new AbortController();const timer=setTimeout(()=>request?.abort(),30000);
      try{
        const response=await fetcher('/api/guide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:history.map(({role,text})=>({role,text})),context}),signal:request.signal});
        if(!response.ok)throw new Error(response.status===429?'Слишком много вопросов подряд. Попробуй немного позже.':'AI пока недоступен. Показан готовый ответ.');
        const data=await response.json();
        if(version!==sequence)return;
        const reply=cleanReply(data.reply);if(!reply)throw new Error('Ответ не удалось прочитать. Показан готовый ответ.');
        update({mode:data.mode==='ai'?'ai':'local'});append({role:'assistant',...reply});
        if(reply.sources.some(projectFacts))update({project:reply.sources.find(projectFacts)});
      }catch(error){
        if(version!==sequence)return;
        const reply=localReply(text,context,history);update({mode:'local',error:error.name==='AbortError'?'Ответ задержался. Показан готовый ответ.':error.message});append({role:'assistant',...reply});
        if(reply.sources.some(projectFacts))update({project:reply.sources.find(projectFacts)});
      }finally{clearTimeout(timer);if(version===sequence){request=null;update({busy:false});}}
    },
    act(action){
      if(!validAction(action))return;
      if(action.type==='about'){append({role:'assistant',...localReply('Расскажи об авторе')});return;}
      if(action.type==='project'){update({project:action.project});append({role:'assistant',...detailReply(action.project)});return;}
      if(action.type==='enter'){cancel();update({open:false,project:action.project});navigate?.(action.project);return;}
      const project=action.type==='tour'?TOUR_ORDER[0]:action.project;
      this.startRoute(project,action.type==='tour'?0:null);
    },
    startRoute(project,index=null){
      if(!projectFacts(project))return;
      cancel();scene?.engine.stop?.();update({open:false,project,tour:{project,index,phase:state.location==='city'?'starting':'returning'}});
      if(state.location!=='city')navigate?.('city');else cityMode?.();
    },
    beginRoute(){
      if(!scene||scene.location!=='city'||!['starting','returning'].includes(state.tour?.phase))return;
      if(!scene.engine.getPosition?.())return;
      const ok=scene.engine.goToProject(state.tour.project);update({tour:{...state.tour,phase:ok?'walking':'paused'},error:ok?'':'Не удалось построить маршрут. Можно войти в проект кнопкой.'});
    },
    position(position,entry){if(state.tour?.phase!=='walking')return;const phase=routeProgress(position,entry);if(phase!==state.tour.phase)update({tour:{...state.tour,phase}});},
    pause(){scene?.engine.stop?.();if(state.tour)update({tour:{...state.tour,phase:'paused'}});},
    resume(){if(state.tour)this.startRoute(state.tour.project,state.tour.index);},
    next(){const index=(state.tour?.index??-1)+1;if(index>=TOUR_ORDER.length){this.stopTour();this.open();append({role:'assistant',text:'Экскурсия завершена. Что обсудим подробнее?',actions:[],sources:[]});}else this.startRoute(TOUR_ORDER[index],index);},
    stopTour(){scene?.engine.stop?.();update({tour:null,error:''});},
  };
}
export const guide=createGuideStore();
