import {ProjectFrame} from '../portfolio/ProjectFrame.jsx';
import {portfolioUrl} from '../portfolio/content.js';
import React,{useEffect,useRef,useState,useReducer,Suspense,lazy} from 'react';
import {guide} from '../guide/guideStore.js';
import {AutofixExperience} from './AutofixExperience.jsx';
import {PortfolioCity} from '../portfolio/PortfolioCity.jsx';
import {Car,Buildings,CaretDown,MagnifyingGlass,Bell,Microphone,MicrophoneSlash,VideoCamera,VideoCameraSlash,ChatCircleText,MonitorArrowUp,Minus,Plus,Crosshair,X,ArrowUpRight,ArrowLeft,ArrowRight,Check,MapTrifold,Keyboard,Tree,FirstAid,ShieldCheck,PaperPlaneTilt,Sun,Info,GithubLogo,Footprints} from '@phosphor-icons/react';
import {CameraToggle,FirstPersonGuide} from '../world/CameraControls.jsx';
import {CityScene} from './CityScene.jsx';
import {PharmacyExperience} from './PharmacyExperience.jsx';
import {createPharmacyDemo,pharmacyDemoReducer} from './pharmacyDemo.js';
import {createPharmacyDirector} from './pharmacyDirector.js';
import {PROJECTS,RESERVE_PLOTS,SHELVES,CITY_SPAWN,getProject,spawnOutside} from './catalog.js';
import '../office.css';
import '../reference-ui.css';
import '../world/world.css';
import './city.css';
import './pharmacy.css';
import './pharmacy-demo.css';
import './pharmacy-bots.css';

const Office=lazy(()=>import('../App.jsx').then(m=>({default:m.App})));
const validPlaces=new Set(['city',...PROJECTS.map(p=>p.id)]);
const iconFor={office:Buildings,pharmacy:FirstAid,argus:ShieldCheck,autofix:Car};
function initialPlace(){const id=new URLSearchParams(window.location.search).get('place');return validPlaces.has(id)?id:'city';}
function Avatar(){return <span className="avatar avatar-reference" aria-hidden="true" style={{'--avatar-size':'34px',width:34,height:34}}/>;}
function IconButton({label,children,active,...props}){return <button className={'icon-button'+(active?' active':'')} aria-label={label} title={label} {...props}>{children}</button>;}
function ViewControls({place,view,api,mode}){return <div className="view-controls"><CameraToggle mode={mode} onToggle={()=>api.current?.setCameraMode(mode==='first-person'?'overview':'first-person')}/>{place==='city'&&<button className={'center-control floating'+(view.overview?' city-map-active':'')} aria-label="Общий план города" title="Общий план города" onClick={()=>api.current?.overview()}><MapTrifold size={22}/></button>}{mode!=='first-person'&&<><div className="zoom-control floating"><IconButton label="Уменьшить масштаб" disabled={view.zoom<=65} onClick={()=>api.current?.zoom(-.1)}><Minus size={17}/></IconButton><button className="zoom-value" aria-label="Сбросить масштаб" onClick={()=>api.current?.reset()}>{view.zoom}%</button><IconButton label="Увеличить масштаб" disabled={view.zoom>=210} onClick={()=>api.current?.zoom(.1)}><Plus size={17}/></IconButton></div><button className="center-control floating" aria-label="Камера к персонажу" onClick={()=>api.current?.reset()}><Crosshair size={23}/></button></>}</div>;}
const money=value=>new Intl.NumberFormat('ru-RU').format(value)+' ₸';
const demoEvents=[
  {time:'00:01',source:'meter-014',kind:'Телеметрия',label:'Нормальная передача показаний',risk:false},
  {time:'00:04',source:'gateway-002',kind:'Всплеск запросов',label:'Подозрение на DoS',risk:true},
  {time:'00:06',source:'meter-031',kind:'Повтор пакетов',label:'Подозрение на replay-атаку',risk:true},
  {time:'00:09',source:'meter-008',kind:'Телеметрия',label:'Нормальная передача показаний',risk:false},
];

export function CityApp(){
  const [place,setPlace]=useState(initialPlace),[spawn,setSpawn]=useState(CITY_SPAWN),[startOverview,setStartOverview]=useState(true);
  const [cameraMode,setCameraMode]=useState('overview');
  const api=useRef(null),searchRef=useRef(null),panelRef=useRef(null);
  const [panel,setPanel]=useState(null),[menu,setMenu]=useState(null),[search,setSearch]=useState(false),[query,setQuery]=useState('');
  const [status,setStatus]=useState('Фокус'),[walk,setWalk]=useState(false),[view,setView]=useState({zoom:100,overview:true}),[toast,setToast]=useState('');
  const [mic,setMic]=useState(false),[cam,setCam]=useState(false),[sharing,setSharing]=useState(false),[read,setRead]=useState(false);
  const [messages,setMessages]=useState([]),[draft,setDraft]=useState(''),[demoStep,setDemoStep]=useState(0);
  const [pharmacyDemo,dispatchPharmacy]=useReducer(pharmacyDemoReducer,undefined,createPharmacyDemo);
  const [nearShelf,setNearShelf]=useState(null);
  const director=useRef(null);if(!director.current)director.current=createPharmacyDirector();
  const [botView,setBotView]=useState({phase:'idle',text:'Команда готова к работе',name:'Команда аптеки'});
  const [selectedShelf,setSelectedShelf]=useState('A-02');
  const pharmacy=place==='pharmacy';
  function changeCameraMode(mode){setCameraMode(mode);if(mode==='first-person'&&pharmacyDemo.automation.follow)dispatchPharmacy({type:'AUTO_CONFIG',follow:false});}
  const current=getProject(place),project=getProject(panel?.id),shelf=SHELVES.find(s=>s.id===panel?.id);
  const notice=t=>setToast(t);
  const close=()=>{setPanel(null);setMenu(null);setSearch(false);};
  function visit(id){if(!validPlaces.has(id))return;close();setWalk(false);setDemoStep(0);setSelectedShelf(pharmacyDemo.request?.shelf||'A-02');setPlace(id);const url=new URL(window.location.href);url.searchParams.set('view','city');url.searchParams.delete('project');url.hash='';id==='city'?url.searchParams.delete('place'):url.searchParams.set('place',id);history.pushState({place:id},'',url);}
  function leave(){setSpawn(spawnOutside(place));setStartOverview(false);visit('city');}
  function open(type,id){if(type==='chat'){close();guide.open();return;}setPanel({type,id});setMenu(null);setSearch(false);setQuery('');}
  useEffect(()=>{guide.setLocation(place);return guide.setNavigator(visit);});
  function action(a){
    if(a.type==='enter')visit(a.project);
    else if(a.type==='exit')leave();
    else if(a.type==='shelf'){setSelectedShelf(a.shelf);open('shelf',a.shelf);}
    else if(a.type==='argus')open('argus');
    else if(a.type==='plot')open('plot',a.plot);
    else if(a.type==='profile')open('about');
    else open('projects');
  }
  function marker(id){if(place==='city')open('project',id);else if(place==='pharmacy'){if(id.startsWith('bot-')){dispatchPharmacy({type:'AUTO_CONFIG',follow:true});return;}setSelectedShelf(id);open('shelf',id);}else open('argus');}
  function approach(id){close();api.current?.goToProject(id);notice('Идём ко входу. Рядом с дверью нажмите E.');}
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{if(panel)panelRef.current?.focus();},[panel?.type,panel?.id]);
  useEffect(()=>{if(pharmacyDemo.report?.status==='approved')setToast('Готово! Команда выполнила размещение. Принятый фотоотчёт доступен в карточке кампании.');},[pharmacyDemo.report?.status]);
  useEffect(()=>{
    const key=e=>{if(e.key==='Escape')close();if(!new URLSearchParams(window.location.search).get('place')&&e.key==='/'&&!e.target.closest?.('input,textarea,[contenteditable]')){e.preventDefault();searchRef.current?.focus();setSearch(true);}};
    const pop=()=>{close();setPlace(initialPlace());setSpawn(CITY_SPAWN);};
    window.addEventListener('keydown',key);window.addEventListener('popstate',pop);return()=>{window.removeEventListener('keydown',key);window.removeEventListener('popstate',pop);};
  },[]);
  const onView=v=>setView(old=>old.zoom===v.zoom&&old.overview===v.overview?old:v);
  const matches=PROJECTS.filter(p=>(p.name+' '+p.tag+' '+p.description).toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru').trim()));
  const titles={projects:'Проекты города',project:project?.name,about:'Об авторе',help:'Управление',notifications:'Новости города',chat:'Гид по городу',plot:'Участок '+panel?.id,shelf:shelf?.name,argus:'Мониторинг ARGUS'};
  const newQuarter=()=>{close();setSpawn(CITY_SPAWN);setStartOverview(true);if(place==='city')api.current?.overview(true);else visit('city');};
  function send(e){e.preventDefault();const text=draft.trim();if(!text)return;const q=text.toLowerCase();const answer=q.includes('аптек')?'Аптека — зелёное здание слева от площади. Войдите и выберите полку: появится демонстрация бронирования.':q.includes('argus')||q.includes('безопас')?'ARGUS находится справа от площади. Внутри есть консоль с учебным сценарием сетевых событий.':q.includes('офис')?'Офис находится севернее площади. Внутри доступны четыре этажа и исходные взаимодействия.':'Выберите «Проекты», чтобы открыть здание сразу или построить путь ко входу. WASD — движение, E — действие рядом с объектом.';setMessages(old=>[...old,{text,mine:true},{text:answer,mine:false}]);setDraft('');}
  function toPortfolio(target){close();setSpawn(spawnOutside(place));setStartOverview(false);history.pushState({},'',portfolioUrl(window.location.href,target));setPlace('city');}
  if(place==='city')return <PortfolioCity onVisit={visit} spawn={spawn} overview={startOverview} cameraMode={cameraMode} onCameraMode={changeCameraMode}/>;
  if(place==='autofix')return <ProjectFrame projectId={place} onLeave={leave} onPortfolio={toPortfolio}><AutofixExperience onLeave={leave} cameraMode={cameraMode} onCameraMode={changeCameraMode}/></ProjectFrame>;
  if(place==='office')return <ProjectFrame projectId={place} onLeave={leave} onPortfolio={toPortfolio}><Suspense fallback={<div className="office-app"><div className="world-loading floating" role="status">Открываем офис…</div></div>}><Office cameraMode={cameraMode} onCameraMode={changeCameraMode} embedded/></Suspense></ProjectFrame>;
  return <ProjectFrame projectId={place} onLeave={leave} onPortfolio={toPortfolio}><div className={'engine-stage city-stage'+(pharmacy?' pharmacy-stage':'')+(cameraMode==='first-person'?' first-person-stage':'')}><main className="office-app">
    <CityScene cameraMode={cameraMode} onCameraMode={changeCameraMode} key={place} api={api} location={place} spawn={spawn} overview={startOverview} status={status} inputEnabled={!panel&&!menu&&!search} onAction={action} onProject={marker} onNotice={notice} onWalk={setWalk} onView={onView} selectedShelf={selectedShelf} onShelfFocus={setSelectedShelf} pharmacyDemo={pharmacyDemo} onNearShelf={setNearShelf} director={director.current} onBotEvent={dispatchPharmacy} onBotView={setBotView}/>
    {pharmacy&&<PharmacyExperience state={pharmacyDemo} dispatch={dispatchPharmacy} selectedShelf={selectedShelf} onSelectShelf={setSelectedShelf} open={panel?.type==='shelf'} onOpen={()=>open('shelf',selectedShelf)} onClose={close} onLeave={leave} api={api} onNotice={notice} nearShelf={nearShelf} botView={botView} viewControls={<ViewControls place={place} view={view} api={api} mode={cameraMode}/>}/>}
    {panel&&panel.type!=='shelf'&&<aside className="side-panel floating" ref={panelRef} tabIndex={-1} aria-label={titles[panel.type]}><div className="panel-heading"><h1>{titles[panel.type]}</h1><IconButton label="Закрыть панель" onClick={()=>setPanel(null)}><X size={20}/></IconButton></div><div className="panel-body city-panel-body">
      {panel.type==='projects'&&<><span className="eyebrow">КАЖДОЕ ЗДАНИЕ — ПРОЕКТ</span><p>Зайдите внутрь или пройдите к зданию по улицам.</p>{PROJECTS.map(p=>{const Icon=iconFor[p.id];return <div className="city-project-row" key={p.id}><span className={'city-project-symbol '+p.id}><Icon size={24}/></span><div><button className="city-project-title" onClick={()=>open('project',p.id)}>{p.name}<ArrowUpRight size={15}/></button><small>{p.tag}</small><div className="city-row-actions"><button onClick={()=>visit(p.id)}>Войти<ArrowRight size={15}/></button>{place==='city'&&<button onClick={()=>approach(p.id)}><Footprints size={15}/>Пройти</button>}</div></div></div>;})}<div className="city-soft-note"><Tree size={23}/><span>Ещё {RESERVE_PLOTS.length} участка ждут новых проектов.</span></div></>}
      {panel.type==='project'&&project&&<><span className={'city-project-symbol large '+project.id}>{React.createElement(iconFor[project.id],{size:36})}</span><span className="eyebrow">{project.tag}</span><h2>{project.name}</h2><p>{project.description}</p><div className="city-tags">{project.stack.map(t=><span key={t}>{t}</span>)}</div><button className="primary full" onClick={()=>visit(project.id)}>Войти в здание<ArrowRight size={18}/></button>{place==='city'&&<button className="secondary full" onClick={()=>approach(project.id)}><Footprints size={18}/>Пройти ко входу</button>}{project.github&&<a className="city-link" href={project.github} target="_blank" rel="noreferrer"><GithubLogo size={18}/>Исходный проект<ArrowUpRight size={16}/></a>}<div className="demo-note">{project.id==='office'?'Сохранён исходный четырёхэтажный офис со всеми его демонстрационными функциями.':'Этот зал — локальная демонстрация. Сервисы исходного проекта к городу пока не подключены.'}</div></>}
      {panel.type==='about'&&<><Avatar/><span className="eyebrow">ПОРТФОЛИО</span><h2>Елнур</h2><p>Здесь можно познакомиться с моими проектами через небольшие интерактивные пространства.</p><a className="city-link" href="https://github.com/Ye1nurN" target="_blank" rel="noreferrer"><GithubLogo size={21}/>GitHub · Ye1nurN<ArrowUpRight size={17}/></a><button className="primary full" onClick={()=>open('projects')}>Посмотреть проекты<ArrowRight size={18}/></button><div className="demo-note">Резюме, биография и контакты будут добавлены отдельно.</div></>}
      {panel.type==='plot'&&<><span className="city-project-symbol large"><Tree size={36}/></span><h2>Место для нового проекта</h2><p>Участок {panel.id} подключён к улицам первого квартала. Здесь можно поставить новое здание и связать его вход с отдельной демонстрацией.</p><div className="city-soft-note">Площадь и соседние здания сохранят своё расположение.</div><button className="primary full" onClick={()=>open('projects')}>Открыть текущие проекты<ArrowRight size={18}/></button></>}
      {panel.type==='notifications'&&<><span className="eyebrow">ЛОКАЛЬНОЕ ДЕМО</span><h3>Добро пожаловать в город</h3><p>Открыты четыре пространства: AutoFix Hub, офис, аптека и ARGUS.</p><hr/><h3>Город будет расти</h3><p>Три свободных участка оставлены для будущих проектов. Улицы продолжаются к следующим кварталам.</p><button className="secondary full" onClick={()=>open('help')}><Keyboard size={18}/>Управление</button></>}
      {panel.type==='help'&&<><h2>Прогуляйтесь по городу</h2>{[['WASD / стрелки','Движение; работает и русская раскладка'],['Shift','Бежать по улице'],['E / У','Войти в здание или выбрать объект рядом'],['Клик','Пройти к свободной точке'],['V / М','Сменить вид: сверху / от первого лица'],['Мышь / палец','В первом лице: потяните сцену для осмотра'],['J / L · I / K','Повернуть взгляд / смотреть вверх и вниз'],['Home','Выровнять взгляд или вернуть камеру'],['Колесо / ±','Масштаб'],['Esc','Остановиться и закрыть панель']].map(([key,text])=><div className="help-row" key={key}><kbd>{key}</kbd><span>{text}</span></div>)}<p>Карта показывает весь квартал. Начните движение, чтобы камера следовала за вами.</p></>}
      {panel.type==='chat'&&<><div className="demo-note">Локальный гид с готовыми подсказками. Сообщения никуда не отправляются.</div><div className="city-chat"><div className="city-message">Привет! Расскажу, где найти аптеку, офис или ARGUS.</div>{messages.map((m,i)=><div key={i} className={'city-message'+(m.mine?' mine':'')}>{m.text}</div>)}</div><form className="city-chat-form" onSubmit={send}><input aria-label="Сообщение гиду" placeholder="Например: где аптека?" value={draft} onChange={e=>setDraft(e.target.value)}/><IconButton label="Отправить сообщение" type="submit"><PaperPlaneTilt size={20}/></IconButton></form></>}
      {panel.type==='argus'&&<><span className="eyebrow">СИНТЕТИЧЕСКАЯ СЕТЬ · ДЕМО</span><h2>Что видит аналитик</h2><p>Просмотрите подготовленный сценарий: обычная телеметрия, всплеск запросов и повтор пакетов.</p><div className="city-event-list">{demoEvents.slice(0,demoStep).map(event=><div className={'city-event'+(event.risk?' warning':'')} key={event.time}><span>{event.time} · {event.source}</span><strong>{event.kind}</strong><small>{event.label}</small></div>)}{demoStep===0&&<div className="city-soft-note"><ShieldCheck size={25}/>Готово к запуску сценария</div>}</div><button className="primary full" onClick={()=>setDemoStep(s=>s===demoEvents.length?0:s+1)}>{demoStep===0?'Запустить демо':demoStep===demoEvents.length?'Сбросить сценарий':'Следующее событие'}<ArrowRight size={18}/></button><div className="demo-note">Метки событий заданы сценарием. Модель машинного обучения здесь не запускается; результаты исходного проекта доступны в репозитории.</div><a className="city-link" href={getProject('argus').github} target="_blank" rel="noreferrer"><GithubLogo size={18}/>Исходный ARGUS<ArrowUpRight size={16}/></a></>}
    </div></aside>}
    {place==='argus'&&<div className="office-demo-tools"><button onClick={()=>open('argus')}><ShieldCheck size={18}/>Открыть демонстрацию ARGUS</button></div>}
    {!pharmacy&&<ViewControls place={place} view={view} api={api} mode={cameraMode}/>}
    <FirstPersonGuide mode={cameraMode} enabled={!panel&&!menu&&!search} api={api}/>
    <button className="city-help floating" aria-label="Управление персонажем" onClick={()=>open('help')}><Keyboard size={17}/><span>WASD · E</span></button>
    <div className="city-touch" aria-label="Управление персонажем">{[[0,-1,'↑'],[-1,0,'←'],[0,1,'↓'],[1,0,'→']].map(([x,z,label])=><button key={label} aria-label={'Идти '+label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);api.current?.setDirection(x,z);}} onPointerUp={()=>api.current?.setDirection(0,0)} onPointerCancel={()=>api.current?.setDirection(0,0)}>{label}</button>)}</div>
    {toast&&<div className="toast floating" role="status">{toast}</div>}
  </main></div></ProjectFrame>;
}
