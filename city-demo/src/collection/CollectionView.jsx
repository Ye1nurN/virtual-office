import React,{useEffect,useRef,useState} from 'react';
import '@fontsource-variable/lora/wght.css';
import {ArrowRight,ArrowUpRight,ArrowCounterClockwise,PaperPlaneTilt,X} from '@phosphor-icons/react';
import {PROFILE} from '../portfolio/content.js';
import {COLLECTION,readCollectionItem,collectionItemUrl} from './collectionData.js';
import './collection.css';

export default function CollectionView({onMode,onAbout,onOpenCase,onVisit}) {
  const [selected,setSelected]=useState(()=>readCollectionItem(location.href));
  const [status,setStatus]=useState('loading');
  const host=useRef(null),scroller=useRef(null),api=useRef(null),views=useRef(new Map()),drag=useRef(null),heading=useRef(null);
  const active=COLLECTION.find(p=>p.id===selected),others=COLLECTION.filter(p=>p.id!==selected);
  const update=()=>api.current?.update([...views.current].map(([id,element])=>({id,element,hero:element.dataset.hero==='true'})));
  useEffect(()=>{
    let cancelled=false;
    import('./collectionRenderer.js').then(({createCollectionRenderer})=>{if(cancelled)return;api.current=createCollectionRenderer(host.current,scroller.current,setStatus);update();}).catch(()=>!cancelled&&setStatus('error'));
    return()=>{cancelled=true;api.current?.dispose();api.current=null;};
  },[]);
  useEffect(()=>{update();},[selected,status]);
  useEffect(()=>{const pop=()=>setSelected(readCollectionItem(location.href));window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  function select(id){
    setSelected(id);history.pushState({},'',collectionItemUrl(location.href,id));
    scroller.current.scrollTo({top:0,behavior:'instant'});
    requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));
  }
  const slot=(id)=>element=>{if(element)views.current.set(id,element);else views.current.delete(id);};
  function pointerDown(e){if(status!=='ready'||e.button!==0)return;drag.current={x:e.clientX,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);}
  function pointerMove(e){if(!drag.current||drag.current.id!==e.pointerId)return;const dx=e.clientX-drag.current.x;drag.current.x=e.clientX;api.current?.drag(selected,dx*.009);}
  return <div className="collection-shell">
    <div className="collection-canvas" ref={host}/>
    <div className="collection-scroll" ref={scroller}>
      <header className="collection-header">
        <button className="collection-brand" onClick={()=>select(null)} aria-label="Елнур — вся коллекция"><span className="collection-monogram">Е.</span><strong>{PROFILE.name}</strong><span>{PROFILE.title}</span></button>
        <nav aria-label="Навигация коллекции"><button aria-current="page" onClick={()=>select(null)}>Коллекция</button><button onClick={onAbout}>Обо мне</button><button onClick={()=>onMode('city')}>Город</button></nav>
        <a className="collection-contact" href={PROFILE.telegram} target="_blank" rel="noreferrer"><PaperPlaneTilt weight="fill" size={24}/><span>{PROFILE.telegramHandle}</span></a>
      </header>
      <main id="pf-main" className={'collection-main '+(!active?'collection-overview':'')} tabIndex={-1}>
        <div className="collection-breadcrumb"><div><button onClick={()=>select(null)}>Коллекция</button>{active&&<><span>/</span><span>{active.label}</span></>}</div>{active&&<button onClick={()=>select(null)}>Закрыть<X size={19}/></button>}</div>
        {active?<section className="collection-feature" aria-label="Выбранный проект">
          <div className="collection-display">
            <div className="collection-hero-model" ref={slot(active.id)} data-hero="true" role="group" aria-label={'3D-модель: '+active.title} tabIndex={0} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onLostPointerCapture={()=>drag.current=null} onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();api.current?.rotate(selected,e.key==='ArrowLeft'?-.3:.3);}}}>
              {status!=='ready'&&<div className="collection-loading" role="status">{status==='loading'?'Расставляем коллекцию…':'3D-витрина недоступна. Описания и демонстрации можно открыть справа.'}</div>}
            </div>
            <div className="collection-main-shelf"><span className="collection-plaque">{active.plaque}</span></div>
            <button className="collection-rotate" disabled={status!=='ready'} onClick={()=>api.current?.rotate(selected)}><span><ArrowCounterClockwise size={23}/></span>Повернуть</button>
            <span className="collection-drag-hint">Можно вращать мышью или стрелками</span>
          </div>
          <article className="collection-story" key={active.id}>
            <span className="collection-eyebrow">{active.eyebrow}</span>
            <h1 ref={heading} tabIndex={-1}>{active.title}</h1>
            <p className="collection-lead">{active.lead}</p>
            <div className="collection-contribution"><h2>Мой вклад</h2><ul>{active.contribution.map(line=><li key={line}>{line}</li>)}</ul></div>
            {active.metrics&&<div className="collection-metrics"><div>{active.metrics.map(metric=><span key={metric.label}><strong>{metric.value}</strong> {metric.label.replace(' в каталоге','')}</span>)}</div><small>{active.id==='pharmacy'?'Данные каталога':'Архитектура дипломного прототипа'}</small></div>}
            <p className="collection-stack">{active.stack.join(' · ')}</p>
            <div className="collection-actions"><button className="collection-primary" onClick={()=>onOpenCase(active.id)}>Открыть кейс<ArrowUpRight size={22}/></button><button onClick={()=>onVisit(active.id)}>Попробовать демо<ArrowRight size={21}/></button></div>
            <div className="collection-secondary"><button onClick={()=>select(null)}>Все проекты</button><button onClick={()=>onMode('resume')}>Резюме<ArrowUpRight size={18}/></button></div>
          </article>
        </section>:<section className="collection-intro"><span className="collection-eyebrow">Личная коллекция · 05 проектов</span><h1 ref={heading} tabIndex={-1}>Идеи, которым<br/>нашлось место.</h1><p>За каждым зданием — проект.<br/>Возьмите с полки тот, который хочется изучить.</p>{status==='error'&&<p role="status">3D-витрина недоступна. Выберите проект по названию.</p>}</section>}
        <section className="collection-bottom" aria-label="Проекты на полке">
          <div className="collection-miniatures">{others.map(p=><button key={p.id} className="collection-miniature" aria-label={'Рассмотреть '+p.label} onClick={()=>select(p.id)} onPointerEnter={()=>api.current?.rotate(p.id,.055)} onPointerLeave={()=>api.current?.rotate(p.id,-.055)}><span className="collection-mini-model" ref={slot(p.id)} data-hero="false"/><span className="collection-plaque">{p.plaque}</span></button>)}</div>
          <aside className="collection-quote">Большие проекты начинаются с идей, которым есть место.<span/></aside>
        </section>
        <footer className="collection-footer"><span>Коллекция продолжает расти</span><button onClick={()=>onMode('city')}>Исследовать город<ArrowUpRight size={16}/></button></footer>
      </main>
    </div>
  </div>;
}
