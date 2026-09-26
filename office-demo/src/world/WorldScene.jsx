import React,{useEffect,useRef,useState} from 'react';
import {ArrowClockwise,ArrowUpRight,WarningCircle} from '@phosphor-icons/react';
export function WorldScene({api,onPerson,onNotice,onWalk,onDept,onZoom,onFloor,onCompany,status,walk,selectedId,inputEnabled}){
  const host=useRef(null),zoomRef=useRef(100),[labels,setLabels]=useState({rooms:[],me:null}),[loading,setLoading]=useState({progress:0,floor:1}),[hint,setHint]=useState(null),[fatal,setFatal]=useState('');
  const positions=useRef(null),roomNodes=useRef(new Map()),selfNode=useRef(null),labelSignature=useRef('');
  function placeLabel(node,p){
    if(!node)return;
    node.style.visibility=p?.visible?'visible':'hidden';
    if(p)node.style.transform=`translate3d(${p.x.toFixed(3)}px,${p.y.toFixed(3)}px,0) translate(-50%,-100%)`;
  }
  const cb=useRef({});cb.current={onPerson,onNotice,onWalk,onDept,onZoom,onFloor,onCompany,inputEnabled};
  useEffect(()=>{
    let cancelled=false,office=null;
    import('./officeWorld.js').then(({createOffice})=>{
      if(cancelled)return;
      office=createOffice(host.current,{
        onPerson:id=>cb.current.onPerson(id),onDepartment:id=>cb.current.onDept(id),onCompany:()=>cb.current.onCompany(),
        onNotice:t=>cb.current.onNotice(t),onWalk:w=>cb.current.onWalk(w),onFloor:id=>cb.current.onFloor(id),onHint:setHint,onLoading:setLoading,
        onLabels:l=>{
          positions.current=l;
          // Same frame as the WebGL camera. React only owns content, never per-frame positions.
          for(const r of l.rooms)placeLabel(roomNodes.current.get(r.key),r);
          placeLabel(selfNode.current,l.me);
          const signature=l.rooms.map(r=>r.key+':'+r.name).join('|');
          if(signature!==labelSignature.current){labelSignature.current=signature;setLabels({rooms:l.rooms});}
          if(l.zoom!==zoomRef.current){zoomRef.current=l.zoom;cb.current.onZoom(l.zoom);}
        }
      });
      api.current=office;office.setKeyboardEnabled(cb.current.inputEnabled);
    }).catch(e=>{if(!cancelled){setLoading(null);setFatal(e.message||'Не удалось запустить 3D-офис.');}});
    return()=>{cancelled=true;office?.dispose();if(api.current===office)api.current=null;};
  },[]);
  useEffect(()=>{api.current?.setKeyboardEnabled(inputEnabled);},[inputEnabled]);
  return <>
    <div className="scene" ref={host}/>
    {loading&&<div className="world-loading floating" role="status">{loading.error?<><WarningCircle size={24}/><strong>{loading.error}</strong><button onClick={()=>api.current?.changeFloor(loading.floor)}><ArrowClockwise size={17}/>Повторить</button></>:<><span className="eyebrow">НАШ ОФИС</span><strong>Готовим {loading.floor} этаж</strong><p>Расставляем мебель и открываем двери</p><progress max="100" value={loading.progress}/><small>{loading.progress}%</small></>}</div>}
    {fatal&&<div className="world-loading floating" role="alert"><WarningCircle size={28}/><strong>Офис не удалось открыть</strong><p>{fatal}</p><button onClick={()=>window.location.reload()}>Попробовать снова</button></div>}
    {!loading&&!fatal&&<div className="room-labels" aria-label="Отделы офиса">
      {labels.rooms.map(r=><button key={r.key} ref={node=>{if(node){roomNodes.current.set(r.key,node);placeLabel(node,positions.current?.rooms.find(p=>p.key===r.key));}else roomNodes.current.delete(r.key);}} className={'room-label'+(selectedId===r.id?' selected':'')} style={{left:0,top:0}} onClick={()=>onDept(r.id)}>{r.name}<ArrowUpRight size={13}/></button>)}
      <button ref={node=>{selfNode.current=node;placeLabel(node,positions.current?.me);}} className="self-label" style={{left:0,top:0}} onClick={()=>onPerson('alexey')}>Вы · {status}</button>
    </div>}
    {hint&&inputEnabled&&!loading&&<button className="interaction-hint floating" data-testid="interact-button" onClick={()=>api.current?.interact()}><kbd>E</kbd><span>{hint.label}</span></button>}
  </>;
}
