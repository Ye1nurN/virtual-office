import React,{useEffect,useReducer,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUp,ArrowDown,ArrowsOut,ArrowsIn,Eye,Footprints,Minus,Plus,Crosshair,Pause,Play,X,ShieldCheck,CheckCircle,WarningCircle,Broadcast,House,Lightbulb,Keyboard,DownloadSimple,ArrowCounterClockwise,Question} from '@phosphor-icons/react';
import {createObservationScene} from './scene.js';
import {METERS,ROWS,createExperiment,experimentReducer,experimentReport} from './experiment.js';
import './observatory.css';

let retainedExperiment=null;
export default function ArgusObservatory({onLeave,onCameraMode,cameraMode='overview'}){
  const [state,dispatch]=useReducer(experimentReducer,undefined,()=>retainedExperiment?{...retainedExperiment,panel:null}:createExperiment()),[loading,setLoading]=useState(0),[error,setError]=useState(''),[zoom,setZoom]=useState(100),[mode,setMode]=useState(cameraMode),[expanded,setExpanded]=useState(true),[hint,setHint]=useState(null),[notice,setNotice]=useState('');
  const host=useRef(null),api=useRef(null),dialog=useRef(null),callbacks=useRef(null);
  callbacks.current={onLeave,onCameraMode};
  const selected=METERS.find(m=>m.id===state.selected);
  function action(action){if(action==='exit')callbacks.current.onLeave();else dispatch({type:'OPEN',panel:action});}
  useEffect(()=>{
    const engine=createObservationScene(host.current,{onLoading:setLoading,onError:setError,onHint:setHint,onSelect:id=>dispatch({type:'SELECT',id}),onAction:action,onNotice:setNotice,onZoom:setZoom,onCamera:m=>{setMode(m);callbacks.current.onCameraMode?.(m);}});
    api.current=engine;engine.update(state);if(cameraMode==='first-person')engine.mode(cameraMode);
    return()=>{api.current=null;engine.dispose();};
  },[]);
  useEffect(()=>{retainedExperiment=state;api.current?.update(state);api.current?.enable(!state.panel);},[state]);
  useEffect(()=>{
    if(!state.panel)return;
    const previous=document.activeElement;dialog.current?.focus();
    return()=>{if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[state.panel]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3600);return()=>clearTimeout(timer);},[notice]);
  function close(){dispatch({type:'CLOSE'});}
  function trap(e){
    if(e.key==='Escape'){e.stopPropagation();close();return;}
    if(e.key!=='Tab')return;const items=[...dialog.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled)')],first=items[0],last=items.at(-1);
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
  function report(){const data=experimentReport(state);if(!data)return;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='argus-investigation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const openNodes=()=>dispatch({type:'OPEN',panel:'nodes'});
  return <section className="observatory" data-expanded={expanded} aria-label="Центр наблюдения ARGUS">
    <div className="observatory-scene" ref={host}/>
    <header className="ob-header">
      <div className="ob-title"><button onClick={onLeave} aria-label="Вернуться в город"><ArrowLeft size={20}/><strong>ARGUS</strong></button><span className="ob-badge">Симуляция</span><span className="ob-heading">Центр наблюдения</span></div>
      <div className="ob-controls">
        <button aria-label={state.paused?'Продолжить поток':'Приостановить поток'} aria-pressed={state.paused} onClick={()=>dispatch({type:'PAUSE'})}>{state.paused?<Play size={20}/>:<Pause size={20}/>}</button>
        <button aria-label={mode==='overview'?'Вид от первого лица':'Вид сверху'} aria-pressed={mode==='first-person'} onClick={()=>api.current?.mode(mode==='overview'?'first-person':'overview')}>{mode==='overview'?<Eye size={21}/>:<Footprints size={21}/>}</button>
        {mode==='overview'&&<div className="ob-zoom"><button aria-label="Уменьшить масштаб" disabled={zoom<=75} onClick={()=>api.current?.zoom(-.1)}><Minus size={17}/></button><button aria-label="Сбросить масштаб" onClick={()=>api.current?.reset()}>{zoom}%</button><button aria-label="Увеличить масштаб" disabled={zoom>=175} onClick={()=>api.current?.zoom(.1)}><Plus size={17}/></button></div>}
        <button aria-label={expanded?'Показать навигацию портфолио':'Развернуть лабораторию'} aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?<ArrowsIn size={20}/>:<ArrowsOut size={20}/>}</button>
      </div>
    </header>
    {loading!==null&&!error&&<div className="ob-loading" role="status"><Broadcast size={26}/><h2>Готовим лабораторию</h2><progress max="100" value={loading}/><span>{loading}%</span></div>}
    {error&&<div className="ob-loading" role="alert"><WarningCircle size={26}/><h2>Не удалось открыть лабораторию</h2><p>{error}</p><button className="ob-primary" onClick={()=>location.reload()}>Повторить</button></div>}
    {loading===null&&!error&&<>
      <div className="ob-assistant"><button onClick={()=>dispatch({type:'OPEN',panel:'help'})}><Lightbulb size={19}/><span>Спросить аналитика</span></button></div>
      {hint&&!state.panel&&<button className="ob-world-action" onClick={()=>api.current?.interact()}><kbd>E</kbd>{hint.title}</button>}
      <div className="ob-task" aria-label="Текущая задача"><span className={'ob-task-icon'+(state.complete?' solved':'')}>{state.complete?<CheckCircle size={26}/>:<Crosshair size={26}/>}</span><div><small>{state.complete?'РАССЛЕДОВАНИЕ ЗАВЕРШЕНО':state.paused?'ПОТОК НА ПАУЗЕ':'ВАША ЗАДАЧА'}</small><strong>{state.complete?'Источник повтора подтверждён':'Проверьте источник подозрительного потока'}</strong></div><button className="ob-primary" onClick={()=>state.complete?dispatch({type:'RESULT'}):openNodes()}>{state.complete?'Результат':'Выбрать узел'}<ArrowRight size={17}/></button></div>
      <div className="ob-keys"><Keyboard size={16}/><span>{mode==='overview'?'WASD · ходить   E · действие':'WASD · ходить   Потяните сцену · осмотр'}</span><button onClick={()=>dispatch({type:'OPEN',panel:'help'})} aria-label="Помощь"><Question size={18}/></button></div>
      <div className="ob-touch" aria-label="Управление персонажем">{[[0,-1,ArrowUp,'вперёд'],[-1,0,ArrowLeft,'влево'],[0,1,ArrowDown,'назад'],[1,0,ArrowRight,'вправо']].map(([x,z,Icon,label])=><button key={label} aria-label={'Идти '+label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);api.current?.direction(x,z);}} onPointerUp={()=>api.current?.direction(0,0)} onPointerCancel={()=>api.current?.direction(0,0)} onLostPointerCapture={()=>api.current?.direction(0,0)}><Icon size={19}/></button>)}</div>
    </>}
    {notice&&<div className="ob-notice" role="status">{notice}</div>}
    {state.panel&&<div className="ob-modal-layer"><button className="ob-backdrop" aria-label="Закрыть исследование" onClick={close} tabIndex={-1}/><section className="ob-dialog" role="dialog" aria-modal="true" aria-labelledby="ob-dialog-title" ref={dialog} tabIndex={-1} onKeyDown={trap}>
      <header className="ob-dialog-head"><div><small>{state.panel==='help'?'ПОМОЩЬ АНАЛИТИКА':state.panel==='result'?'РЕЗУЛЬТАТ ПРОВЕРКИ':'ИССЛЕДОВАНИЕ СЕТИ'}</small><h1 id="ob-dialog-title">{state.panel==='nodes'?'Выберите счётчик':state.panel==='help'?'Как устроен эксперимент':state.panel==='result'?'Вы нашли повтор':'Счётчик '+selected?.id}</h1></div><button aria-label="Закрыть панель" onClick={close}><X size={22}/></button></header>
      <div className="ob-dialog-content">
        {state.panel==='nodes'&&<><p>Выберите узел здесь или нажмите на него на большом экране. У каждого счётчика — свой фрагмент потока.</p><div className="ob-node-list">{METERS.map(m=><button key={m.id} onClick={()=>dispatch({type:'SELECT',id:m.id})}><span className={m.suspect?'ob-node-icon suspect':'ob-node-icon'}><House size={25}/></span><span><strong>Счётчик {m.id}</strong><small>{m.house}</small></span><span className={m.suspect?'ob-node-state suspect':'ob-node-state'}>{m.suspect?'Есть сигнал':state.checked.includes(m.id)?'Проверен':'В сети'}</span><ArrowRight size={17}/></button>)}</div><div className="ob-explanation"><Broadcast size={19}/><p>Счётчики передают показания через шлюз. ARGUS помогает заметить подозрительные события в этом потоке.</p></div></>}
        {state.panel==='inspect'&&<><div className="ob-inspect-intro"><span className={selected?.suspect?'ob-status suspect':'ob-status'}>{selected?.suspect?'Подозрительный поток':'Обычная телеметрия'}</span><p>{selected?.house} · gateway-002</p></div><h2>{selected?.suspect?'Какие два сообщения повторяются?':'Проверьте сообщения узла'}</h2><p>{selected?.suspect?'Отметьте два совпадающих сообщения. Сравните номер, время и показание.':'Номера должны идти по порядку, а время — изменяться.'}</p><div className="ob-message-table"><div className="ob-table-labels"><span/><span>Номер</span><span>Время</span><span>кВт·ч</span></div>{ROWS[state.selected].map(row=><label className={state.rows.includes(row.id)?'selected':''} key={row.id}><input type="checkbox" aria-label={'Сообщение '+row.id+', номер '+row.sequence+', '+row.time} checked={state.rows.includes(row.id)} disabled={state.complete} onChange={()=>dispatch({type:'ROW',id:row.id})}/><span>{row.sequence}</span><span>{row.time}</span><span>{row.reading}</span></label>)}</div><small className="ob-table-caption">Подготовленные сообщения · значения синтетические</small>{state.feedback&&<p className={'ob-feedback '+state.feedback.kind} role={state.feedback.kind==='error'?'alert':'status'}>{state.feedback.text}</p>}{!state.complete&&<button className="ob-primary full" onClick={()=>dispatch({type:'CHECK'})}>{selected?.suspect?'Проверить выбор':'Проверить этот узел'}<ShieldCheck size={18}/></button>}{state.hint&&<div className="ob-explanation"><Lightbulb size={21}/><p>{selected?.suspect?'Проверьте, не пришло ли старое сообщение повторно. Одного совпадения показаний мало: сравните ещё номер и время.':'У исправного счётчика каждое сообщение имеет новый номер и время. Одинаковое показание само по себе не доказывает повтор.'}</p></div>}<div className="ob-text-actions"><button onClick={()=>dispatch({type:'HINT'})}><Lightbulb size={17}/>{state.hint?'Скрыть подсказку':'Подсказка аналитика'}</button><button onClick={openNodes}>Другой узел<ArrowRight size={16}/></button></div></>}
        {state.panel==='result'&&<><div className="ob-success"><CheckCircle size={48} weight="duotone"/><span>Счётчик 031 · повтор сообщения</span></div><p>Сообщение <strong>1042</strong> с временем <strong>10:24:01</strong> и показанием <strong>18,6</strong> пришло дважды. Вы подтвердили сигнал по самим данным.</p><div className="ob-result-evidence"><span>Найденный признак</span><strong>Совпадают номер, время и показание</strong><span>Результат учебного сценария</span><strong>Replay · повторная отправка</strong></div><div className="ob-explanation"><ShieldCheck size={22}/><p>ARGUS-AMI исследует обнаружение атак в AMI-сетях. Здесь вы разобрали подготовленный пример: модель и реальная сеть не подключены, устройства не блокировались.</p></div><button className="ob-primary full" onClick={report}><DownloadSimple size={19}/>Скачать разбор</button><div className="ob-text-actions"><button onClick={()=>dispatch({type:'RESET'})}><ArrowCounterClockwise size={17}/>Пройти ещё раз</button><a href="https://github.com/Ye1nurN/argus-ami-ids" target="_blank" rel="noreferrer">Исходный проект<ArrowRight size={17}/></a></div></>}
        {state.panel==='help'&&<><div className="ob-explanation"><Lightbulb size={23}/><p>«Посмотрите, какие сообщения пришли от одного устройства. Повтор номера и старого времени поможет проверить сигнал».</p></div><h2>Три действия</h2><ol className="ob-help-list"><li><strong>Выберите счётчик</strong><span>Нажмите на узел большого экрана или кнопку «Выбрать узел».</span></li><li><strong>Сравните сообщения</strong><span>Отметьте два совпадающих сообщения и проверьте выбор.</span></li><li><strong>Посмотрите результат</strong><span>Разберите доказательство и сохраните отчёт.</span></li></ol><p>WASD / ЦФЫВ / стрелки — движение. Shift — быстрее. E / У — действие рядом с консолью, аналитиком или выходом. V / М — вид от первого лица. Esc — закрыть панель.</p><p className="ob-disclosure">Это локальная симуляция на синтетических данных. Она показывает принцип исследования, а не запускает модель ARGUS или атаку на настоящую сеть.</p><button className="ob-primary full" onClick={openNodes}>К исследованию<ArrowRight size={18}/></button></>}
      </div>
    </section></div>}
  </section>;
}
