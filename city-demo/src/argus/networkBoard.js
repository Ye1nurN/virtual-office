import * as T from 'three';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {House,Lightning,ShieldCheck,Broadcast,ArrowRight} from '@phosphor-icons/react';
import {METERS} from './experiment.js';

// The wall is a real 3D pickable surface. Its live diagram uses the same nodes
// and evidence as the accessible HTML inspector, with library icons.
export function createNetworkBoard(){
  const root=new T.Group(),canvas=document.createElement('canvas');canvas.width=1800;canvas.height=630;
  const c=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
  const geometry=new T.PlaneGeometry(18,6.3),material=new T.MeshBasicMaterial({map:texture,toneMapped:false}),screen=new T.Mesh(geometry,material);
  root.add(screen);
  const icons={},targets=METERS.map((m,i)=>({id:m.id,x:210,y:172+i*111,w:380,h:94}));
  let state=null,disposed=false;
  const mint='#7ee0c5',amber='#ffc16d',white='#edf4f8',muted='#a7bacb';
  const text=(s,x,y,size=25,color=white,weight=500)=>{c.fillStyle=color;c.font=weight+' '+size+'px Inter, Arial';c.textAlign='left';c.fillText(s,x,y);};
  const rect=(x,y,w,h,color,r=12)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
  const icon=(name,x,y,size)=>{if(icons[name])c.drawImage(icons[name],x,y,size,size);};
  function draw(next=state){
    if(!next)return;state=next;
    c.fillStyle='#142b3e';c.fillRect(0,0,1800,630);
    text(next.complete?'Источник повтора подтверждён':'Повторяются сообщения',520,51,40,white,700);
    rect(520,79,655,53,next.complete?'#214d46':'#5a3e2e');
    text(next.complete?'Счётчик 031 · совпадают номер и время':'Один узел отправляет старые данные',542,114,27,next.complete?mint:amber);
    text('AMI / СЕТЬ СЧЁТЧИКОВ',42,52,21,muted,600);
    for(const [i,m] of METERS.entries()){
      const y=172+i*111,col=m.suspect?amber:mint,selected=next.selected===m.id;
      rect(40,y-26,392,91,selected?'#345366':'#1b364b');
      if(selected){c.strokeStyle=col;c.lineWidth=3;c.strokeRect(41,y-25,390,89);}
      icon('house',58,y-15,58);icon('meter',141,y-13,48);
      text('Счётчик '+m.id,210,y+2,30,col,650);text(m.suspect?(next.complete?'Повтор найден':'Есть сигнал'):'Штатный поток',210,y+33,24,muted);
      c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(445,y+12);c.lineTo(560,y+12);c.lineTo(845,335);c.lineTo(935,335);c.stroke();
    }
    rect(920,274,145,123,'#234961');icon('gateway',956,284,72);text('gateway-002',924,435,27);
    c.strokeStyle=mint;c.lineWidth=4;c.beginPath();c.moveTo(1065,335);c.lineTo(1280,335);c.stroke();
    icon('arrow',1215,310,49);icon('shield',1278,277,108);text('ARGUS',1290,435,28,white,700);
    c.fillStyle='#315064';c.fillRect(1460,150,2,385);
    text('Поток данных AMI',1500,192,24,white,600);
    c.strokeStyle=mint;c.lineWidth=5;c.beginPath();c.moveTo(1502,235);c.lineTo(1542,235);c.stroke();text('Обычный',1562,242,27,muted);
    c.fillStyle=amber;for(let i=0;i<3;i++)c.fillRect(1502+i*14,274,7,7);text('Повторы',1562,286,27,muted);
    icon('house',1500,353,33);text('Счётчик',1552,380,27,muted);
    icon('gateway',1500,417,33);text('Шлюз',1552,444,27,muted);
    icon('shield',1500,481,33);text('ARGUS',1552,508,27,muted);
    text('Выберите счётчик на схеме, чтобы исследовать его сообщения',42,605,21,muted);
    texture.needsUpdate=true;
  }
  for(const [name,Component] of Object.entries({house:House,meter:Lightning,shield:ShieldCheck,gateway:Broadcast,arrow:ArrowRight})){
    const img=new Image();img.onload=()=>{if(!disposed){icons[name]=img;draw();}};
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(renderToStaticMarkup(React.createElement(Component,{size:96,color:'#c3eee6',weight:'duotone'})));
  }
  document.fonts.ready.then(()=>{if(!disposed)draw();});
  const packets=[],g=new T.BoxGeometry(.072,.072,.026),mintMat=new T.MeshBasicMaterial({color:mint}),amberMat=new T.MeshBasicMaterial({color:amber});
  for(let row=0;row<4;row++)for(let n=0;n<4;n++){const mesh=new T.Mesh(g,row===0?amberMat:mintMat);root.add(mesh);packets.push({mesh,row,offset:n/4});}
  const uvPoint=(x,y)=>new T.Vector3((x/1800-.5)*18,(.5-y/630)*6.3,.025);
  function animate(clock){
    for(const p of packets){
      const start=uvPoint(445,184+p.row*111),bend=uvPoint(560,184+p.row*111),end=uvPoint(930,335),t=(clock*.19+p.offset)%1;
      p.mesh.position.copy(t<.25?start.lerp(bend,t/.25):bend.lerp(end,(t-.25)/.75));
    }
  }
  return {root,screen,texture,draw,animate,pick(uv){const x=uv.x*1800,y=(1-uv.y)*630;return targets.find(t=>x>=40&&x<=435&&y>=t.y-26&&y<=t.y+65)?.id;},dispose(){disposed=true;texture.dispose();}};
}
