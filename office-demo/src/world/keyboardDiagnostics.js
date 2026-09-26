// Explicit opt-in only. This report stays in memory on this page; no telemetry.
export function createKeyboardDiagnostics(container,canvas){
  if(new URLSearchParams(window.location.search).get('keyboard')!=='1')return null;
  const root=document.createElement('section');root.className='keyboard-check floating';
  root.setAttribute('aria-label','Проверка клавиатуры');
  const heading=document.createElement('strong');heading.textContent='Проверка D / В / →';
  const instructions=document.createElement('p');
  instructions.textContent='Нажмите «Начать», затем D / В и стрелку →. Скопируйте результат, если D не работает.';
  const live=document.createElement('output');live.textContent='Ожидаем нажатия. Проверка работает только в этой вкладке.';
  const position=document.createElement('small');
  const actions=document.createElement('div');actions.className='keyboard-check-actions';
  const start=document.createElement('button');start.textContent='Начать проверку';
  const copy=document.createElement('button');copy.textContent='Скопировать результат';
  const close=document.createElement('button');close.textContent='Закрыть проверку';
  const result=document.createElement('textarea');result.readOnly=true;result.hidden=true;
  result.setAttribute('aria-label','Результат проверки клавиатуры');
  const privacy=document.createElement('small');privacy.textContent='Текст из поиска и чата не записывается. Данные никуда не отправляются.';
  actions.append(start,copy,close);root.append(heading,instructions,live,position,actions,result,privacy);
  container.appendChild(root);
  let events=[],frames=[],latest=null,origin=null,closed=false;
  const names={accepted:'принята',released:'отпущена',unmapped:'не распознана',shortcut:'сочетание с Ctrl / Alt / Meta',composition:'ввод IME',paused:'управление временно выключено',stop:'остановка',camera:'сброс камеры'};
  function report(){return JSON.stringify({version:'keyboard-check-1',origin,position:latest,events,frames},null,2);}
  start.onclick=()=>{events=[];frames=[];origin=latest?{...latest}:null;result.hidden=true;live.textContent='Нажмите D / В, затем →.';canvas.focus({preventScroll:true});};
  copy.onclick=async()=>{
    result.value=report();result.hidden=false;result.focus();result.select();
    try{await navigator.clipboard.writeText(result.value);copy.textContent='Скопировано';}
    catch{copy.textContent='Выделено — нажмите Ctrl+C';}
  };
  close.onclick=()=>{closed=true;events=[];frames=[];root.remove();canvas.focus({preventScroll:true});};
  return {
    input(event){
      if(closed||event.result==='text-entry')return;
      events.push({...event,position:latest?{...latest}:null});if(events.length>32)events.shift();
      live.textContent=`${event.phase==='down'?'Нажатие':'Отпускание'} ${event.key||'без буквы'} · code: ${event.code||'нет'} · ${names[event.result]||event.result} · ${event.resolved||'нет направления'}`;
    },
    frame(state){
      if(closed)return;
      const snapshot={...state,x:+state.x.toFixed(3),z:+state.z.toFixed(3)};
      if(latest&&(snapshot.x!==latest.x||snapshot.z!==latest.z||snapshot.blocked!==latest.blocked)){
        frames.push(snapshot);if(frames.length>16)frames.shift();
      }
      latest=snapshot;
      position.textContent=`Этаж ${state.floor} · X ${snapshot.x} · Z ${snapshot.z} · ${state.blocked?'движение остановлено препятствием':state.moved?'персонаж движется':'персонаж стоит'}`;
    },
    dispose(){closed=true;events=[];frames=[];root.remove();}
  };
}
