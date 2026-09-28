import React from 'react';
import {Pause,Play,Eye,Hand,Robot,ArrowRight} from '@phosphor-icons/react';

export function PharmacyBotControls({state,view,onControl,onTakeControl,compact=false}){
  const a=state.automation,paused=a.paused,error=view?.phase==='error';
  return <div className={'bot-process'+(compact?' compact':'')} aria-label="Работа команды ботов">
    <div className="bot-process-title"><span className={'bot-live-dot'+(paused?' paused':'')}/><span>{error?'Нужна помощь':paused?'Сценарий на паузе':'Команда выполняет заявку'}</span><Robot size={18}/></div>
    <h2>{view?.name||'Команда аптеки'}</h2><p className="bot-current-action" role="status">{view?.text||'Заявка передана команде'}</p>
    <div className="bot-progress-track" aria-hidden="true"><i style={{width:Math.round((view?.progress??.08)*100)+'%'}}/></div>
    <div className="bot-meta"><span>Полка {state.request.shelf}</span><span>{a.scenario==='reshoot'?'Сценарий с пересъёмкой':'Автоматический сценарий'}</span></div>
    <div className="bot-playback"><button onClick={()=>onControl({paused:!paused})} aria-label={paused?'Продолжить работу ботов':'Приостановить работу ботов'}>{paused?<Play size={16} weight="fill"/>:<Pause size={16} weight="fill"/>}{paused?'Продолжить':'Пауза'}</button><div aria-label="Скорость сценария">{[1,2].map(speed=><button key={speed} aria-label={'Скорость '+speed+'x'} aria-pressed={a.speed===speed} onClick={()=>onControl({speed})}>{speed}×</button>)}</div></div>
    <button className={'bot-follow'+(a.follow?' selected':'')} aria-pressed={a.follow} onClick={()=>onControl({follow:!a.follow})}><Eye size={17}/>{a.follow?'Камера следует за сотрудником':'Следить за сотрудником'}</button>
    <button className="bot-takeover" onClick={onTakeControl}><Hand size={16}/>Взять управление<ArrowRight size={14}/></button>
    {!compact&&<small>Гуляйте по аптеке — работа продолжается. Выход в город приостанавливает сценарий.</small>}
  </div>;
}
