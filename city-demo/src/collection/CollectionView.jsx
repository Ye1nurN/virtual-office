import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,X} from '@phosphor-icons/react';
import {GalleryHeader} from '../portfolio/GalleryHeader.jsx';
import {COLLECTION,readCollectionItem,collectionItemUrl} from './collectionData.js';
import {clampShelfStart,revealShelfItem,shelfWeight} from './shelfCarousel.js';
import './collection.css';

const initialCount=()=>window.matchMedia('(max-width:700px)').matches?2:4;
export default function CollectionView({onMode,onOpenCase,onVisit}) {
  const [count,setCount]=useState(initialCount);
  const [view,setView]=useState(()=>{const selected=readCollectionItem(location.href);return {selected,start:revealShelfItem(0,COLLECTION.findIndex(p=>p.id===selected),initialCount(),COLLECTION.length)};});
  const [status,setStatus]=useState('loading');
  const host=useRef(null),scroller=useRef(null),track=useRef(null),api=useRef(null),buttons=useRef(new Map()),focusId=useRef(null);
  const active=COLLECTION.find(p=>p.id===view.selected),visible=COLLECTION.slice(view.start,view.start+count);
  useEffect(()=>{
    let cancelled=false;
    import('./collectionRenderer.js').then(({createCollectionRenderer})=>{if(!cancelled)api.current=createCollectionRenderer(host.current,scroller.current,setStatus);}).catch(()=>!cancelled&&setStatus('error'));
    return()=>{cancelled=true;api.current?.dispose();api.current=null;};
  },[]);
  useLayoutEffect(()=>{api.current?.update(track.current,{...view,count});if(focusId.current){buttons.current.get(focusId.current)?.focus({preventScroll:true});focusId.current=null;}},[view,count,status]);
  useEffect(()=>{
    const query=window.matchMedia('(max-width:700px)');
    const resize=()=>{const next=query.matches?2:4;setCount(next);setView(v=>({...v,start:revealShelfItem(v.start,COLLECTION.findIndex(p=>p.id===v.selected),next,COLLECTION.length)}));};
    query.addEventListener('change',resize);return()=>query.removeEventListener('change',resize);
  },[]);
  useEffect(()=>{
    const pop=()=>{const selected=readCollectionItem(location.href);setView(v=>({selected,start:revealShelfItem(v.start,COLLECTION.findIndex(p=>p.id===selected),count,COLLECTION.length)}));};
    window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);
  },[count]);
  function select(id){
    if(id===view.selected)return;
    setView(v=>({selected:id,start:revealShelfItem(v.start,COLLECTION.findIndex(p=>p.id===id),count,COLLECTION.length)}));
    history.pushState({},'',collectionItemUrl(location.href,id));
  }
  function page(direction){
    const start=clampShelfStart(view.start+direction,count,COLLECTION.length);
    if(start===view.start)return;
    const selected=COLLECTION.slice(start,start+count).some(p=>p.id===view.selected)?view.selected:null;
    setView({start,selected});
    if(selected!==view.selected)history.pushState({},'',collectionItemUrl(location.href,selected));
  }
  function navigate(e,id){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();select(null);return;}
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const index=COLLECTION.findIndex(p=>p.id===id);
    const next=e.key==='Home'?0:e.key==='End'?COLLECTION.length-1:Math.max(0,Math.min(COLLECTION.length-1,index+(e.key==='ArrowRight'?1:-1)));
    const target=COLLECTION[next].id,start=revealShelfItem(view.start,next,count,COLLECTION.length);
    if(start===view.start)buttons.current.get(target)?.focus({preventScroll:true});
    else {focusId.current=target;const selected=COLLECTION.slice(start,start+count).some(p=>p.id===view.selected)?view.selected:null;setView({start,selected});if(selected!==view.selected)history.pushState({},'',collectionItemUrl(location.href,selected));}
  }
  return <div className={'collection-shell '+(status==='error'?'collection-unavailable':'')}>
    <div className="collection-canvas" ref={host}/>
    <div className="collection-scroll" ref={scroller}>
      <GalleryHeader mode="collection" onMode={onMode} onProjects={()=>select(null)}/>
      <main id="pf-main" className={'collection-main '+(active?'collection-focused':'')} tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape')select(null);}}>
        <div className="collection-heading"><div><span className="collection-eyebrow">Коллекция / {String(COLLECTION.length).padStart(2,'0')}</span><h1>Проекты</h1></div><p>Выберите здание, чтобы рассмотреть проект.<br/><span>У каждого — своя история и демонстрация.</span></p></div>
        <section className="collection-carousel" aria-label="Коллекция проектов" aria-roledescription="карусель">
          <button className="collection-arrow collection-arrow-prev" aria-label="Предыдущие проекты" disabled={view.start===0} onClick={()=>page(-1)}><ArrowLeft size={24}/></button>
          <div className="collection-track" ref={track} style={{gridTemplateColumns:visible.map(p=>shelfWeight(p.id,view.selected)+'fr').join(' ')}}>
            {visible.map((p,index)=><button key={p.id} ref={element=>{if(element)buttons.current.set(p.id,element);else buttons.current.delete(p.id);}} className="collection-miniature" aria-label={'Рассмотреть '+p.label} aria-pressed={view.selected===p.id} onClick={()=>select(view.selected===p.id?null:p.id)} onKeyDown={e=>navigate(e,p.id)} onPointerEnter={e=>{if(e.pointerType!=='touch')api.current?.interest(p.id,'pointer',true);}} onPointerLeave={()=>api.current?.interest(p.id,'pointer',false)} onFocus={e=>{if(e.currentTarget.matches(':focus-visible'))api.current?.interest(p.id,'focus',true);}} onBlur={()=>api.current?.interest(p.id,'focus',false)}>
              <span className="collection-slot-number" aria-hidden="true">{String(view.start+index+1).padStart(2,'0')}</span><span className="collection-plaque">{p.plaque}</span>
            </button>)}
            {status!=='ready'&&<div className="collection-loading" role="status">{status==='loading'?'Расставляем коллекцию…':'3D-витрина недоступна. Выберите проект по названию.'}</div>}
          </div>
          <button className="collection-arrow collection-arrow-next" aria-label="Следующие проекты" disabled={view.start+count>=COLLECTION.length} onClick={()=>page(1)}><ArrowRight size={24}/></button>
        </section>
        <div className="collection-pagination"><span aria-live="polite">{String(view.start+1).padStart(2,'0')} — {String(Math.min(view.start+count,COLLECTION.length)).padStart(2,'0')} <span>/ {String(COLLECTION.length).padStart(2,'0')}</span></span><span>← → <span>Листайте коллекцию</span></span></div>
        <div className="collection-details" aria-live="polite">
          {active?<article className="collection-story" key={active.id} aria-label={'Проект: '+active.title}>
            <div className="collection-story-title"><span className="collection-eyebrow">{active.eyebrow}</span><h2>{active.title}</h2><button className="collection-reset" onClick={()=>select(null)}><X size={14}/>Общий вид</button></div>
            <div className="collection-story-copy"><p className="collection-lead">{active.lead}</p><p className="collection-stack">{active.stack.join(' · ')}</p>{active.metrics&&<p className="collection-metrics">{active.metrics.map(m=><span key={m.label}><strong>{m.value}</strong> {m.label.replace(' в каталоге','')}</span>)}</p>}</div>
            <div className="collection-actions"><button className="collection-primary" onClick={()=>onOpenCase(active.id)}>Открыть кейс<ArrowUpRight size={21}/></button><button onClick={()=>onVisit(active.id)}>Попробовать демо<ArrowRight size={19}/></button></div>
          </article>:<div className="collection-idle"><span>От замысла до работающего продукта.</span><p>Веб-приложения, машинное обучение и интерактивный 3D — в одной коллекции.</p></div>}
        </div>
      </main>
    </div>
  </div>;
}
