import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Camera,CheckCircle,ClipboardText,ClockCounterClockwise,FirstAid,Footprints,Package,Play,UserSwitch,X} from '@phosphor-icons/react';
import {SHELVES} from './catalog.js';
import {DEMO_ROLES,DEMO_STEPS,PORTIONS,availableReport,campaignStep,demoMonths,monthLabel,recommendedRole} from './pharmacyDemo.js';
import {PharmacyBotControls} from './PharmacyBotControls.jsx';

const money=value=>new Intl.NumberFormat('ru-RU').format(value)+' ₸';
const instruction=[
  'Выберите рекламное место, месяц и размер размещения.',
  'Администратор проверяет заявку и согласует место.',
  'Управляющий превращает согласованную заявку в задание сотруднику.',
  'Подойдите к выбранной полке и установите рекламную выкладку.',
  'Сделайте снимок 3D-полки и отправьте фотоотчёт.',
  'Проверьте выкладку: примите отчёт или верните на пересъёмку.',
  'Рекламодатель получает подтверждённый результат кампании.',
];

export function PharmacyExperience({state,dispatch,selectedShelf,onSelectShelf,open,onOpen,onClose,onLeave,api,onNotice,nearShelf,botView,viewControls}){
  const [campaign,setCampaign]=useState('Забота каждый день'),[month,setMonth]=useState(()=>demoMonths()[0]),[portion,setPortion]=useState('whole');
  const [reason,setReason]=useState('Нужен новый снимок выкладки крупным планом.'),[history,setHistory]=useState(false),[reset,setReset]=useState(false),[capturing,setCapturing]=useState(false);
  const [photoView,setPhotoView]=useState('overview');
  const panelRef=useRef(null),step=campaignStep(state),role=DEMO_ROLES.find(r=>r.id===state.role),nextRole=recommendedRole(state);
  const shelf=SHELVES.find(s=>s.id===(state.request?.shelf||selectedShelf))||SHELVES[1],report=availableReport(state);
  const ownStep=state.role===nextRole,complete=state.report?.status==='approved';
  const automatic=state.automation.mode==='auto',watching=automatic&&state.request&&!complete;
  useEffect(()=>{if(open)panelRef.current?.focus();},[open]);
  const run=(type,extra={})=>dispatch({type,...extra});
  const control=options=>run('AUTO_CONFIG',options);
  const takeover=()=>{control({mode:'manual',paused:false,follow:false});onOpen();};
  const resume=()=>{control({mode:'auto',paused:false});onClose();};
  useEffect(()=>{if(state.request&&automatic)onClose();},[state.request?.createdAt]);
  const go=()=>{onSelectShelf(shelf.id);onClose();setTimeout(()=>{if(api.current?.navigate(shelf))onNotice('Идём к полке '+shelf.id+'. Рядом нажмите E.');},0);};
  async function capture(){
    setCapturing(true);
    try{const image=await api.current?.captureShelf(shelf.id,{detail:photoView==='detail'});if(!image)throw new Error('Сцена ещё загружается. Попробуйте через несколько секунд.');run('CAPTURE',{image});}
    catch(e){onNotice(e.message);}finally{setCapturing(false);}
  }
  return <>
    <div className="pharmacy-hud"><div className="pharmacy-topline">
    <header className="pharmacy-header floating"><button aria-label="Вернуться в город" onClick={onLeave}><ArrowLeft size={21}/><strong>Аптечная CRM</strong></button><span>Живое демо</span></header>
    <div className="pharmacy-role floating"><UserSwitch size={18}/>{automatic?<><strong>Вы — заказчик</strong><span className="bot-mode-chip">Команда ботов</span></>:<><label htmlFor="demo-role">Вы смотрите как</label><select aria-label="Вы смотрите как" id="demo-role" value={state.role} onChange={e=>run('ROLE',{role:e.target.value})}>{DEMO_ROLES.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></>}</div>
    {viewControls}
    </div>
    <nav className="campaign-progress floating" aria-label="Путь рекламной кампании">{DEMO_STEPS.map((label,i)=><span key={label} className={(i<step||complete?'done ':'')+(i===step?'current':'')} aria-current={i===step?'step':undefined}><b>{i<step||complete?<Check size={12} weight="bold"/>:i+1}</b><span>{label}</span></span>)}</nav>
    </div>
    {!open&&watching?<aside className="campaign-card bot-process-card floating" aria-label="Автоматическое выполнение заявки"><PharmacyBotControls state={state} view={botView} onControl={control} onTakeControl={takeover}/><button className="bot-details" onClick={()=>{setHistory(false);onOpen();}}>Заявка и история<ArrowRight size={15}/></button></aside>:!open&&<aside className="campaign-card floating" aria-label="Сценарий рекламной кампании">
      <div className="campaign-kicker"><span>{complete?'КАМПАНИЯ ЗАВЕРШЕНА':`ШАГ ${step+1} ИЗ 7`}</span><button onClick={()=>{setHistory(true);onOpen();}} aria-label="История кампании"><ClockCounterClockwise size={20}/></button></div>
      <h1>{complete?'Команда выполнила заявку':DEMO_STEPS[step]}</h1><p>{automatic&&!state.request?'Выберите место для рекламы. Согласование, выкладку и фотоотчёт выполнит команда ботов.':instruction[step]}</p>
      <div className="campaign-place"><FirstAid size={25} weight="duotone"/><div><strong>{shelf.name}</strong><small>{state.request?state.request.campaign:shelf.size+' · рекламное место'}</small></div><span>{state.request?money(state.request.price):money(shelf.price)}</span></div>
      {!state.request&&<div className="shelf-switcher" aria-label="Рекламные полки">{SHELVES.map(s=><button key={s.id} aria-pressed={s.id===selectedShelf} onClick={()=>onSelectShelf(s.id)}>{s.id}</button>)}</div>}
      <button className="shelf-select" onClick={()=>{setHistory(false);onOpen();}}>{complete?'Посмотреть результат':ownStep?step===0?'Создать кампанию':'Продолжить сценарий':'Открыть рабочее место'}<ArrowRight size={18}/></button>
      {!automatic&&<button className="bot-follow" onClick={resume}><Play size={16}/>Продолжить с ботами</button>}
      <small className="campaign-local">Локальный пример · данные исчезнут при обновлении</small>
    </aside>}
    {open&&<aside className="campaign-panel floating" ref={panelRef} tabIndex={-1} aria-label="Рабочее место кампании">
      <div className="campaign-panel-head"><div><span className="campaign-kicker">{role.name}</span><h1>{history?'История кампании':DEMO_STEPS[step]}</h1></div><button aria-label="Закрыть рабочее место" onClick={onClose}><X size={21}/></button></div>
      <div className="campaign-panel-tabs"><button aria-pressed={!history} onClick={()=>setHistory(false)}>Рабочее место</button><button aria-pressed={history} onClick={()=>setHistory(true)}>История <span>{state.events.length}</span></button></div>
      <div className="campaign-panel-body">
        {state.error&&<p className="campaign-error" role="alert">{state.error}</p>}
        {history?<><p>Общая лента действий демонстрационной кампании.</p><ol className="campaign-history">{state.events.map(e=><li key={e.id}><b>{DEMO_ROLES.find(r=>r.id===e.role)?.short}</b><time>{new Date(e.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time><p>{e.text}</p></li>)}</ol>{!state.events.length&&<div className="campaign-note">Выберите место и отправьте первую заявку.</div>}{state.attempts.length>0&&<p className="campaign-muted">Попыток фотоотчёта: {state.attempts.length}. Рекламодатель видит только принятый снимок.</p>}{state.attempts.filter(a=>state.role!=='advertiser'||a.status==='approved').map(a=><details className="campaign-reshoot" key={a.number}><summary>Попытка {a.number} · {a.status==='approved'?'Принят':a.status==='rejected'?'Возвращён':'На проверке'}</summary>{a.reason&&<p>{a.reason}</p>}<Photo image={a.image}/></details>)}</>:<>
          <p>{instruction[step]}</p>
          {state.request&&<div className="campaign-summary"><div><span>{state.request.id}</span><strong>{state.request.campaign}</strong></div><dl><div><dt>Место</dt><dd>{shelf.name}</dd></div><div><dt>Объём</dt><dd>{PORTIONS[state.request.portion]}</dd></div><div><dt>Период</dt><dd>{monthLabel(state.request.month)}</dd></div><div><dt>Демо-стоимость</dt><dd>{money(state.request.price)}</dd></div></dl><div className="campaign-pills"><span>{state.request.status==='pending'?'Заявка: на рассмотрении':'Заявка: согласована'}</span>{state.task&&<span>{state.task.status==='done'?'Задание: выполнено':state.task.status==='open'?'Задание: выдано':'Задание: в работе'}</span>}</div></div>}
          {watching?<PharmacyBotControls state={state} view={botView} onControl={control} onTakeControl={takeover} compact/>:!ownStep&&<div className="campaign-handoff"><UserSwitch size={24}/><strong>Следующий шаг · {DEMO_ROLES.find(r=>r.id===nextRole).short}</strong><p>{state.role==='advertiser'&&!complete?'Согласование и проверку выполняет команда аптеки. Принятый отчёт появится здесь.':'Переключайте роли, чтобы увидеть весь процесс изнутри.'}</p><button className="shelf-select" onClick={()=>run('ROLE',{role:nextRole})}>Перейти к следующей роли<ArrowRight size={17}/></button></div>}
          {ownStep&&step===0&&<form onSubmit={e=>{e.preventDefault();run('REQUEST',{shelf:selectedShelf,campaign,month,portion});}}>
            <label className="campaign-field">Название кампании<input value={campaign} onChange={e=>setCampaign(e.target.value)} maxLength={80} required/></label>
            <label className="campaign-field">Рекламное место<select value={selectedShelf} onChange={e=>onSelectShelf(e.target.value)}>{SHELVES.map(s=><option key={s.id} value={s.id}>{s.name} · {s.size}</option>)}</select></label>
            <div className="campaign-form-row"><label className="campaign-field">Период<select value={month} onChange={e=>setMonth(e.target.value)}>{demoMonths().map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select></label><label className="campaign-field">Размер<select value={portion} onChange={e=>setPortion(e.target.value)}>{Object.entries(PORTIONS).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label></div>
            {automatic&&<div className="campaign-note"><Play size={19}/><span>После отправки боты выполнят остальные шаги. Можно наблюдать, поставить на паузу или взять управление.</span></div>}<div className="campaign-total"><span>Демонстрационная стоимость</span><strong>{money(shelf.price*(portion==='whole'?1:.5))}</strong></div><button className="shelf-select" type="submit">Отправить заявку<ArrowRight size={18}/></button>
          </form>}
          {ownStep&&step===1&&<><div className="campaign-note"><CheckCircle size={20}/>В этом сценарии выбранное место свободно. После согласования управляющий сможет выдать задание.</div><button className="shelf-select" onClick={()=>run('APPROVE_REQUEST')}>Согласовать заявку<Check size={18}/></button></>}
          {ownStep&&step===2&&<><div className="campaign-task"><ClipboardText size={24}/><div><strong>Разместить рекламную выкладку</strong><p>Полка {shelf.id} · {PORTIONS[state.request.portion].toLowerCase()}<br/>Сотрудник демо-аптеки<br/>Завершение: принятый фотоотчёт</p></div></div><button className="shelf-select" onClick={()=>run('CREATE_TASK')}>Выдать задание сотруднику<ArrowRight size={18}/></button></>}
          {ownStep&&step===3&&<><div className="campaign-task"><Package size={25}/><div><strong>Задание TASK-001</strong><p>Установите демонстрационный стенд «{state.request.campaign}». Изменение сразу появится в 3D.</p></div></div>{nearShelf!==shelf.id?<button className="shelf-select" onClick={go}>Подойти к полке {shelf.id}<Footprints size={19}/></button>:<button className="shelf-select" onClick={()=>run('INSTALL')}>Установить рекламную выкладку<Package size={19}/></button>}<p className="campaign-muted">Дойдите до выделенной полки и нажмите E. Можно управлять персонажем вручную.</p></>}
          {ownStep&&step===4&&<><label className="campaign-field">Ракурс снимка<select value={photoView} onChange={e=>setPhotoView(e.target.value)}><option value="overview">Полка целиком</option><option value="detail">Выкладка крупным планом</option></select></label>{state.report?.reason&&<div className="campaign-return"><strong>Нужна пересъёмка</strong><p>{state.report.reason}</p><small>Предыдущая попытка сохранена в истории.</small></div>}{report?.image?<><Photo image={report.image}/><button className="shelf-select" onClick={()=>run('SUBMIT_REPORT')}>Отправить фотоотчёт<ArrowRight size={18}/></button><button className="campaign-secondary" disabled={capturing} onClick={capture}>Снять ещё раз</button></>:<><div className="campaign-note"><Camera size={24}/>Снимок создаётся из текущей 3D-сцены. Камера устройства не используется.</div><button className="shelf-select" disabled={capturing} onClick={capture}>{capturing?'Создаём снимок…':'Сделать снимок полки'}<Camera size={19}/></button></>}</>}
          {ownStep&&step===5&&<><Photo image={report.image}/><div className="campaign-checklist"><span><Check size={15}/>Полка {shelf.id}</span><span><Check size={15}/>{PORTIONS[state.request.portion]}</span><span>Попытка {state.attempts.length}</span></div><button className="shelf-select" onClick={()=>run('APPROVE_REPORT')}>Принять фотоотчёт<CheckCircle size={19}/></button><details className="campaign-reshoot"><summary>Вернуть на пересъёмку</summary><label className="campaign-field">Причина возврата<textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={5} maxLength={200} rows={3}/></label><button className="campaign-secondary" disabled={reason.trim().length<5} onClick={()=>run('REJECT_REPORT',{reason})}>Вернуть сотруднику</button></details></>}
          {ownStep&&step===6&&<><div className="campaign-success"><CheckCircle size={28} weight="duotone"/><div><strong>Размещение подтверждено отчётом</strong><small>Согласовано → размещено → проверено</small></div></div><Photo image={report.image}/><p>Реклама на полке {shelf.id}. Проверяющий принял фотоотчёт, задание сотрудника закрыто.</p><button className="campaign-secondary" onClick={()=>setHistory(true)}>Весь путь кампании<ClockCounterClockwise size={17}/></button></>}
        </>}
        {!automatic&&<button className="bot-follow" onClick={resume}><Play size={16}/>Продолжить с ботами</button>}
        {automatic&&!state.request&&<button className="campaign-reset" onClick={takeover}>Пройти все роли вручную</button>}
        {complete&&<button className="campaign-secondary" onClick={()=>{run('RESET',{scenario:'reshoot'});setHistory(false);setPhotoView('overview');onSelectShelf('A-02');}}>Новая кампания с пересъёмкой<Camera size={17}/></button>}
        <div className="campaign-demo-footnote">Локальная демонстрация: боты действуют по заданному сценарию. Без оплаты, реальной брони и подключения к CRM. «Проверяющий» — управляющий в режиме проверки.</div>
        {reset?<div className="campaign-reset-confirm"><p>Очистить только этот локальный сценарий?</p><button onClick={()=>{run('RESET');setReset(false);setHistory(false);setPhotoView('overview');setCampaign('Забота каждый день');setMonth(demoMonths()[0]);setPortion('whole');onSelectShelf('A-02');}}>Да, начать заново</button><button onClick={()=>setReset(false)}>Отмена</button></div>:<button className="campaign-reset" onClick={()=>setReset(true)}><ClockCounterClockwise size={15}/>Начать заново</button>}
      </div>
    </aside>}
    {!open&&<div className="pharmacy-keys floating"><span><kbd>WASD</kbd> — ходить</span><span><kbd>E</kbd> — полка</span><span><Play size={12}/> 7 шагов одной кампании</span></div>}
  </>;
}
function Photo({image}){return <figure className="campaign-photo"><img src={image} alt="Демонстрационный снимок рекламной выкладки на 3D-полке"/><figcaption><Camera size={13}/>Снимок 3D-сцены · учебный фотоотчёт</figcaption></figure>;}
