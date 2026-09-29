import React,{useEffect,useRef,useSyncExternalStore} from 'react';
import {ChatCircleText,X,ArrowRight,PaperPlaneTilt,Footprints,Pause,Play,ArrowClockwise,MapTrifold,BookOpen} from '@phosphor-icons/react';
import {guide} from './guideStore.js';
import {STARTERS,GUIDE_FACTS,actionLabel,projectFacts} from './knowledge.js';
import './guide.css';

export const useGuide=()=>useSyncExternalStore(guide.subscribe,guide.getSnapshot);
function Portrait(){return <span className="guide-portrait" aria-hidden="true"><span className="guide-hair"/><span className="guide-face"/><span className="guide-shirt"/><span className="guide-badge">i</span></span>;}
export function GuideOverlay(){
  const state=useGuide(),dialog=useRef(null),input=useRef(null),end=useRef(null),draft=useRef(null);
  useEffect(()=>{const controller=new AbortController();fetch('/api/guide',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(!controller.signal.aborted)guide.setMode(data?.mode==='ai'?'ai':'local');}).catch(()=>{if(!controller.signal.aborted)guide.setMode('local');});return()=>controller.abort();},[]);
  useEffect(()=>{if(!state.open)return;const previous=document.activeElement;dialog.current.showModal();input.current?.focus();return()=>{dialog.current?.close();if(previous?.isConnected)previous.focus?.();};},[state.open]);
  useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[state.messages,state.busy,state.open]);
  useEffect(()=>{if(!state.open){const frame=requestAnimationFrame(()=>guide.beginRoute());return()=>cancelAnimationFrame(frame);}},[state.open,state.location,state.tour?.phase]);
  useEffect(()=>{const onKey=e=>{if(state.open&&e.key==='Escape'){e.preventDefault();guide.close();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[state.open]);
  function send(e){e.preventDefault();const text=input.current.value.trim();if(!text||state.busy)return;input.current.value='';guide.send(text);}
  const tour=state.tour,p=projectFacts(tour?.project),inside=tour?.phase==='inside',arrived=tour?.phase==='arrived';
  return <div className="guide-layer">
    {!state.open&&<button className="guide-launcher" aria-label="Поговорить с гидом" onClick={()=>guide.open()}><Portrait/><span><strong>Гид по городу</strong><small>Поговорим?</small></span><ChatCircleText size={22}/></button>}
    {tour&&!state.open&&<section className="guide-route" aria-label="Маршрут с гидом"><span className="guide-route-icon"><Footprints size={21}/></span><div><small>{tour.index!==null?`ЭКСКУРСИЯ · ${tour.index+1} / 3`:'МАРШРУТ'}</small><strong>{p.name}</strong><p>{inside?'Ты внутри. Расскажу, что попробовать.':arrived?'Мы у входа. Можно заходить.':tour.phase==='paused'?'Маршрут на паузе.':tour.phase==='walking'?'Идём ко входу. WASD прерывает маршрут.':'Строю путь…'}</p>{state.error&&<p role="status">{state.error}</p>}<div className="guide-route-actions">{inside?<button onClick={()=>guide.open()}>Что попробовать?</button>:arrived?<button onClick={()=>guide.act({type:'enter',project:p.id})}>Войти<ArrowRight size={15}/></button>:tour.phase==='paused'?<button onClick={()=>guide.resume()}><Play size={14}/>Продолжить</button>:<button onClick={()=>guide.pause()}><Pause size={14}/>Пауза</button>}{tour.index!==null&&<button onClick={()=>guide.next()}>{tour.index===2?'Завершить':'Следующий проект'}</button>}</div></div><button className="guide-icon" aria-label="Завершить маршрут" onClick={()=>guide.stopTour()}><X size={17}/></button></section>}
    {state.open&&<dialog ref={dialog} className="guide-dialog" aria-labelledby="guide-title" onCancel={e=>{e.preventDefault();guide.close();}}>
      <header className="guide-heading"><Portrait/><div><h2 id="guide-title">Гид по городу</h2><span><i/>{state.mode==='ai'?'AI-собеседник':state.mode==='checking'?'Проверяем связь…':'Готовые ответы · локально'}</span></div><button className="guide-icon" aria-label="Новый разговор" title="Новый разговор" onClick={()=>guide.clear()} disabled={state.busy}><ArrowClockwise size={18}/></button><button className="guide-icon" aria-label="Закрыть разговор" onClick={()=>guide.close()}><X size={21}/></button></header>
      <div className="guide-context"><MapTrifold size={16}/><span>{projectFacts(state.location)?.name||'Центральная площадь'}</span><small>Помощник Елнура</small></div>
      <div className="guide-conversation" role="log" aria-label="Разговор с гидом" aria-live="polite" aria-relevant="additions text">
        {state.messages.map((m,i)=><article key={i} className={'guide-message '+(m.role==='user'?'guide-mine':'')}><small>{m.role==='user'?'Вы':'Гид'}</small><p>{m.text}</p>{m.sources?.length>0&&<div className="guide-sources"><BookOpen size={12}/>{m.sources.map(id=>{const p=projectFacts(id),href=id==='author'?GUIDE_FACTS.author.github:p?.github;return href?<a key={id} href={href} target="_blank" rel="noreferrer">{p?.name||'Профиль автора'}</a>:<span key={id}>{p?.name||'Сведения об авторе'}</span>;})}</div>}{m.actions?.length>0&&<div className="guide-message-actions">{m.actions.map(a=><button key={a.type+'/'+a.project} onClick={()=>guide.act(a)}>{actionLabel(a)}<ArrowRight size={14}/></button>)}</div>}</article>)}
        {state.busy&&<p className="guide-thinking" role="status">Гид готовит ответ…</p>}<div ref={end}/>
      </div>
      <div className="guide-compose">{state.messages.length<3&&<div className="guide-starters">{STARTERS.map(s=><button key={s} disabled={state.busy} onClick={()=>guide.send(s)}>{s}</button>)}</div>}{state.error&&<p className="guide-error" role="status">{state.error}</p>}
        <form onSubmit={send} ref={draft}><label htmlFor="guide-input" className="guide-sr">Сообщение гиду</label><textarea id="guide-input" ref={input} maxLength={2000} rows={2} placeholder="Спроси о проекте или просто поздоровайся…" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send(e);}}}/>{state.busy?<button type="button" className="guide-send" aria-label="Остановить ответ" onClick={()=>guide.cancel()}><Pause size={20}/></button>:<button type="submit" className="guide-send" aria-label="Отправить сообщение"><PaperPlaneTilt size={21}/></button>}</form>
        <p className="guide-footnote">{state.mode==='ai'?'Вопрос, последние реплики и место в городе отправляются в OpenAI.':'Свободная AI-беседа появится после подключения модели.'} <span>Enter — отправить</span></p>
      </div>
    </dialog>}
  </div>;
}
