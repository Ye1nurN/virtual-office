import {PortfolioHeader} from './PortfolioHeader.jsx';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Car, ArrowRight, ArrowUpRight, ArrowLeft, Buildings, FirstAid, ShieldCheck, GithubLogo, MapTrifold, FileText, X, Plus, Minus, Crosshair, Keyboard, Footprints, LinkSimple, Check, EnvelopeSimple, PaperPlaneTilt, Cube, MagnifyingGlass, Eye} from '@phosphor-icons/react';
import {CASES, PROFILE, SKILLS, portfolioUrl, readPortfolioRoute} from './content.js';
import './portfolio.css';
import {guide} from '../guide/guideStore.js';

import {CityScene as Scene} from '../city/CityScene.jsx';
import {FirstPersonGuide} from '../world/CameraControls.jsx';
const icons = {office:Buildings, pharmacy:FirstAid, argus:ShieldCheck, autofix:Car};
const sectionNames = {projects:'Проекты', experience:'Опыт', skills:'Навыки', about:'Обо мне', contact:'Связаться', help:'Управление', plot:'Будущий проект'};
const compact = () => window.matchMedia('(max-width: 720px)').matches;
const initialRoute = () => readPortfolioRoute(window.location.href, compact());

function ProjectIcon({id, size=24}) { const Icon=icons[id]; return <Icon size={size} weight="duotone"/>; }
function External({href, children, className='', label}) { return <a className={className} aria-label={label} href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={17}/></a>; }
function Tags({values}) { return <div className="pf-tags">{values.map(value => <span key={value}>{value}</span>)}</div>; }
function ProjectCard({project, onOpen}) {
  return <button className={'pf-project-card pf-'+project.id} onClick={() => onOpen(project.id)}>
    <span className="pf-card-top"><span className="pf-project-icon"><ProjectIcon id={project.id} size={28}/></span><span className="pf-number">{project.number} / ПРОЕКТ</span><ArrowUpRight size={20}/></span>
    <span className="pf-kicker">{project.category}</span><strong>{project.title}</strong><span className="pf-card-lead">{project.lead}</span>
    <Tags values={project.stack}/><span className="pf-card-bottom">О проекте и демонстрации<ArrowRight size={17}/></span>
  </button>;
}

function Skills({onOpen}) {
  return <div className="pf-skills">{SKILLS.map(skill => <article key={skill.title}><h3>{skill.title}</h3><p>{skill.description}</p><div>{skill.projects.map(id => <button key={id} onClick={() => onOpen(id)}>{CASES.find(p=>p.id===id).title}<ArrowUpRight size={14}/></button>)}</div></article>)}</div>;
}

function Experience({onOpen}) {
  return <><p className="pf-muted">Проектная практика: задачи и реализованные возможности.</p><div className="pf-timeline">{CASES.map(project => <article key={project.id}><span>{project.number}</span><div><small>{project.category}</small><h3>{project.title}</h3><p>{project.takeaway}</p><button className="pf-text-button" onClick={()=>onOpen(project.id)}>Посмотреть работу<ArrowRight size={16}/></button></div></article>)}</div></>;
}

function Contact() {
  return <div className="pf-contact"><span className="pf-kicker">ДАВАЙТЕ ЗНАКОМИТЬСЯ</span><h2>Продолжим общение</h2><p>Мои проекты и профиль доступны на GitHub.</p><External className="pf-contact-link" href={PROFILE.github}><GithubLogo size={25}/><span><strong>GitHub</strong><small>{PROFILE.handle}</small></span></External>{PROFILE.email&&<a className="pf-contact-link" href={'mailto:'+PROFILE.email}><EnvelopeSimple size={23}/>{PROFILE.email}<ArrowUpRight size={17}/></a>}{PROFILE.telegram&&<External className="pf-contact-link" href={PROFILE.telegram}><PaperPlaneTilt size={23}/>Telegram</External>}{!PROFILE.email&&!PROFILE.telegram&&<p className="pf-fine">Прямой контакт пока не указан.</p>}</div>;
}

function Drawer({panel, onClose, toast, children}) {
  const ref=useRef(null);
  useEffect(()=>{const previous=document.activeElement;const dialog=ref.current;dialog.showModal();return()=>{dialog.close();if(previous?.isConnected)previous.focus?.();};},[]);
  useEffect(()=>{ref.current.querySelector('.pf-drawer-body').scrollTop=0;ref.current.querySelector('button')?.focus();},[panel.type,panel.id]);
  return <dialog ref={ref} className="pf-drawer" aria-labelledby="pf-drawer-title" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="pf-drawer-inner"><div className="pf-drawer-heading"><span id="pf-drawer-title">{panel.type==='project'?'История проекта':sectionNames[panel.type]}</span><button className="pf-icon-button" aria-label="Закрыть панель" onClick={onClose} autoFocus><X size={21}/></button></div><div className="pf-drawer-body">{children}</div>{toast&&<div className="pf-drawer-toast" role="status"><Check size={18}/>{toast}</div>}</div>
  </dialog>;
}

export function PortfolioCity({onVisit, spawn, overview, cameraMode='overview', onCameraMode}) {
  const [mode,setMode]=useState(()=>initialRoute().mode);
  const [panel,setPanel]=useState(()=>initialRoute().project?{type:'project',id:initialRoute().project}:null);
  const [intro,setIntro]=useState(overview),[query,setQuery]=useState(''),[toast,setToast]=useState('');
  const [view,setView]=useState({zoom:100,overview:true});
  function setCameraMode(next){onCameraMode?.(next);if(next==='first-person')setIntro(false);}
  const [canFirstPerson,setCanFirstPerson]=useState(false);
  const api=useRef(null),documentRef=useRef(null),pendingWalk=useRef(null);
  const activeProject=panel?.type==='project'?CASES.find(p=>p.id===panel.id):null;
  const notice=useCallback(text=>setToast(text),[]);
  function writeRoute(nextMode, project=null, push=false) {history[push?'pushState':'replaceState']({},'',portfolioUrl(window.location.href,{mode:nextMode,project}));}
  function open(type,id) {setQuery('');setPanel({type,id});writeRoute(mode,type==='project'?id:null);}
  function close() {setPanel(null);writeRoute(mode);}
  function selectMode(next) {setPanel(null);setMode(next);setIntro(next==='city');writeRoute(next,null,true);}
  useEffect(()=>guide.setCityMode(()=>{setMode('city');setPanel(null);setIntro(false);writeRoute('city');}),[]);
  function visit(id) {setPanel(null);writeRoute('city');onVisit(id);}
  function showSection(type) {
    if(mode==='resume'){setPanel(null);writeRoute(mode);requestAnimationFrame(()=>document.getElementById('pf-'+type)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));}
    else open(type);
  }
  function walkTo(id) {
    setPanel(null);setIntro(false);
    if(mode==='resume'){pendingWalk.current=id;setMode('city');writeRoute('city');}
    else {writeRoute(mode);api.current?.goToProject(id);notice('Маршрут ко входу. Рядом с дверью нажмите E.');}
  }
  const updateView=useCallback(next=>{
    setView(old=>old.zoom===next.zoom&&old.overview===next.overview?old:next);
    setCanFirstPerson(typeof api.current?.setCameraMode==='function');
    if(pendingWalk.current){const id=pendingWalk.current;pendingWalk.current=null;api.current?.goToProject(id);}
  },[]);
  useEffect(()=>{const pop=()=>{const route=initialRoute();setMode(route.mode);setPanel(route.project?{type:'project',id:route.project}:null);};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  useEffect(()=>{const scroll=()=>{if(mode!=='resume')return;const id=window.location.hash.slice(1);if(['pf-projects','pf-experience','pf-skills','pf-about','pf-contact'].includes(id))requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:'start'}));};scroll();window.addEventListener('popstate',scroll);return()=>window.removeEventListener('popstate',scroll);},[mode]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),3800);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{document.title=activeProject?activeProject.title+' — '+PROFILE.name:PROFILE.name+' — портфолио проектов';},[activeProject]);
  useEffect(()=>{if(!panel)return;api.current?.setDirection(0,0);},[panel]);
  async function copyProject() {
    const url=portfolioUrl(window.location.href,{mode:'resume',project:activeProject.id}).href;
    try{await navigator.clipboard.writeText(url);notice('Ссылка на проект скопирована');}catch{notice('Ссылка на проект доступна в адресной строке');}
  }
  const matches=CASES.filter(p=>(p.title+' '+p.category+' '+p.stack.join(' ')).toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru').trim()));
  return <div className={'pf-app pf-mode-'+mode}>
    <a className="pf-skip" href="#pf-main">Перейти к содержимому</a>
    <PortfolioHeader mode={mode} activeSection={panel?.type} onHome={()=>{close();setIntro(true);documentRef.current?.scrollTo({top:0,behavior:'smooth'});}} onMode={selectMode} onSection={type=>type==='contact'?open('contact'):showSection(type)}/>
    {mode==='city'?<main id="pf-main" className={'pf-city city-stage engine-stage'+(cameraMode==='first-person'?' first-person-stage':'')} tabIndex={-1}>
      <Scene api={api} location="city" spawn={spawn} overview={overview} cameraMode={cameraMode} onCameraMode={setCameraMode} status="Исследую" inputEnabled={!panel} onAction={a=>a.type==='enter'?visit(a.project):open(a.type==='profile'?'about':a.type==='plot'?'plot':'projects',a.plot)} onProject={id=>open('project',id)} onNotice={notice} onWalk={moving=>{if(moving)setIntro(false);}} onView={updateView}/>
      {intro&&!panel&&<section className="pf-welcome"><span className="pf-kicker"><span className="pf-dot"/>ИНТЕРАКТИВНОЕ ПОРТФОЛИО</span><h1>Привет,<br/>я {PROFILE.name}<span className="pf-accent">.</span></h1><p>{PROFILE.intro}</p><div className="pf-welcome-actions"><button className="pf-button pf-primary" onClick={()=>open('projects')}>Смотреть проекты<ArrowRight size={18}/></button><button className="pf-text-button" onClick={()=>{setIntro(false);api.current?.reset();}}>Прогуляться<Footprints size={18}/></button></div><div className="pf-welcome-bottom"><Cube size={17}/><span>Каждое здание — проект.<br/>Заходите и пробуйте.</span></div><button className="pf-welcome-close pf-icon-button" aria-label="Свернуть знакомство" onClick={()=>setIntro(false)}><Minus size={17}/></button></section>}
      {!intro&&!panel&&<button className="pf-intro-peek" onClick={()=>setIntro(true)}>Привет, я {PROFILE.name}<ArrowUpRight size={16}/></button>}
      {!panel&&<div className="pf-project-shortcuts" aria-label="Здания проектов">{CASES.map(p=><button key={p.id} onClick={()=>open('project',p.id)}><span>{p.number}</span><ProjectIcon id={p.id} size={18}/>{p.title}<ArrowUpRight size={15}/></button>)}</div>}
      <div className="pf-city-controls"><div className="pf-control-group"><button onClick={()=>api.current?.overview()} aria-label="Карта города"><MapTrifold size={20}/><span>Карта</span></button><button onClick={()=>api.current?.reset()} aria-label="К персонажу"><Crosshair size={20}/></button>{canFirstPerson&&<button aria-label={cameraMode==='first-person'?'Вид сверху':'Вид от первого лица'} onClick={()=>api.current?.setCameraMode(cameraMode==='first-person'?'overview':'first-person')}><Eye size={20}/></button>}<button onClick={()=>open('help')} aria-label="Управление"><Keyboard size={20}/><span>WASD · E</span></button></div><div className="pf-control-group pf-zoom"><button aria-label="Уменьшить масштаб" disabled={view.zoom<=65} onClick={()=>api.current?.zoom(-.1)}><Minus size={18}/></button><span>{view.zoom}%</span><button aria-label="Увеличить масштаб" disabled={view.zoom>=210} onClick={()=>api.current?.zoom(.1)}><Plus size={18}/></button></div></div>
      <FirstPersonGuide mode={cameraMode} enabled={!panel} api={api}/>
      {!panel&&<div className="pf-touch" aria-label="Движение">{[[0,-1,'↑'],[-1,0,'←'],[0,1,'↓'],[1,0,'→']].map(([x,z,label])=><button key={label} aria-label={'Идти '+label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setIntro(false);api.current?.setDirection(x,z);}} onPointerUp={()=>api.current?.setDirection(0,0)} onPointerCancel={()=>api.current?.setDirection(0,0)} onLostPointerCapture={()=>api.current?.setDirection(0,0)}>{label}</button>)}</div>}
    </main>:<main id="pf-main" className="pf-document" ref={documentRef} tabIndex={-1}>
      <div className="pf-document-content"><section className="pf-resume-hero"><div><span className="pf-kicker">ПОРТФОЛИО ПРОЕКТОВ</span><h1>{PROFILE.name}<span className="pf-accent">.</span></h1><p>{PROFILE.intro}</p><div className="pf-welcome-actions"><button className="pf-button pf-primary" onClick={()=>showSection('projects')}>Смотреть проекты<ArrowRight size={18}/></button><External className="pf-text-button" href={PROFILE.github}>GitHub</External></div>{PROFILE.resume&&<a className="pf-text-button" href={PROFILE.resume} download><FileText size={18}/>Скачать резюме</a>}</div><button className="pf-city-preview" onClick={()=>selectMode('city')}><img src="/portfolio/city-preview.png" alt="Трёхмерный квартал с офисом, аптекой и ARGUS"/><span><MapTrifold size={20}/>Прогуляться по городу<ArrowUpRight size={20}/></span></button></section>
      <section id="pf-projects" className="pf-section"><div className="pf-section-title"><div><span className="pf-kicker">ПРОБОВАТЬ И ИССЛЕДОВАТЬ</span><h2>Избранные проекты</h2></div><span>{String(CASES.length).padStart(2,'0')} проекта</span></div><div className="pf-project-grid">{CASES.map(p=><ProjectCard key={p.id} project={p} onOpen={id=>open('project',id)}/>)}</div></section>
      <section id="pf-experience" className="pf-section pf-resume-split"><div><span className="pf-kicker">ОТ ИДЕИ К РЕАЛИЗАЦИИ</span><h2>Проектный опыт</h2></div><Experience onOpen={id=>open('project',id)}/></section>
      <section id="pf-skills" className="pf-section"><span className="pf-kicker">ИНСТРУМЕНТЫ В РАБОТЕ</span><h2>Технологии в проектах</h2><p className="pf-muted">Каждое направление связано с работой, которую можно открыть.</p><Skills onOpen={id=>open('project',id)}/></section>
      <section id="pf-about" className="pf-section pf-about"><span className="pf-kicker">ОБО МНЕ</span><h2>Мои проекты —<br/>в одном небольшом городе.</h2><p>Здесь собраны веб-приложения, 3D-пространство и учебный проект по безопасности. Можно посмотреть исходный код, изучить задачу или пройти интерактивную демонстрацию.</p><button className="pf-text-button" onClick={()=>selectMode('city')}>Войти в город<ArrowRight size={18}/></button></section>
      <section id="pf-contact" className="pf-section"><Contact/></section><footer className="pf-footer"><span>{PROFILE.name} · Портфолио проектов</span><button onClick={()=>documentRef.current?.scrollTo({top:0,behavior:'smooth'})}>Наверх ↑</button></footer></div>
    </main>}
    {panel&&<Drawer panel={panel} onClose={close} toast={toast}>
      {panel.type==='projects'&&<><span className="pf-kicker">ВЫБЕРИТЕ, С ЧЕГО НАЧАТЬ</span><h2>Проекты, которые<br/>можно попробовать.</h2><label className="pf-search"><MagnifyingGlass size={19}/><input autoComplete="off" aria-label="Найти проект" placeholder="Название или технология" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="pf-project-list">{matches.map(p=><ProjectCard key={p.id} project={p} onOpen={id=>open('project',id)}/>)}</div>{matches.length===0&&<div className="pf-empty"><p>Проектов по этому запросу нет.</p><button className="pf-text-button" onClick={()=>setQuery('')}>Показать все проекты</button></div>}</>}
      {activeProject&&<><button className="pf-text-button pf-back" onClick={()=>open('projects')}><ArrowLeft size={16}/>Все проекты</button><div className={'pf-case-symbol pf-'+activeProject.id}><ProjectIcon id={activeProject.id} size={34}/><span>{activeProject.number}</span></div><span className="pf-kicker">{activeProject.category}</span><h2>{activeProject.title}</h2><p className="pf-case-lead">{activeProject.lead}</p><Tags values={activeProject.stack}/><div className="pf-case-actions">{activeProject.website&&<External href={activeProject.website} className="pf-button pf-secondary">Открыть {activeProject.websiteLabel}</External>}<button className="pf-button pf-primary" onClick={()=>visit(activeProject.id)}>Запустить демонстрацию<ArrowRight size={18}/></button><button className="pf-button pf-secondary" onClick={()=>walkTo(activeProject.id)}><Footprints size={18}/>Пройти к зданию</button></div><section className="pf-case-section"><h3>Задача</h3><p>{activeProject.problem}</p></section>{activeProject.role&&<section className="pf-case-section"><h3>Моя роль и вклад</h3><p>{activeProject.role}</p><ul>{activeProject.contribution.map(item=><li key={item}><Check size={17}/><span>{item}</span></li>)}</ul></section>}<section className="pf-case-section"><h3>Что реализовано</h3><ul>{activeProject.built.map(item=><li key={item}><Check size={17}/><span>{item}</span></li>)}</ul></section><section className="pf-case-section"><h3>Что попробовать</h3><p>{activeProject.demo}</p></section><p className="pf-scope">{activeProject.scope}</p><div className="pf-case-links">{activeProject.github&&<External href={activeProject.github} className="pf-text-button"><GithubLogo size={19}/>{activeProject.privateRepository?'GitHub · приватный репозиторий':'Исходный код'}</External>}<button className="pf-text-button" onClick={copyProject}><LinkSimple size={18}/>Скопировать ссылку</button></div></>}
      {panel.type==='experience'&&<><span className="pf-kicker">ОТ ИДЕИ К РЕАЛИЗАЦИИ</span><h2>Проектный опыт</h2><Experience onOpen={id=>open('project',id)}/></>}
      {panel.type==='skills'&&<><span className="pf-kicker">ИНСТРУМЕНТЫ В РАБОТЕ</span><h2>Технологии<br/>в проектах</h2><p className="pf-muted">Выберите проект, чтобы увидеть применение технологии.</p><Skills onOpen={id=>open('project',id)}/></>}
      {panel.type==='about'&&<><span className="pf-kicker">ДАВАЙТЕ ЗНАКОМИТЬСЯ</span><h2>Я {PROFILE.name}<span className="pf-accent">.</span></h2><p className="pf-case-lead">{PROFILE.intro}</p><p>Этот город объединяет мои проекты. У каждого здания — своя задача, технологии и демонстрация, которую можно исследовать.</p><button className="pf-button pf-primary" onClick={()=>open('projects')}>Мои проекты<ArrowRight size={18}/></button><External href={PROFILE.github} className="pf-text-button"><GithubLogo size={20}/>GitHub · {PROFILE.handle}</External></>}
      {panel.type==='contact'&&<Contact/>}
      {panel.type==='plot'&&<><span className="pf-kicker">ГОРОД РАСТЁТ</span><h2>Здесь появится<br/>новый проект.</h2><p>Участок {panel.id} оставлен для следующей работы. А пока можно исследовать открытые здания.</p><button className="pf-button pf-primary" onClick={()=>open('projects')}>Выбрать проект<ArrowRight size={18}/></button></>}
      {panel.type==='help'&&<><span className="pf-kicker">НЕБОЛЬШАЯ ПРОГУЛКА</span><h2>Осмотритесь<br/>в городе.</h2><div className="pf-help-rows">{[['WASD / стрелки','Двигаться. Русская раскладка тоже работает.'],['Shift','Бежать'],['E / У','Войти в ближайшее здание'],['Клик по улице','Пройти к выбранной точке'],['V / М','Сменить ракурс: сверху / от первого лица'],['Потяните сцену','В первом лице — осмотреться мышью или пальцем'],['J / L · I / K','Повернуть взгляд / посмотреть вверх и вниз'],['Колесо / ±','Изменить масштаб в виде сверху'],['Home','Вернуться к персонажу'],['Esc','Закрыть панель или остановиться']].map(([key,text])=><div key={key}><kbd>{key}</kbd><span>{text}</span></div>)}</div><p className="pf-muted">Войти в любой проект можно и сразу — через его карточку.</p><button className="pf-button pf-primary" onClick={close}>Всё понятно<Check size={18}/></button></>}
    </Drawer>}
    {toast&&!panel&&<div className="pf-toast" role="status"><Check size={18}/>{toast}</div>}
  </div>;
}
