import React,{useEffect,useRef,useState} from 'react';
import {CaretDown,MagnifyingGlass,Microphone,VideoCamera,MonitorArrowUp} from '@phosphor-icons/react';
import {statusClass} from './data';

const W=1280,H=910,asset='/assets/approved-design.png';
const chrome=[[17,16,219,42],[266,16,279,42],[891,16,237,42],[1139,16,42,42],[1194,16,70,42],[394,826,494,57],[1090,842,120,42],[1222,842,42,42]];
const rect=(x,y,w,h)=>({left:`${x/W*100}%`,top:`${y/H*100}%`,width:`${w/W*100}%`,height:`${h/H*100}%`});
const rooms=[['engineering','Разработка',223,125,105,29],['meeting','Переговорная',599,109,120,29],['marketing','Маркетинг',975,125,107,29],['people','Люди и культура',179,470,144,29],['support','Поддержка',998,470,100,29]];
const colleagues=[['alexey','Алексей Морозов',123,268,74,76],['anna','Анна Смирнова',360,225,55,89],['mark','Марк Ким',270,343,56,75],['artem','Артём Беляев',604,163,43,64],['polina','Полина Лебедева',1012,226,49,59],['denis','Денис Волков',1071,256,53,78],['sofia','София Орлова',282,581,48,77],['ilya','Илья Петров',134,605,53,73],['nikita','Никита Соколов',966,558,55,75],['eva','Ева Иванова',986,647,60,78],['roman','Роман Власов',550,549,53,82],['alexey','Алексей — у входа',626,749,58,79]];
function Hit({box,label,onClick,children,className='',...rest}){return <button type="button" className={'reference-hit '+className} style={rect(...box)} aria-label={label} title={label} onClick={onClick} {...rest}>{children||<span className="sr-only">{label}</span>}</button>;}

export function ReferenceOffice({api,view,openView,openPerson,openDept,openChat,menu,setMenu,query,setQuery,searchOpen,setSearchOpen,searchRef,status,mic,cam,sharing,toggleMic,toggleCam,toggleShare,openNotifications,read,onZoom}){
  const [zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),[selected,setSelected]=useState(null);
  const drag=useRef(null),worldRef=useRef(null),wasDragged=useRef(false);
  useEffect(()=>{const adapter={zoom(delta){setZoom(z=>{const next=Math.max(1,Math.min(1.8,Math.round((z+delta)*10)/10));return next<1.3?(delta>0?1.3:1):next;});setPan({x:0,y:0});},reset(){setZoom(1);setPan({x:0,y:0});setSelected(null);},locate(id){setZoom(1);setPan({x:0,y:0});setSelected(id);},setKeyboardEnabled(){},dispose(){}};api.current=adapter;return()=>{if(api.current===adapter)api.current=null;};},[]);
  useEffect(()=>{onZoom(Math.round(zoom*100));if(zoom===1)setPan({x:0,y:0});},[zoom]);
  const transform={transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`};
  function pointerDown(e){wasDragged.current=false;if(e.button!==0||zoom<=1)return;drag.current={x:e.clientX,y:e.clientY,xOffset:pan.x,yOffset:pan.y};}
  function pick(fn){if(wasDragged.current){wasDragged.current=false;return;}fn();}
  return <>
    <img className="approved-design-image" src={asset} alt="Дневной виртуальный офис с отделами разработки, маркетинга, поддержки, людей и культуры и общей переговорной." draggable="false"/>
    <div ref={worldRef} className={'reference-world '+(zoom>1?'is-zoomed':'')} onPointerDown={pointerDown} onPointerMove={e=>{if(!drag.current)return;const sx=e.clientX-drag.current.x,sy=e.clientY-drag.current.y;if(Math.abs(sx)+Math.abs(sy)>4)wasDragged.current=true;const maxX=worldRef.current.clientWidth*(zoom-1)/2,unit=worldRef.current.clientHeight/H,minY=(H-446.5-(825-446.5)*zoom)*unit,maxY=((446.5-68)*zoom-446.5)*unit;setPan({x:Math.max(-maxX,Math.min(maxX,drag.current.xOffset+sx)),y:Math.max(minY,Math.min(maxY,drag.current.yOffset+sy))});}} onPointerUp={()=>{drag.current=null;}} onPointerLeave={()=>{drag.current=null;}}>
      <div className="reference-world-content" style={transform}>
        {zoom>1&&<img className="reference-zoom-image" src={asset} alt="" draggable="false"/>}
        {rooms.map(([id,label,x,y,w,h])=><Hit key={id} box={[x,y,w,h]} label={label} className="room-hit" onClick={()=>pick(()=>openDept(id))}/>)}
        {colleagues.map(([id,label,x,y,w,h],i)=><Hit key={i} box={[x,y,w,h]} label={label} className={'person-hit'+(selected===id?' is-located':'')} onClick={()=>pick(()=>openPerson(id))}/>)}
        <Hit box={[118,229,89,28]} label={'Мой профиль · '+status} className={status!=='Фокус'?'changed-self-status':''} onClick={()=>openPerson('alexey')}>{status!=='Фокус'&&<>Вы · {status}</>}</Hit>
      </div>
    </div>
    {zoom>1&&chrome.map(([x,y,w,h],i)=><div key={i} className="reference-static-chrome" style={rect(x,y,w,h)} aria-hidden="true"><img src={asset} alt="" style={{width:`${W/w*100}%`,height:`${H/h*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div>)}
    <Hit box={[17,16,219,42]} label="Наш офис Демо" onClick={()=>setMenu(menu==='company'?null:'company')} aria-expanded={menu==='company'}/>
    <nav className={'reference-navigation '+(view==='office'?'at-rest':'')} style={rect(266,16,279,42)} aria-label="Основная навигация">{[['office','Офис'],['team','Команда'],['growth','Развитие']].map(([id,label])=><button key={id} onClick={()=>openView(id)} className={view===id?'selected':''} aria-current={view===id?'page':undefined}>{label}</button>)}</nav>
    <div className={'reference-search '+(searchOpen||query?'is-open':'')} style={rect(891,16,237,42)}><MagnifyingGlass size={18}/><input ref={searchRef} aria-label="Найти человека или отдел" placeholder="Найти человека или отдел" value={query} onFocus={()=>{setSearchOpen(true);setMenu(null);}} onChange={e=>setQuery(e.target.value)}/></div>
    <Hit box={[1139,16,42,42]} label="Уведомления" onClick={openNotifications}/>
    {read&&<span className="reference-read-dot" style={rect(1158,23,13,13)}/>}
    <Hit box={[1194,16,70,42]} label="Мой профиль" onClick={()=>setMenu(menu==='profile'?null:'profile')} aria-expanded={menu==='profile'}/>
    <Hit box={[405,831,125,45]} label="Алексей · Авторизация" onClick={()=>openPerson('alexey')}/>
    <Hit box={[543,837,96,36]} label={'Мой статус: '+status} className={status!=='Фокус'?'changed-status':''} onClick={()=>setMenu(menu==='status'?null:'status')} aria-expanded={menu==='status'}>{status!=='Фокус'&&<><i className={'status-dot '+statusClass[status]}/>{status}<CaretDown size={12}/></>}</Hit>
    <Hit box={[667,834,40,40]} label={mic?'Выключить микрофон':'Включить микрофон'} className={mic?'changed-media':''} onClick={toggleMic}>{mic&&<Microphone size={21}/>}</Hit>
    <Hit box={[721,834,40,40]} label={cam?'Выключить камеру':'Включить камеру'} className={cam?'changed-media':''} onClick={toggleCam}>{cam&&<VideoCamera size={21}/>}</Hit>
    <Hit box={[777,834,40,40]} label="Открыть сообщения" onClick={()=>openChat()}/>
    <Hit box={[830,834,40,40]} label={sharing?'Остановить демонстрацию':'Демонстрация экрана'} className={sharing?'changed-media':''} onClick={toggleShare}>{sharing&&<MonitorArrowUp size={21}/>}</Hit>
    <Hit box={[1092,844,34,36]} label="Уменьшить масштаб" disabled={zoom===1} onClick={()=>api.current?.zoom(-.1)}/>
    <Hit box={[1125,848,53,29]} label="Сбросить масштаб" className={zoom!==1?'changed-zoom':''} onClick={()=>api.current?.reset()}>{zoom!==1&&`${Math.round(zoom*100)}%`}</Hit>
    <Hit box={[1178,844,30,36]} label="Увеличить масштаб" disabled={zoom>=1.8} onClick={()=>api.current?.zoom(.1)}/>
    <Hit box={[1222,842,42,42]} label="Показать весь офис" onClick={()=>api.current?.reset()}/>
  </>;
}
