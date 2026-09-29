import React from 'react';
import {Eye,MapTrifold,ArrowCounterClockwise,ArrowLeft,ArrowRight} from '@phosphor-icons/react';
import './first-person.css';
export function CameraToggle({mode,onToggle}){return <button className={'camera-toggle floating'+(mode==='first-person'?' active':'')} aria-label={mode==='first-person'?'Вернуться к виду сверху':'Вид от первого лица'} aria-pressed={mode==='first-person'} title="Сменить ракурс · V / М" onClick={onToggle}>{mode==='first-person'?<MapTrifold size={20}/>:<Eye size={20}/>}<span>{mode==='first-person'?'Сверху':'От первого лица'}</span><kbd>V</kbd></button>;}
export function FirstPersonGuide({mode,enabled,api}){return mode==='first-person'?<>
  <div className="first-person-reticle" aria-hidden="true"/>
  <div className="first-person-guide floating"><span>WASD · ходить</span><span>Потяните сцену · осмотр</span><span>E · действие</span><button aria-label="Посмотреть влево" disabled={!enabled} onClick={()=>api.current?.look(-90,0)}><ArrowLeft size={16}/></button><button aria-label="Выровнять взгляд" disabled={!enabled} onClick={()=>api.current?.reset()}><ArrowCounterClockwise size={16}/></button><button aria-label="Посмотреть вправо" disabled={!enabled} onClick={()=>api.current?.look(90,0)}><ArrowRight size={16}/></button></div>
</>:null;}
