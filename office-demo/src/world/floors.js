// Metres, Y up. Placement is independent of the supplied GLB files.
export const FLOOR_INFO = [
  {id:1,name:'Гости и события',short:'Гости',description:'Добро пожаловать. Встречи, знакомство с компанией и общие события.'},
  {id:2,name:'Бизнес и клиенты',short:'Бизнес',description:'Маркетинг, продажи и забота о клиентах.'},
  {id:3,name:'Продукт и технологии',short:'Продукт',description:'Разработка, дизайн, тестирование и ИТ.'},
  {id:4,name:'Управление и развитие',short:'Развитие',description:'Решения, поддержка сотрудников, обучение и наставничество.'}
];
export const NAV_BOUNDS={minX:-11.7,maxX:11.7,minZ:-9.7,maxZ:9.55,radius:.25,cellSize:.25};
export const BUILDING_BOUNDS={minX:-12,maxX:12,minZ:-10,maxZ:10};
export function rotatedFootprint(x,z,w,d,yaw=0){const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));return {x,z,w:w*c+d*s,d:w*s+d*c};}

function buildFloor(id){
  const objects=[],rooms=[],doors=[],interactions=[],npcs=[];let serial=0;
  const add=(assetId,x,z,y=0,yaw=0,options={})=>{
    const o={id:`f${id}-${assetId}-${serial++}`,assetId,roomId:null,position:[x,y,z],yaw,scale:[1,1,1],...options};objects.push(o);return o;
  };
  const solid=(asset,x,z,yaw=0,opts={})=>add(asset,x,z,0,yaw,{solid:true,...opts});
  const plant=(x,z,big=false)=>solid(big?'plant_broadleaf':'plant_slender',x,z,0,{collider:[.42,.42]});
  const wall=(x,z,length,yaw=0,full=false)=>add(full?'wall_module':'wall_half',x,z,0,yaw,{scale:[length/1.2,1,1],collider:rotatedFootprint(0,0,length,.22,yaw),solid:true,worldCollider:true});
  const glass=(x,z,length,yaw=0)=>add('glass_partition',x,z,0,yaw,{scale:[length/1.218,1,1],solid:true,collider:rotatedFootprint(0,0,length,.12,yaw),worldCollider:true});
  const line=(x1,z1,x2,z2,full=false)=>wall((x1+x2)/2,(z1+z2)/2,Math.hypot(x2-x1,z2-z1),Math.abs(z2-z1)>.01?Math.PI/2:0,full);
  const door=(x,z,yaw=0,title='Дверь')=>{
    const o=add('glass_door',x,z,0,yaw,{dynamic:true,scale:[1.42,1,1.42]});
    doors.push({id:o.id,x,z,yaw,width:1.49,title});return o;
  };
  const room=(roomId,name,x,z,department=roomId,description='Пространство для встреч и совместной работы.')=>rooms.push({id:roomId,name,x,z,department,description});
  const splitRoom=(side,z1,z2,roomId,name,doorZ,department=roomId)=>{
    const x=side*5.5;line(x,z1,x,doorZ-.742);line(x,doorZ+.742,x,z2);door(x,doorZ,side*Math.PI/2,name);
    if(z1===-4)line(x,z1,side*11.88,z1);
    if(z2<9.7)line(x,z2,side*11.88,z2);
    room(roomId,name,side*8.7,z1+.45,department);
    rooms.at(-1).bounds={minX:side<0?-12:5.5,maxX:side<0?-5.5:12,minZ:z1,maxZ:z2};
  };
  function npc(personId,asset,x,z,yaw=0){const o=add(asset,x,z,0,yaw,{dynamic:true,personId});npcs.push({id:personId,x,z,objectId:o.id});return o;}
  function seat(asset,x,z,yaw=0,occupied=false){
    const o=solid(asset,x,z,yaw,{collider:asset.startsWith('sofa')?[asset==='sofa_three'?2.05:1.5,.68]:[.56,.48]});
    if(!occupied){const dx=Math.sin(yaw),dz=Math.cos(yaw);interactions.push({id:o.id,type:'seat',title:'Сесть',x,z,yaw,exit:{x:x+dx*1.1,z:z+dz*1.1},radius:1.65});}
    return o;
  }
  function desk(x,z,personId=null,yaw=0){
    const transform=(dx,dz)=>[x+Math.cos(yaw)*dx+Math.sin(yaw)*dz,z-Math.sin(yaw)*dx+Math.cos(yaw)*dz];
    solid('desk_compact',x,z,yaw,{collider:[1.28,.7]});
    for(const [asset,dx,dz,y]of [['monitor',0,-.14,.803],['keyboard_mouse',-.1,.18,.803],['coffee_mug',-.46,.06,.803],['plant_desk',.46,-.15,.803]]){const p=transform(dx,dz);add(asset,p[0],p[1],y,yaw);}
    const p=transform(0,.88);seat('chair_task_green',p[0],p[1],yaw+Math.PI,!!personId);
    if(personId)npc(personId,personId==='anna'||personId==='polina'?'employee_seated_blond':'employee_seated',p[0],p[1],yaw+Math.PI);
  }
  function meeting(x,z,small=false,round=false){
    const table=round?'table_round':small?'table_meeting_small':'table_training';solid(table,x,z);
    add('plant_desk',x,z,round?.745:.811);
    for(const dx of (small||round?[-.6,.6]:[-1.1,0,1.1])){
      const clearance=round?1.15:1;
      seat('chair_meeting',x+dx,z+clearance,Math.PI);seat('chair_meeting',x+dx,z-clearance,0);
    }
    solid('presentation_screen',x,Math.max(-3.4,z-2.6));plant(x+2.4,z-1.9);plant(x-2.4,z+1.9);
  }
  function lounge(x,z){
    seat('sofa_three',x,z-1.1,0);seat('sofa_two',x+1.5,z, -Math.PI/2);
    solid('table_coffee',x,z+.3);add('plant_small_round',x,z+.3,.432);
    solid('bookshelf',x+2.1,z-1.4);plant(x+2.3,z+1.7);plant(x-2.2,z+1.7);
  }
  // Repeated GLB floor modules are batched by geometry/material by the renderer.
  for(let x=-11.5;x<12;x++)for(let z=-9.5;z<10;z++)
    add(id===1&&Math.abs(x)<1?'floor_light_tile':'floor_tile',x,z,-.03);
  // Explicit endpoints avoid the last repeated module overshooting the slab.
  line(-12,-9.8795,12,-9.8795);
  line(-11.8795,-9.8795,-11.8795,9.8795);line(11.8795,-9.8795,11.8795,9.8795);
  for(const side of [-1,1]){
    if(id===1)line(side*.965,9.8795,side*12,9.8795);
    for(let i=0;i<11;i++)add('window_section',side*11.88,-9.88+(i+.5)*19.76/11,.01,side*Math.PI/2,{scale:[19.76/11/1.84,1,.65]});
  }
  if(id!==1)line(-12,9.8795,12,9.8795);
  for(let i=0;i<13;i++)add('window_section',-11.88+(i+.5)*23.76/13,-9.88,.01,0,{scale:[23.76/13/1.84,1,.7]});
  for(const side of [-1,1])for(let z=-7;z<10;z+=3.2){
    add('wall_lamp',side*11.65,z,1.5,side>0?Math.PI/2:-Math.PI/2);
  }
  const entrance=id===1?add('entrance_double_door',0,9.88,0,0,{dynamic:true,entrance:true}):null;
  // Back service strip: stair / facilities / lift / kitchen / stair.
  for(const side of [-1,1]){
    solid('stair_u',side*10,-7.9,0,{collider:[2.5,3.85],scale:[.9,.78,.9]});
    line(side*8.35,-9.88,side*8.35,-5.8);
    line(side*11.88,-5.8,side*10.1,-5.8);line(side*8.35,-5.8,side*8.8,-5.8);
    interactions.push({id:'stairs-'+side,type:'stairs',title:'Выбрать этаж',x:side*9.45,z:-5.1,radius:1.8});
  }
  line(-8.35,-5.8,-6.842,-5.8);line(-5.358,-5.8,-3.3,-5.8);line(-3.3,-9.88,-3.3,-5.8);
  door(-6.1,-5.8,0,'Санузлы');
  for(const x of [-7.4,-4.4]){solid('toilet',x,-8.8,Math.PI);solid('washbasin',x,-6.5,0);add('bathroom_mirror',x,-6.5,1.2);}
  glass(-5.9,-8.9,2,Math.PI/2);
  solid('elevator_cabin',-1.35,-7.6,0,{collider:[1.65,1.8]});
  add('elevator_portal',-1.35,-6.7,0,0,{dynamic:true});
  interactions.push({id:'lift',type:'lift',title:'Выбрать этаж',x:-1.35,z:-5.55,radius:1.7});
  room('lift-label','Лифт',-1.35,-6.55,'lift');
  solid('coffee_counter',3.6,-8.9);solid('fridge_small',5.1,-8.9);add('coffee_machine',3.1,-8.85,.92);add('kettle',4,-8.85,.92);
  solid('table_cafe',4,-6.65);for(const x of [3.1,4.9])seat('stool_cafe',x,-6.65,x<4?Math.PI/2:-Math.PI/2);
  plant(7.45,-8.85);plant(6.9,-6.3);
  room('kitchen-'+id,id===1?'Кофе-зона':'Кухня',4,-8.35,'kitchen-'+id);
  rooms.at(-1).bounds={minX:1,maxX:8.35,minZ:-10,maxZ:-5.8};
  glass(1,-7.84,4.08,Math.PI/2);glass(1.7,-5.8,1.4);glass(6.225,-5.8,4.25);
  // All major branches share an open horizontal hallway at z=-4.9.
  if(id===1){
    splitRoom(-1,-4,2.2,'guest-meeting','Переговорная',-.2,'guest-meeting');meeting(-8.6,-1);
    splitRoom(-1,2.2,9.85,'guest-round','Встречи с гостями',5.2,'guest-round');meeting(-8.6,5.9,true,true);
    splitRoom(1,-4,5,'events','Общий зал',.3,'events');
    solid('presentation_screen',8.7,-2.9);
    for(const z of [-.9,.5,1.9,3.3])for(const x of [6.9,8.2,9.5,10.8])seat('chair_auditorium',x,z,Math.PI);
    plant(6.35,-2.6);plant(11.1,-2.6);
    splitRoom(1,5,9.85,'welcome','Онбординг',7,'welcome');solid('coat_rack',10.7,8.4);solid('cabinet_low',8.2,8.4);add('notice_frame',8.2,8.4,1.2);seat('armchair_waiting',7.1,8.4);
    solid('reception_counter',0,-.3,0,{collider:[2.2,.9]});add('monitor',.45,-.55,.782,Math.PI);add('desk_phone',-.65,-.15,1.021);add('plant_desk',.8,-.15,1.021);
    seat('chair_task_green',0,-1.25,0,true);npc('sofia','employee_seated_blond',0,-1.25);
    room('reception','Ресепшен',0,-.55,'reception');interactions.push({id:'reception',type:'reception',title:'Карта компании',x:0,z:1.05,radius:1.9});
    for(const side of [-1,1]){
      seat('sofa_two',side*3.65,6.3,-side*Math.PI/2);
      solid('table_side',side*3.65,7.6);add('plant_small_round',side*3.65,7.6,.54);
      plant(side*4.45,4.55);plant(side*4.45,8.55);
    }
    plant(-2.5,-.3);plant(2.5,-.3);
    for(const x of [-10.8,-7]){solid('bookshelf',x,-3.6);solid('cabinet_drawers',x,8.7);add('plant_desk',x,8.7,.7);}
    solid('bookshelf_low',10.7,4.4);add('plant_desk',10.7,4.4,.947);
    add('notice_frame',-4.8,3.1,1.0,Math.PI/2);add('notice_frame',4.8,3.1,1.0,-Math.PI/2);

  }else if(id===2||id===3){
    const engineering=id===3;
    splitRoom(-1,-4,engineering?.2:2.4,engineering?'qa':'marketing',engineering?'Тестирование':'Маркетинг',-1.8);
    desk(-9.9,-2.2,engineering?'roman':'polina');desk(-7.55,-2.2,engineering?null:'denis');
    plant(-11,-3.4);solid('whiteboard_vertical',-6.6,-3.2);
    if(engineering){
      splitRoom(-1,.2,4.4,'infrastructure','Серверная',2.25);
      for(const x of [-10.6,-9.4,-8.2])solid('server_rack',x,1.4);
      solid('cabinet_low',-10.5,3.6);
      splitRoom(-1,4.4,9.85,'it','ИТ-поддержка',7.3);
      desk(-9.9,6.3,'nikita');desk(-7.2,6.3);plant(-11,8.6);
    }else{
      splitRoom(-1,2.4,9.85,'sales','Продажи',5.1);
      desk(-9.9,4.6,'ilya');desk(-7.55,4.6);plant(-11,8.6);solid('table_cafe',-8.6,7.7);seat('armchair_waiting',-10.1,7.7,Math.PI/2);seat('armchair_waiting',-7.1,7.7,-Math.PI/2);
    }
    if(engineering){
      splitRoom(1,-4,1.3,'design','Дизайн',-1.6);desk(7.2,-2.1,'anna');desk(9.8,-2.1);solid('whiteboard_vertical',10.9,.3);plant(6.2,.3);
    }else{
      splitRoom(1,-4,1.3,'meeting-'+id,'Переговорная',-1.6);meeting(8.65,-1.5,true);
    }
    splitRoom(1,1.3,5.5,engineering?'meeting-3':'meeting-round-2',engineering?'Переговорная':'Малая переговорная',3.1);
    solid('table_round',8.7,3.3);add('plant_desk',8.7,3.3,.745);
    seat('chair_meeting',7.35,3.3,Math.PI/2);seat('chair_meeting',10.05,3.3,-Math.PI/2);
    splitRoom(1,5.5,9.85,'lounge-'+id,engineering?'Отдых':'Тихая комната',7);lounge(8.6,7.5);
    // Four small pods leave a continuous central corridor.
    let occupied=0;const persons=engineering?{0:'mark'}:{0:'eva'};
    for(const cx of [-2.8,2.8])for(const cz of [-1.4,5.1]){
      for(const dx of [-.7,.7])for(const side of [-1,1]){
        desk(cx+dx,cz+side*.4,persons[occupied++]||null,side>0?0:Math.PI);
      }
      solid('whiteboard_vertical',cx,cz-2.2);
      plant(cx,cz+2.2);
    }
    room(engineering?'engineering':'support',engineering?'Разработка':'Поддержка',-2.8,-2.1,engineering?'engineering':'support');
    if(!engineering)room('client-team','Клиентская команда',2.8,-2.1,'support');
  }else{
    splitRoom(-1,-4,3,'finance','Финансы',-1.6);desk(-9.8,-2);desk(-7.2,-2);solid('filing_cabinet',-11,1.8);plant(-6.5,1.8);
    splitRoom(-1,3,9.85,'people','Люди и культура',6.5);desk(-9.8,5.2);desk(-7.55,5.2);plant(-11,8.7);
    splitRoom(1,-4,.3,'director','Руководитель',-1.6);desk(8.7,-2,'artem');plant(11,-2.7);
    splitRoom(1,.3,4.4,'legal','Юристы',2.3);desk(7.2,1.6);desk(9.8,1.6);
    splitRoom(1,4.4,9.85,'mentoring','Наставничество',6.4);lounge(8.7,6.8);
    // Central rooms have a west corridor and two doors opening into it.
    line(-4.3,-4,5.5,-4);line(-4.3,-4,-4.3,-2.242);line(-4.3,-.758,-4.3,1.9);door(-4.3,-1.5,Math.PI/2,'Зал совещаний');
    line(-4.3,1.9,5.5,1.9);meeting(.5,-1);room('strategy','Обучение и совещания',.5,-3.3,'strategy');
    line(-4.3,1.9,-4.3,4.358);line(-4.3,5.842,-4.3,9.85);door(-4.3,5.1,Math.PI/2,'Обучение');
    for(const x of [-2,0,2,4])for(const z of [4,6.3,8.55]){
      solid('desk_classroom',x,z);seat('chair_training',x,z+.7,Math.PI);
    }
    solid('presentation_screen',.6,2.8);room('learning','Учебный класс',.5,3,'learning');
  }
  for(const o of objects){
    const [x,,z]=o.position;
    const room=rooms.find(r=>r.bounds&&x>=r.bounds.minX&&x<=r.bounds.maxX&&z>=r.bounds.minZ&&z<=r.bounds.maxZ);
    o.roomId??=room?.id||(z<-5.8?`services-${id}`:id===1?'reception':id===2?'support':id===3?'engineering':x>-4.3&&x<5.5?(z<1.9?'strategy':'learning'):'hall-4');
  }
  return {...FLOOR_INFO[id-1],objects,rooms,doors,interactions,npcs,spawn:{x:id===4?-4.9:0,z:8.9},liftSpawn:{x:-1.35,z:-4.7},entranceId:entrance?.id||null};
}
export const FLOORS=FLOOR_INFO.map(f=>buildFloor(f.id));
