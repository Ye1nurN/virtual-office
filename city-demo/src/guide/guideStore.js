import {INTRO,detailReply,localReply,projectFacts,validAction,cleanReply} from './knowledge.js';

export const TOUR_ORDER=['pharmacy','argus','office'];
// Session-only state survives scene changes; no cookies, persistence or visitor identity.
export function createGuideStore(){
  let state={open:false,location:'city',project:null,mode:'checking',messages:[{role:'assistant',text:INTRO,actions:[{type:'tour',project:null}],sources:[]}],tour:null,busy:false,error:''};
  let scene=null,navigate=null,cityMode=null,request=null,sequence=0,guidePose=null;
  const listeners=new Set();
  const update=patch=>{state={...state,...patch};listeners.forEach(fn=>fn());};
  const append=message=>update({messages:[...state.messages,message].slice(-40)});
  const cancel=()=>{sequence++;request?.abort();request=null;update({busy:false});};
  const stopGuide=()=>{scene?.engine.pauseGuide?.();guidePose=scene?.engine.getGuidePosition?.()||guidePose;};
  return {
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>state,
    setMode:mode=>update({mode}),
    setNavigator(fn){navigate=fn;return()=>{if(navigate===fn)navigate=null;};},
    setCityMode(fn){cityMode=fn;if(state.location==='city'&&state.tour?.phase==='starting')fn();return()=>{if(cityMode===fn)cityMode=null;};},
    setLocation(location){
      if(location===state.location)return;update({location});if(!state.tour)return;
      if(state.tour.project===location){update({tour:{...state.tour,phase:'inside',nearby:false}});append({role:'assistant',text:projectFacts(location).try,actions:[{type:'project',project:location}],sources:[location]});}
      else if(location!=='city'){update({tour:{...state.tour,phase:state.tour.phase==='paused'?'paused':'away',nearby:false}});}
      else if(state.tour.phase!=='paused'){update({tour:{...state.tour,phase:'starting',nearby:false}});}
    },
    attachScene(engine,location){
      scene={engine,location};if(location==='city')engine.restoreGuide?.(guidePose);
      return()=>{if(scene?.engine===engine){guidePose=engine.getGuidePosition?.()||guidePose;scene=null;if(['walking','arrived'].includes(state.tour?.phase))update({tour:{...state.tour,phase:'starting',nearby:false}});}};
    },
    open(){stopGuide();if(['walking','starting'].includes(state.tour?.phase))update({tour:{...state.tour,phase:'paused'}});update({open:true,error:''});},
    close(){update({open:false});},cancel,
    clear(){cancel();stopGuide();update({messages:[{role:'assistant',text:INTRO,actions:[{type:'tour',project:null}],sources:[]}],project:null,tour:null,error:''});},
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
      if(action.type==='enter'){if(state.tour?.project===action.project&&state.location==='city'&&!state.tour.nearby){update({error:'Подойдите ко входу самостоятельно. Гид покажет дорогу и подождёт.'});return;}cancel();update({open:false,project:action.project});navigate?.(action.project);return;}
      const project=action.type==='tour'?TOUR_ORDER[0]:action.project;
      this.startRoute(project,action.type==='tour'?0:null);
    },
    startRoute(project,index=null){
      if(!projectFacts(project))return;
      cancel();stopGuide();update({open:false,project,tour:{project,index,phase:state.location==='city'?'starting':'away',nearby:false}});
      if(state.location==='city')cityMode?.();
    },
    beginRoute(){
      if(state.open||!scene||scene.location!=='city'||state.tour?.phase!=='starting')return;
      if(!scene.engine.getGuidePosition?.())return;
      const ok=scene.engine.walkGuideTo(state.tour.project);update({tour:{...state.tour,phase:ok?'walking':'paused'},error:ok?'':'Гид не нашёл свободный путь. Попробуйте другой проект.'});
    },
    position(pose){
      if(!pose)return;guidePose=pose;
      if(!state.tour||!['walking','arrived'].includes(state.tour.phase))return;
      const phase=['walking','arrived','paused'].includes(pose.phase)?pose.phase:state.tour.phase,nearby=phase==='arrived'&&!!pose.canEnter;
      if(phase!==state.tour.phase||nearby!==state.tour.nearby)update({tour:{...state.tour,phase,nearby}});
    },
    pause(){stopGuide();if(state.tour)update({tour:{...state.tour,phase:'paused',nearby:false}});},
    resume(){if(state.tour)this.startRoute(state.tour.project,state.tour.index);},
    next(){const index=(state.tour?.index??-1)+1;if(index>=TOUR_ORDER.length){this.stopTour();this.open();append({role:'assistant',text:'Экскурсия завершена. Что обсудим подробнее?',actions:[],sources:[]});}else this.startRoute(TOUR_ORDER[index],index);},
    stopTour(){stopGuide();update({tour:null,error:''});},
  };
}
export const guide=createGuideStore();
