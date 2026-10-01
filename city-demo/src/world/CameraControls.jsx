import React,{useEffect,useState} from 'react';
import {Eye,MapTrifold,ArrowCounterClockwise,ArrowLeft,ArrowRight} from '@phosphor-icons/react';
import './first-person.css';
export function CameraToggle({mode,onToggle}){return <button className={'camera-toggle floating'+(mode==='first-person'?' active':'')} aria-label={mode==='first-person'?'Вернуться к виду сверху':'Вид от первого лица'} aria-pressed={mode==='first-person'} title="Сменить ракурс · V / М" onClick={onToggle}>{mode==='first-person'?<MapTrifold size={20}/>:<Eye size={20}/>}<span>{mode==='first-person'?'Сверху':'От первого лица'}</span><kbd>V</kbd></button>;}
export function FirstPersonGuide({mode,enabled,api}){
  const [locked,setLocked]=useState(false),[denied,setDenied]=useState(false);
  const mouseLock=typeof document!=='undefined'&&'requestPointerLock' in document.documentElement&&window.matchMedia('(pointer: fine)').matches;
  useEffect(()=>{
    const change=()=>{setLocked(!!document.pointerLockElement);setDenied(false);};
    const error=()=>setDenied(true);change();
    document.addEventListener('pointerlockchange',change);document.addEventListener('pointerlockerror',error);
    return()=>{document.removeEventListener('pointerlockchange',change);document.removeEventListener('pointerlockerror',error);};
  },[mode]);
  return mode==='first-person'?<>
  <div className="first-person-reticle" aria-hidden="true"/>
  <div className="first-person-guide floating"><span>WASD · ходить</span><span>{locked?'Мышь · осмотр':mouseLock&&!denied?'Клик по сцене · захват мыши':'Потяните сцену · осмотр'}</span>{locked&&<span>Esc · курсор</span>}<span>E · действие</span><button aria-label="Посмотреть влево" disabled={!enabled} onClick={()=>api.current?.look(-90,0)}><ArrowLeft size={16}/></button><button aria-label="Выровнять взгляд" disabled={!enabled} onClick={()=>api.current?.reset()}><ArrowCounterClockwise size={16}/></button><button aria-label="Посмотреть вправо" disabled={!enabled} onClick={()=>api.current?.look(90,0)}><ArrowRight size={16}/></button></div>
</>:null;}
