import React,{useRef,useState,useEffect} from 'react';
import {createCityWorld} from './cityWorld.js';
import {guide} from '../guide/guideStore.js';
import {useGuide} from '../guide/GuideOverlay.jsx';
export function CityScene({api,location,spawn,overview,cameraMode,onCameraMode,inputEnabled,status,onAction,onProject,onNotice,onWalk,onView,onShelfFocus,selectedShelf,pharmacyDemo,argusDemo,tynyshDemo,onNearShelf,director,onBotEvent,onBotView}){
  const host=useRef(null),cb=useRef({}),labelNodes=useRef(new Map()),self=useRef(null),latest=useRef(null),markerKey=useRef(''),viewKey=useRef('');
  const guideState=useGuide();
  inputEnabled=inputEnabled&&!guideState.open;
  const [progress,setProgress]=useState(0),[error,setError]=useState(''),[hint,setHint]=useState(null),[markers,setMarkers]=useState([]);
  cb.current={onCameraMode,onAction,onProject,onNotice,onWalk,onView,onShelfFocus,inputEnabled,onNearShelf,onBotEvent,onBotView};
  function place(node,p){if(!node)return;const visibility=p?.visible?'visible':'hidden';if(node.style.visibility!==visibility)node.style.visibility=visibility;if(p?.visible){const transform=`translate3d(${p.x.toFixed(3)}px,${p.y.toFixed(3)}px,0) translate(-50%,-100%)`;if(node.style.transform!==transform)node.style.transform=transform;}}
  useEffect(()=>{
    let engine,detachGuide;
    cb.current.onNearShelf?.(null);
    try{engine=createCityWorld(host.current,{location,spawn,overview,cameraMode,onCameraMode:m=>cb.current.onCameraMode?.(m),director,onBotEvent:e=>cb.current.onBotEvent?.(e),onBotView:v=>cb.current.onBotView?.(v),onLoading:setProgress,onError:setError,onHint:h=>{setHint(h);cb.current.onNearShelf?.(h?.type==='shelf'?h.shelf:null);},
      onAction:a=>a.type==='guide'?guide.open():cb.current.onAction(a),onNotice:t=>cb.current.onNotice(t),onWalk:v=>cb.current.onWalk(v),
      onShelfFocus:id=>cb.current.onShelfFocus?.(id),
      onLabels:l=>{guide.beginRoute();guide.position(engine?.getGuidePosition?.());latest.current=l;for(const m of l.markers)place(labelNodes.current.get(m.id),m);place(self.current,l.me);const nextMarkers=JSON.stringify(l.markers.map(m=>[m.id,m.name]));if(markerKey.current!==nextMarkers){markerKey.current=nextMarkers;setMarkers(l.markers);}const nextView=l.zoom+'/'+l.overview;if(viewKey.current!==nextView){viewKey.current=nextView;cb.current.onView({zoom:l.zoom,overview:l.overview});}}
    });api.current=engine;detachGuide=guide.attachScene(engine,location);engine.setKeyboardEnabled(cb.current.inputEnabled);}catch(e){setError(e.message);setProgress(null);}
    return()=>{detachGuide?.();engine?.dispose();if(api.current===engine)api.current=null;};
  },[]);
  useEffect(()=>{api.current?.setKeyboardEnabled(inputEnabled);},[inputEnabled]);
  useEffect(()=>{api.current?.selectShelf(selectedShelf);},[selectedShelf]);
  useEffect(()=>{api.current?.setPharmacyDemo(pharmacyDemo);},[pharmacyDemo]);
  useEffect(()=>{api.current?.setArgusDemo(argusDemo);},[argusDemo]);
  useEffect(()=>{api.current?.setTynyshDemo(tynyshDemo);},[tynyshDemo]);
  return <><div className="scene" ref={host}/>
    {(progress!==null||error)&&<div className="world-loading floating" role={error?'alert':'status'}><span className="eyebrow">{location==='tynysh'?'TYNYSH':location==='autofix'?'AUTOFIX HUB':location==='pharmacy'?'АПТЕЧНАЯ CRM':location==='argus'?'ARGUS · AMI LAB':'ГОРОД ПРОЕКТОВ'}</span><strong>{error?'Не удалось открыть пространство':location==='tynysh'?'Готовим банкетный зал':location==='autofix'?'Открываем детейлинг':location==='pharmacy'?'Открываем аптеку':location==='argus'?'Открываем ARGUS':'Открываем квартал'}</strong>{error?<><p>{error}</p><button onClick={()=>window.location.reload()}>Повторить</button></>:<><p>{location==='tynysh'?'Расставляем столы и встречаем команду':location==='pharmacy'?'Готовим торговый зал и рекламные места':'Готовим здания, дорожки и входы'}</p><progress max="100" value={progress}/><small>{progress}%</small></>}</div>}
    {progress===null&&!error&&<div className="room-labels">
      {markers.map(m=><button key={m.id} className={'room-label city-marker'+(m.kind==='bot'?' bot-label':'')} ref={node=>{if(node){labelNodes.current.set(m.id,node);place(node,latest.current?.markers.find(a=>a.id===m.id));}else labelNodes.current.delete(m.id);}} onClick={()=>m.id==='city-guide'?guide.open():onProject(m.id)}>{m.name}</button>)}
      {!['pharmacy','tynysh'].includes(location)&&<button className="self-label" ref={node=>{self.current=node;place(node,latest.current?.me);}} onClick={()=>onAction({type:'profile'})}>Вы · {status}</button>}
    </div>}
    {hint&&inputEnabled&&progress===null&&<button className="interaction-hint floating" data-testid="city-interact" onClick={()=>api.current?.interact()}><kbd>E</kbd><span>{hint.title}</span></button>}
  </>;
}
