import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import '@fontsource-variable/lora/wght.css';
import {ArrowRight,ArrowUpRight} from '@phosphor-icons/react';
import {GalleryHeader} from '../portfolio/GalleryHeader.jsx';
import {COLLECTION,readCollectionItem,collectionItemUrl} from './collectionData.js';
import './collection.css';

export default function CollectionView({onMode,onOpenCase,onVisit}) {
  const [selected,setSelected]=useState(()=>readCollectionItem(location.href));
  const [status,setStatus]=useState('loading');
  const host=useRef(null),scroller=useRef(null),api=useRef(null),views=useRef(new Map()),drag=useRef(null),heading=useRef(null);
  const selection=useRef(selected),focusRequested=useRef(false);
  const active=COLLECTION.find(p=>p.id===selected),others=COLLECTION.filter(p=>p.id!==selected);
  const update=()=>api.current?.update([...views.current].map(([id,element])=>({id,element,hero:element.dataset.hero==='true'})));
  useEffect(()=>{
    let cancelled=false;
    import('./collectionRenderer.js').then(({createCollectionRenderer})=>{if(cancelled)return;api.current=createCollectionRenderer(host.current,scroller.current,setStatus);update();}).catch(()=>!cancelled&&setStatus('error'));
    return()=>{cancelled=true;api.current?.dispose();api.current=null;};
  },[]);
  useLayoutEffect(()=>{update();if(focusRequested.current){focusRequested.current=false;heading.current?.focus({preventScroll:true});}},[selected,status]);
  useEffect(()=>{const pop=()=>select(readCollectionItem(location.href),false);window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  function select(id,writeHistory=true){
    if(id===selection.current)return;
    drag.current=null;
    scroller.current.scrollTo({top:0,behavior:'instant'});
    api.current?.prepareTransition?.();
    selection.current=id;focusRequested.current=true;setSelected(id);
    if(writeHistory)history.pushState({},'',collectionItemUrl(location.href,id));
  }
  const slot=(id)=>element=>{if(element)views.current.set(id,element);else views.current.delete(id);};
  function pointerDown(e){if(status!=='ready'||e.button!==0)return;drag.current={x:e.clientX,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);}
  function pointerMove(e){if(!drag.current||drag.current.id!==e.pointerId)return;const dx=e.clientX-drag.current.x;drag.current.x=e.clientX;api.current?.drag(selected,dx*.009);}
  return <div className={'collection-shell '+(status==='error'?'collection-unavailable':'')}>
    <div className="collection-canvas" ref={host}/>
    <div className="collection-scroll" ref={scroller}>
      <GalleryHeader mode="collection" onMode={onMode} onProjects={()=>select(null)}/>
      <main id="pf-main" className={'collection-main '+(!active?'collection-overview':'')} tabIndex={-1}>
        <div className="collection-breadcrumb"><div><button onClick={()=>select(null)}>Проекты</button>{active&&<><span>/</span><span>{active.label}</span></>}</div>{active&&<button onClick={()=>select(null)}>Все проекты<ArrowUpRight size={19}/></button>}</div>
        {active?<section className="collection-feature" aria-label="Выбранный проект">
          <div className="collection-display">
            <div className="collection-hero-model" ref={slot(active.id)} data-hero="true" role="group" aria-label={'3D-модель: '+active.title} tabIndex={0} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onLostPointerCapture={()=>drag.current=null} onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();api.current?.rotate(selected,e.key==='ArrowLeft'?-.3:.3);}}}>
              {status!=='ready'&&<div className="collection-loading" role="status">{status==='loading'?'Расставляем коллекцию…':'3D-витрина недоступна. Описания и демонстрации можно открыть справа.'}</div>}
            </div>
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
        </section>:<section className="collection-intro" key="overview"><span className="collection-eyebrow">{String(COLLECTION.length).padStart(2,'0')} проектов</span><h1 ref={heading} tabIndex={-1}>Проекты</h1><p>Кейсы, мой вклад и интерактивные демонстрации.<br/>Выберите здание, чтобы изучить проект.</p>{status==='error'&&<p role="status">3D-витрина недоступна. Выберите проект по названию.</p>}</section>}
        <section className="collection-bottom" aria-label="Проекты на полке">
          <div className="collection-miniatures">{others.map(p=><button key={p.id} className="collection-miniature" aria-label={'Рассмотреть '+p.label} onClick={()=>select(p.id)} onPointerEnter={()=>api.current?.rotate(p.id,.055)} onPointerLeave={()=>api.current?.rotate(p.id,-.055)}><span className="collection-mini-model" ref={slot(p.id)} data-hero="false"/><span className="collection-plaque">{p.plaque}</span></button>)}</div>
        </section>
        <footer className="collection-footer"><span>Елнур · Портфолио проектов</span><button onClick={()=>onMode('city')}>Исследовать город<ArrowUpRight size={16}/></button></footer>
      </main>
    </div>
  </div>;
}
