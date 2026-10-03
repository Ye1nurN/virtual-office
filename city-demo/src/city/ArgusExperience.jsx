import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ShieldCheck,Pause,Play,Eye,Hand,Robot,X,Check,DownloadSimple,ClockCounterClockwise,ChatCircleText,CaretDown,CaretUp} from '@phosphor-icons/react';
import {guide} from '../guide/guideStore.js';
import {ARGUS_SCENARIOS,ARGUS_PHASES,ARGUS_STEPS,ARGUS_ACTIONS,ARGUS_ROLES,argusReport} from './argusDemo.js';

const manualHints={stream:'Соберите показания учебных счётчиков и передайте поток на стенд ARGUS.',detect:'Запросите заданный сценарием результат классификации потока.',analyze:'Сопоставьте частоту, номера последовательности и временные метки пакетов.',respond:'Выберите решение по собранным признакам. Ограничение применяется только к учебному узлу.',verify:'Проверьте поток после решения и сформируйте итоговый отчёт.'};

function Network({state}){
  const scenario=ARGUS_SCENARIOS[state.scenario],step=ARGUS_PHASES.indexOf(state.phase),risk=scenario.risk&&step>=2&&step<5;
  return <div className={'argus-network'+(risk?' alert':'')} aria-label={'Состояние сети: '+(step===0?'ожидает запуска':risk?'подозрительный поток':step>=5?'проверена':'анализируется')}>
    <div><i/><span>Счётчики</span><small>{step?'поток активен':'готовы'}</small></div><b aria-hidden="true">→</b><div><i/><span>Шлюз</span><small>{risk?'аномалия':step>=5?'проверен':'передача'}</small></div><b aria-hidden="true">→</b><div><ShieldCheck size={23}/><span>ARGUS</span><small>{step>=3?scenario.label:step===2?'проверка':'ожидание'}</small></div>
  </div>;
}
export function ArgusExperience({state,dispatch,view,onLeave,open,onOpen,onClose,viewControls}){
  const [collapsed,setCollapsed]=useState(false);
  const panel=useRef(null),scenario=ARGUS_SCENARIOS[state.scenario],step=ARGUS_PHASES.indexOf(state.phase),started=step>0,complete=state.phase==='complete',a=state.automation,action=ARGUS_ACTIONS[state.phase];
  useEffect(()=>{if(open)panel.current?.focus();},[open]);
  const control=patch=>dispatch({type:'CONTROL',...patch});
  function download(){const report=argusReport(state);if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='argus-demo-report.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const execute=decision=>dispatch({type:'MANUAL_COMMAND',command:action.command,decision});
  function manual(){control({mode:'manual',paused:false});onOpen();}
  const result=<><div className="argus-result-icon"><ShieldCheck size={26}/><span>Проверка завершена</span></div><h2>{scenario.risk?'Инцидент разобран':'Штатный поток подтверждён'}</h2><p>{scenario.result}</p><dl className="argus-facts"><div><dt>Узел</dt><dd>{scenario.node}</dd></div><div><dt>Учебная метка</dt><dd>{scenario.label}</dd></div></dl><div className="argus-evidence">{scenario.response}</div><button className="argus-primary" onClick={download}><DownloadSimple size={17}/>Скачать демо-отчёт</button></>;
  return <>
    <div className="argus-hud">
      <div className="argus-topline"><header><button onClick={onLeave} aria-label="Вернуться в город"><ArrowLeft size={19}/><strong>ARGUS</strong></button><span>AMI LAB · ДЕМО</span></header><div className="argus-role"><Robot size={18}/>{a.mode==='auto'?'Команда ботов':'Вы — '+ARGUS_ROLES[state.role].toLowerCase()}</div>{viewControls}<button className="argus-guide-button" aria-label="Поговорить с гидом" title="Гид по городу" onClick={()=>guide.open()}><ChatCircleText size={21}/></button></div>
      <nav className="argus-steps" aria-label="Этапы расследования">{ARGUS_STEPS.map((label,i)=><span key={label} className={i===step?'current':i<step?'done':''} aria-current={i===step?'step':undefined}><b>{i<step?<Check size={13}/>:i+1}</b><span>{label}</span></span>)}</nav>
    </div>
    {collapsed?<button className="argus-card-summary" aria-expanded={false} onClick={()=>setCollapsed(false)}><ShieldCheck size={18}/>Показать сценарий · {ARGUS_STEPS[step]}<CaretUp size={16}/></button>:<aside className="argus-card" aria-label="Сценарий ARGUS">
      <div className="argus-kicker"><span>{complete?'ИТОГ СЦЕНАРИЯ':started?'ЭТАП '+step+' / 5':'ЦЕНТР МОНИТОРИНГА'}</span><button className="argus-card-toggle" aria-label="Свернуть панель сценария" aria-expanded={true} onClick={()=>setCollapsed(true)}><CaretDown size={18}/></button></div>
      {!started?<><h1>Проверьте сеть</h1><p>Запустите поток. Оператор, аналитик и инженер покажут каждый шаг разбора.</p><fieldset className="argus-scenarios"><legend>Учебный сценарий</legend>{Object.entries(ARGUS_SCENARIOS).map(([id,s])=><label key={id} className={state.scenario===id?'selected':''}><input type="radio" name="argus-scenario" value={id} checked={state.scenario===id} onChange={()=>dispatch({type:'SELECT',scenario:id})}/><span><strong>{s.name}</strong><small>{s.node}</small></span></label>)}</fieldset><Network state={state}/><button className="argus-primary" onClick={()=>dispatch({type:'START'})}>Запустить сценарий<ArrowRight size={18}/></button></>:complete?result:<>
        <h1>{a.mode==='manual'?'Ручное управление':view.name||'Команда ARGUS'}</h1><p className="argus-action" role="status">{a.paused?'Сценарий на паузе':view.text||'Готовим рабочую станцию'}</p>
        <div className="argus-progress" role="progressbar" aria-label="Текущий шаг" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((view.progress||0)*100)}><i style={{width:Math.round((view.progress||0)*100)+'%'}}/></div>
        <Network state={state}/><div className="argus-node"><span>{scenario.node}</span><strong>{step>=3?scenario.label:step===2?'Анализ потока':'Сбор данных'}</strong></div>
        <div className="argus-playback"><button onClick={()=>control({paused:!a.paused})} disabled={a.mode==='manual'} aria-label={a.paused?'Продолжить работу ботов':'Приостановить работу ботов'}>{a.paused?<Play size={16}/>:<Pause size={16}/>} {a.paused?'Продолжить':'Пауза'}</button><div>{[1,2].map(speed=><button key={speed} aria-label={'Скорость '+speed+'x'} aria-pressed={a.speed===speed} onClick={()=>control({speed})}>{speed}×</button>)}</div></div>
        <button className="argus-secondary" aria-pressed={a.follow} onClick={()=>control({follow:!a.follow})}><Eye size={17}/>{a.follow?'Следим за сотрудником':'Следить за сотрудником'}</button>
        {a.mode==='auto'?<button className="argus-secondary" onClick={manual}><Hand size={17}/>Взять управление</button>:<button className="argus-primary" onClick={()=>{control({mode:'auto',paused:false});onClose();}}><Robot size={17}/>Вернуть управление ботам</button>}
      </>}
      {started&&<button className="argus-text-button" onClick={onOpen}><ClockCounterClockwise size={17}/>{a.mode==='manual'&&!complete?'Рабочая станция и журнал':'Инцидент и журнал'}<ArrowRight size={16}/></button>}
      {complete&&<button className="argus-secondary" onClick={()=>{dispatch({type:'RESET'});onClose();}}>Другой сценарий</button>}
      <small className="argus-demo-note">Локальная симуляция. Метки заданы сценарием; ML и реальная сеть не подключены. Реакция инженера — учебная иллюстрация.</small>
    </aside>}
    <div className="argus-walk-hint">WASD · ходить <span>E · открыть консоль</span></div>
    {open&&<><button className="argus-backdrop" aria-label="Закрыть рабочую станцию" tabIndex={-1} onClick={onClose}/><section className="argus-details" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Инцидент ARGUS" onKeyDown={e=>{if(e.key==='Tab'){const items=[...e.currentTarget.querySelectorAll('button:not(:disabled),select,a[href]')];if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
      <div className="argus-detail-heading"><div><small>РАБОЧАЯ СТАНЦИЯ</small><h2>{scenario.name}</h2></div><button aria-label="Закрыть инцидент" onClick={onClose}><X size={21}/></button></div>
      <div className="argus-detail-body">
        <Network state={state}/>
        {step>=3&&<><h3>Признаки события</h3><p>{scenario.evidence}</p><dl className="argus-facts"><div><dt>Пакетов / с</dt><dd>{scenario.rate}</dd></div><div><dt>Повторов</dt><dd>{scenario.repeats}</dd></div></dl><small>Числа синтетические, для демонстрации хода анализа.</small></>}
        {action&&a.mode==='manual'&&<div className="argus-manual"><label>Ваша роль<select aria-label="Роль ARGUS" value={state.role} onChange={e=>dispatch({type:'ROLE',role:e.target.value})}>{Object.entries(ARGUS_ROLES).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><h3>{ARGUS_STEPS[step]}</h3><p>{manualHints[state.phase]}</p>{step===4?<><button className="argus-primary" onClick={()=>execute('contain')}>Ограничить подозрительный поток</button><button className="argus-secondary" onClick={()=>execute('observe')}>Оставить под наблюдением</button></>:<button className="argus-primary" onClick={()=>execute()}>{action.label}<ArrowRight size={16}/></button>}<button className="argus-text-button" onClick={()=>{control({mode:'auto',paused:false});onClose();}}>Продолжить с ботами<ArrowRight size={16}/></button></div>}
        {state.error&&<p className="argus-error" role="alert">{state.error}</p>}
        {complete&&result}
        <h3>Журнал сценария</h3><ol className="argus-history">{state.events.map(e=><li key={e.id}><b>{String(e.id).padStart(2,'0')}</b><div><small>{ARGUS_ROLES[e.role]||'Вы'} · {e.source==='bot'?'бот':'вручную'}</small><p>{e.text}</p></div></li>)}</ol>
        {!started&&<p>Сначала выберите сценарий и запустите поток.</p>}
        <div className="argus-evidence"><strong>Что показывает исходный проект</strong><p>ARGUS-AMI объединяет CNN-LSTM, FastAPI, поток событий и панель анализа AMI. Здесь показан процесс на подготовленных данных.</p><a href="https://github.com/Ye1nurN/argus-ami-ids" target="_blank" rel="noreferrer">Открыть исходный ARGUS ↗</a></div>
        {started&&!complete&&<button className="argus-text-button" onClick={()=>{dispatch({type:'RESET'});onClose();}}>Начать сценарий заново</button>}
      </div>
    </section></>}
  </>;
}
