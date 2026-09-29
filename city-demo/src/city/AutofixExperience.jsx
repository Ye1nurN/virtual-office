import React,{useReducer,useRef,useState} from 'react';
import {ChatCircleText,ArrowUpRight,ArrowRight,Car,CalendarBlank,ChartBar,Check,Crosshair,Eye,Plus,Minus,ArrowCounterClockwise} from '@phosphor-icons/react';
import {guide} from '../guide/guideStore.js';
import {CityScene} from './CityScene.jsx';
import {FirstPersonGuide} from '../world/CameraControls.jsx';
import {AUTOFIX_SITE,AUTOFIX_CARS,AUTOFIX_SERVICES,AUTOFIX_BOXES,createAutofixDemo,autofixReducer,availableAutofixSlots,autofixMetrics,timeLabel} from './autofixDemo.js';
import './autofix.css';

const money=value=>new Intl.NumberFormat('ru-RU').format(value)+' ₸';
const statusLabels={confirmed:'Запланировано','in-progress':'В работе',completed:'Завершено',cancelled:'Отменено'};

export function AutofixExperience({onLeave,cameraMode,onCameraMode}){
  const api=useRef(null),panel=useRef(null);
  const [state,dispatch]=useReducer(autofixReducer,undefined,createAutofixDemo);
  const [tab,setTab]=useState('client'),[car,setCar]=useState('sedan'),[serviceId,setService]=useState('wash'),[chosenTime,setTime]=useState(720);
  const [sceneActive,setSceneActive]=useState(false),[view,setView]=useState({zoom:100}),[notice,setNotice]=useState('');
  const service=AUTOFIX_SERVICES.find(s=>s.id===serviceId),slots=availableAutofixSlots(state,serviceId,car);
  const selected=slots.some(s=>s.start===chosenTime)?chosenTime:(slots[0]?.start??null);
  const booking=state.bookings.find(b=>b.id===state.lastCreated),metrics=autofixMetrics(state);
  function openDesk(){setTab('client');setSceneActive(false);panel.current?.focus();}
  function reset(){dispatch({type:'reset'});setTab('client');setTime(720);setNotice('Демонстрация начата заново.');}
  function book(e){e.preventDefault();dispatch({type:'book',car,service:serviceId,start:selected});setNotice('');}
  return <main className="af-experience">
    <section className="af-world engine-stage city-stage" aria-label="Детейлинг-центр в 3D" onPointerDown={()=>setSceneActive(true)}>
      <CityScene api={api} location="autofix" cameraMode={cameraMode} onCameraMode={onCameraMode} status="В детейлинге" inputEnabled={sceneActive} onAction={a=>a.type==='exit'?onLeave():openDesk()} onProject={openDesk} onNotice={setNotice} onWalk={()=>{}} onView={setView}/>
      <div className="af-world-heading"><span>ПРОЕКТ 01 / ИНТЕРАКТИВНОЕ ДЕМО</span><h1>AutoFix Hub<span>.</span></h1><p>От свободного бокса<br/>до завершённой записи.</p></div>
      <div className="af-scene-tools"><button aria-label="Камера к персонажу" onClick={()=>api.current?.reset()}><Crosshair size={18}/></button><button aria-label={cameraMode==='first-person'?'Вид сверху':'Вид от первого лица'} onClick={()=>api.current?.setCameraMode(cameraMode==='first-person'?'overview':'first-person')}><Eye size={18}/></button>{cameraMode!=='first-person'&&<><button aria-label="Уменьшить масштаб" disabled={view.zoom<=65} onClick={()=>api.current?.zoom(-.1)}><Minus size={17}/></button><button aria-label="Увеличить масштаб" disabled={view.zoom>=210} onClick={()=>api.current?.zoom(.1)}><Plus size={17}/></button></>}<button aria-label="Поговорить с гидом" onClick={()=>guide.open()}><ChatCircleText size={18}/></button><span>WASD · E</span></div>
      <FirstPersonGuide mode={cameraMode} enabled={sceneActive} api={api}/>
    </section>
    <section className="af-desk" ref={panel} tabIndex={-1} aria-label="Демонстрация AutoFix Hub" onFocusCapture={()=>setSceneActive(false)} onPointerDown={()=>setSceneActive(false)}>
      <header className="af-desk-header"><div><span className="af-eyebrow">AUTOFIX HUB / YX-1</span><h2>Попробуйте продукт</h2></div><a href={AUTOFIX_SITE} target="_blank" rel="noreferrer" aria-label="Открыть работающий сайт Uniqs Detailing">Сайт<ArrowUpRight size={17}/></a></header>
      <p className="af-disclaimer">Локальная демонстрация · все записи и суммы учебные.</p>
      <nav className="af-tabs" aria-label="Режим демонстрации">{[['client',Car,'Клиент'],['company',CalendarBlank,'Компания'],['analytics',ChartBar,'Аналитика']].map(([id,Icon,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</nav>
      <div className="af-desk-body">
      {tab==='client'&&<>
        <div className="af-step-heading"><span>01</span><div><h3>Запись на детейлинг</h3><p>Выберите авто, услугу и свободное время.</p></div></div>
        <form onSubmit={book}>
          <fieldset><legend>Ваш автомобиль</legend><div className="af-options">{AUTOFIX_CARS.map(c=><button type="button" key={c.id} aria-pressed={car===c.id} onClick={()=>setCar(c.id)}><Car size={24}/>{c.name}</button>)}</div></fieldset>
          <label className="af-select">Услуга<select value={serviceId} onChange={e=>setService(e.target.value)}>{AUTOFIX_SERVICES.map(s=><option key={s.id} value={s.id}>{s.name} · {s.minutes} мин</option>)}</select></label>
          <fieldset><legend>Свободное время <small>Демонстрационный день</small></legend><div className="af-slots">{slots.map(s=><button type="button" key={s.start} aria-pressed={selected===s.start} onClick={()=>setTime(s.start)}>{timeLabel(s.start)}<small>{s.boxes.length===2?'2 бокса':'1 бокс'}</small></button>)}</div>{!slots.length&&<p className="af-empty">Для этого автомобиля и услуги свободного времени нет. Выберите другую услугу или отмените запись в кабинете компании.</p>}</fieldset>
          <div className="af-book-summary"><span>{service.name}<small>{service.minutes} минут · свободный бокс автоматически</small></span><strong>{money(service.price)}</strong></div>
          <button type="submit" className="af-primary" disabled={selected===null}>Записаться в демо<ArrowRight size={18}/></button>
        </form>
        {state.error&&<p className="af-error" role="alert">{state.error}</p>}
        {booking&&<div className="af-success" role="status"><Check size={20}/><div><strong>{statusLabels[booking.status]} · {timeLabel(booking.start)}</strong><p>{booking.carName} · {AUTOFIX_BOXES[booking.box]}</p><button onClick={()=>setTab('company')}>Посмотреть со стороны компании<ArrowRight size={16}/></button></div></div>}
      </>}
      {tab==='company'&&<>
        <div className="af-step-heading"><span>02</span><div><h3>Рабочий день компании</h3><p>Начните и завершите работу — аналитика обновится.</p></div></div>
        <div className="af-booking-list">{[...state.bookings].sort((a,b)=>a.start-b.start).map(b=><article key={b.id} className={'af-booking af-status-'+b.status}>
          <div className="af-booking-top"><strong>{timeLabel(b.start)} — {timeLabel(b.start+b.minutes)}</strong><span>{statusLabels[b.status]}</span></div>
          <h4>{b.name}</h4><p>{b.carName} · {AUTOFIX_BOXES[b.box]}{!b.sample&&' · ваша запись'}</p>
          <div className="af-booking-bottom"><strong>{money(b.price)}</strong><div>{b.status==='confirmed'&&<button onClick={()=>dispatch({type:'status',id:b.id,status:'in-progress'})}>Начать работу</button>}{b.status==='in-progress'&&<button onClick={()=>dispatch({type:'status',id:b.id,status:'completed'})}>Завершить</button>}{['confirmed','in-progress'].includes(b.status)&&<button className="af-cancel" onClick={()=>dispatch({type:'status',id:b.id,status:'cancelled'})}>Отменить</button>}</div></div>
        </article>)}</div><button className="af-primary" onClick={()=>setTab('analytics')}>Посмотреть аналитику<ChartBar size={18}/></button>
      </>}
      {tab==='analytics'&&<>
        <div className="af-step-heading"><span>03</span><div><h3>Результат в цифрах</h3><p>Показатели рассчитаны из записей этого демо.</p></div></div>
        <div className="af-metrics"><article><span>Всего записей</span><strong>{metrics.total}</strong></article><article><span>Завершено</span><strong>{metrics.completed}</strong></article><article><span>Отменено</span><strong>{metrics.cancelled}</strong></article><article><span>Учебная выручка</span><strong>{money(metrics.revenue)}</strong></article></div>
        <div className="af-utilization"><h4>Загрузка боксов</h4><p>Занятые часы из 8-часового рабочего дня.</p>{AUTOFIX_BOXES.map((box,i)=><div key={box}><span>{box}<strong>{metrics.utilization[i]}%</strong></span><meter min="0" max="100" value={metrics.utilization[i]} aria-label={'Загрузка '+box}/></div>)}</div>
        <p className="af-insight">Завершение записи увеличивает учебную выручку. Отмена освобождает время для новой записи.</p><button className="af-primary" onClick={()=>setTab('client')}>Создать ещё одну запись<Plus size={18}/></button>
      </>}
      </div>
      <footer className="af-desk-footer"><button onClick={reset}><ArrowCounterClockwise size={16}/>Сбросить демо</button><a href={AUTOFIX_SITE} target="_blank" rel="noreferrer">Uniqs Detailing<ArrowUpRight size={16}/></a></footer>
      {notice&&<p className="af-notice" role="status">{notice}</p>}
    </section>
  </main>;
}
