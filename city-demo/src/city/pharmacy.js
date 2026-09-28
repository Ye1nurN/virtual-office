import * as T from 'three';
import {createSceneKit,noise} from './sceneKit.js';
import {SHELVES} from './catalog.js';
import {PHARMACY_FIXTURES,pharmacyObstacles,PHARMACY_EXIT} from './pharmacyLayout.js';
import {createCampaignDisplay} from './pharmacyCampaignDisplay.js';

const oak='#c79455',edge='#996636',cream='#e3dac5',sage='#8cae98',metal='#53616a';
const cartons=['#3d9cb5','#edbc55','#69a16e','#ddd8cd','#b77fab','#e88d65','#77bac3','#668fc5'];

export function buildPharmacy(templates){
  const k=createSceneKit(templates),glass=new T.MeshStandardMaterial({color:'#d3eee4',transparent:true,opacity:.18,roughness:.19,metalness:.12,depthWrite:false});
  function local(x,z,yaw=0){return (u,y,v,w,h,d,col)=>k.box(x+u*Math.cos(yaw)+v*Math.sin(yaw),y,z-u*Math.sin(yaw)+v*Math.cos(yaw),w,h,d,col,yaw);}
  function label(text,x,y,z,w,h,{yaw=0,color='#fff7dc',background=null}={}){
    if(background)return k.sign(text,x,y,z,w,h,{bg:background,fg:color,yaw});
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
    const lines=text.split('\n');ctx.font=`700 ${c.height/lines.length*.82}px Arial`;
    lines.forEach((line,i)=>ctx.fillText(line,512,c.height/lines.length*(i+.5),1000));
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;k.textures.push(map);
    const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,transparent:true,side:T.DoubleSide,depthWrite:false,toneMapped:false}));
    panel.position.set(x,y,z);panel.rotation.y=yaw;k.root.add(panel);return panel;
  }
  function cross(x,y,z,s,yaw=0,lit=false){
    const b=local(x,z,yaw),white=lit?k.glow('#b0ffe3',1.5):'#d4e6d4',green=lit?k.glow('#129b6b',.7):'#248b72';
    b(0,y,0,s,s*.36,.13,white);b(0,y,0,s*.36,s,.13,white);
    b(0,y,.08,s*.84,s*.24,.08,green);b(0,y,.08,s*.24,s*.84,.08,green);
  }
  function stock(b,u,y,v,seed,maxHeight=.45){
    const h=maxHeight*(.77+noise(seed)*.23),w=.20+noise(seed+14)*.075,col=cartons[Math.floor(noise(seed+31)*cartons.length)];
    b(u,y+h/2,v,w,h,.25,noise(seed+10)>.3?col:'#f1ebd9');
    b(u,y+h*.83,v+.134,w*.95,h*.30,.012,col);
    b(u,y+h*.35,v+.139,w*.91,h*.37,.014,'#fff9e4');
    b(u-w*.24,y+h*.36,v+.15,w*.18,h*.2,.012,col);
    b(u+w*.14,y+h*.43,v+.15,w*.33,.018,.012,'#879496');
    b(u+w*.14,y+h*.30,v+.15,w*.33,.014,.012,'#a6aaa0');
    b(u,y+h+.008,v,w,.025,.25,col);
  }
  function cabinet(f){
    const yaw=f.yaw||0,w=yaw?f.d:f.w,d=yaw?f.w:f.d,h=f.height,b=local(f.x,f.z,yaw);
    b(0,h/2,-d/2+.09,w,h,.18,oak);
    b(0,.12,0,w+.08,.24,d,edge);
    for(const u of [-w/2+.07,w/2-.07]){b(u,h/2,0,.15,h,d,oak);b(u+.035,h/2,d/2+.018,.065,h,.035,'#d0a263');}
    b(0,h-.06,0,w+.1,.15,d+.08,oak);
    // Shallow oak trim and board seams give the cabinets depth at walking distance.
    for(let i=0;i<4;i++)b(0,h+.019,-d*.37+i*d*.245,w-.1,.012,.018,'#b3854e');
    for(const u of [-w/2+.1,w/2-.1])b(u,h/2,d/2+.04,.034,h-.18,.035,'#e2b67b');
    const drawers=Math.max(2,Math.round(w/1.2));
    for(let i=0;i<drawers;i++){const u=-w/2+(i+.5)*w/drawers;b(u,.43,d/2-.025,w/drawers-.065,.48,.14,cream);b(u,.56,d/2+.07,.25,.045,.055,'#a59066');}
    const top=h-(f.label?.43:.15),rowH=(top-.74)/4;
    for(let row=0;row<4;row++){
      const y=.71+row*rowH;b(0,y,0,w-.15,.10,d,'#d0b17e');b(0,y,d/2+.012,w-.15,.07,.055,'#e5d8bb');
      for(let i=0;i<Math.floor((w-.28)/.3);i++){const u=-w/2+.26+i*.3;stock(b,u,y+.06,d/2-.16,Math.round(f.x*37+f.z*31)+row*73+i*3,rowH*.81);}
    }
    if(f.label){
      const v=d/2+.04;label(f.label,f.x+v*Math.sin(yaw),h-.3,f.z+v*Math.cos(yaw),w-.25,.32,{yaw,color:'#236a5a',background:'#f3e8ca'});
      b(0,h-.51,d/2-.07,w-.28,.04,.055,k.glow('#ffe2a5',1.5));
    }
  }
  function island(f){
    // Both faces contain products; people can walk completely around the island.
    const b=local(f.x,f.z),w=f.w,d=f.d,h=f.height;
    b(0,.12,0,w+.14,.24,d+.12,edge);b(0,h/2,0,w-.12,h,.15,oak);
    for(const side of [-1,1]){
      const face=local(f.x,f.z,side===1?0:Math.PI);
      face(0,.41,d/2-.04,w-.12,.45,.13,cream);
      for(const u of [-w*.25,w*.25])face(u,.49,d/2+.04,.28,.045,.06,'#9a8459');
      for(let row=0;row<3;row++){
        const y=.68+row*(h-.93)/3;face(0,y,d/4,w,.1,d/2,'#d5b37b');
        for(let i=0;i<Math.floor((w-.2)/.29);i++)stock(face,-w/2+.23+i*.29,y+.06,d/2-.14,41+row*83+i*7+side*13);
      }
    }
    for(const u of [-w/2,w/2])b(u,h/2,0,.12,h,d+.1,oak);
    label(f.label,f.x,h+.1,f.z+d/2+.04,w-.08,.35,{background:'#f5ead1',color:f.id==='promo'?'#be483c':'#266b5a'});
    for(let i=0;i<Math.floor(w/.43);i++)stock(b,-w/2+.25+i*.43,h-.04,-.12,90+i*19);
  }
  // A cutaway shop with solid lower walls, real window openings and a clear central entrance.
  // A narrow pavement edge anchors the shop in the city instead of a floating slab.
  k.box(0,-.34,0,23,.16,18.5,'#abb4ad');
  for(let x=-11.1;x<11.5;x+=.9)for(let z=-8.85;z<9.2;z+=.9){if(Math.abs(x)>9||Math.abs(z)>7)k.box(x,-.24,z,.87,.045,.87,noise(x*5+z)> .5?'#b7c0ba':'#acb6b1');}
  k.box(0,-.24,0,18.4,.45,14.4,'#767b75');
  k.box(0,-.05,0,18,.12,14,'#b9b3a5');
  const tileMats=['#efdfc5','#e7d7bc','#eddcc0','#e9d8bb'].map(color=>new T.MeshStandardMaterial({color,roughness:.5}));
  for(let x=-8.55;x<9;x+=.9)for(let z=-6.5625;z<7;z+=.875)k.box(x,.025,z,.88,.055,.855,tileMats[Math.floor(noise(x*11+z*9)*4)]);
  k.box(0,2.85,-6.96,18,5.7,.2,sage);k.box(0,.15,-6.8,18,.24,.13,edge);
  k.box(0,5.68,-6.93,18.45,.22,.36,metal);
  k.box(0,5.46,-6.73,18,.10,.10,'#ded8bf');
  for(const x of [-8.96,8.96]){
    k.box(x,1.6,0,.20,3.2,14,sage);k.box(x,5.65,0,.24,.26,14.3,metal);
    for(const y of [3.25,5.31])k.box(x,y,0,.34,.16,14,'#d6d7c3');
    for(const z of [-6.8,-3.4,0,3.4,6.8]){k.box(x,2.8,z,.25,5.6,.18,metal);k.box(x,5.73,z,.43,.19,.42,'#8b96a0');}
    k.box(x,4.26,0,.045,1.88,13.9,glass);
    k.box(x,4.2,0,.11,.08,14,metal);
  }
  for(const x of [-5.45,5.45]){
    k.box(x,.62,6.85,6.9,1.24,.26,sage);k.box(x,1.29,6.85,7.0,.17,.38,oak);k.box(x,.13,6.98,6.9,.22,.12,oak);
  }
  for(const x of [-2.48,2.48]){
    k.box(x,.85,6.85,.85,1.7,.48,'#cbb68c');k.box(x,.87,7.1,.68,1.42,.03,'#d3ddd1');cross(x,.89,7.14,.52);
  }
  for(const x of [-1.94,1.94]){
    k.box(x,.88,5.7,.06,1.76,1.6,glass);
    for(const z of [4.9,6.5])k.box(x,.88,z,.09,1.76,.07,metal);
    for(const y of [.08,1.77])k.box(x,y,5.7,.08,.08,1.64,metal);
    k.box(x+(x<0?.08:-.08),1.0,5.23,.07,.35,.09,'#acb7b0');
  }
  k.box(0,.062,5.58,2.9,.05,1.08,'#999482');
  for(let x=-1.38;x<1.4;x+=.12)k.box(x,.09,5.58,.026,.01,1.0,'#b8b2a0');
  for(const f of PHARMACY_FIXTURES){
    if(f.type==='cabinet')cabinet(f);
    else if(f.type==='island')island(f);
    else if(f.type==='counter'){
      k.box(f.x,.79,f.z,f.w,1.5,f.d,oak);k.box(f.x,1.59,f.z,f.w+.18,.18,f.d+.2,'#dca85e');
      if(f.id==='cashier')for(let i=0;i<4;i++){const x=f.x-f.w/2+(i+.5)*f.w/4;k.box(x,.8,f.z+f.d/2+.012,f.w/4-.11,1.18,.035,cream);}
    }else if(f.type==='plant'){
      k.box(f.x,.34,f.z,.87,.68,.87,'#bca278');k.box(f.x,.70,f.z,.81,.05,.81,'#615137');
      k.model('plant_floor',f.x,f.z,1.5,0,.33);
    }
  }
  k.model('monitor',4.45,-1.68,1.25,Math.PI,1.69);
  k.model('coffee_mug',6.6,-1.61,.8,0,1.69);
  k.model('plant_desk',3.0,-4.33,1.2,0,1.69);
  k.box(5.95,1.79,-1.25,.34,.15,.47,'#324745');k.box(5.95,1.87,-1.27,.25,.025,.26,'#7bc5b3');
  for(const dx of [-.07,0,.07])for(const dz of [.035,.105])k.box(5.95+dx,1.875,-1.2+dz,.04,.012,.035,'#dce5da');
  stock(local(6.65,-1.58),0,1.70,0,37);stock(local(3.2,-2.32),0,1.70,0,18);
  cross(.95,4.92,-6.75,1.12,0,true);
  label('АПТЕКА',.95,3.97,-6.75,3.05,.55,{color:'#dbffeb'});
  label('Больше\nздоровых дней  ♥',-6.18,4.55,-6.81,2.65,.95);
  label('Забота\nрядом  ♥',5.65,4.6,-6.81,2.65,.92);
  label('ЗДОРОВЬЕ\nКРАСОТА\nЗАБОТА  ♥',8.76,4.25,2.2,2.25,1.05,{yaw:-Math.PI/2,color:'#236e5e'});
  for(const x of [-6,-3,1,5.3,7.7]){
    k.box(x,5.39,-6.55,.24,.24,.38,metal);k.box(x,5.25,-6.45,.21,.045,.19,k.glow('#ffe4b0',2.2));
  }
  // The selection frame belongs to the scene, so it remains attached while the camera moves.
  const selection=new T.Group(),frameMat=new T.MeshBasicMaterial({color:'#5fffd0',toneMapped:false}),unit=new T.BoxGeometry(1,1,1);
  const selectedLabel={id:'A-02',name:'Полка A-02',x:-6.75,y:3.25,z:2.6};
  for(const [x,y,w,h] of [[0,.62,2.9,.045],[0,-.62,2.9,.045],[-1.43,0,.045,1.24],[1.43,0,.045,1.24]]){
    const rod=new T.Mesh(unit,frameMat);rod.position.set(x,y,0);rod.scale.set(w,h,.045);selection.add(rod);
  }
  k.root.add(selection);
  function selectShelf(id){
    const s=SHELVES.find(a=>a.id===id)||SHELVES[1],f=PHARMACY_FIXTURES.find(a=>a.id===s.fixture),yaw=f.yaw||0,depth=yaw?f.w:f.d;
    selection.position.set(f.x+Math.sin(yaw)*(depth/2+.08),1.53,f.z+Math.cos(yaw)*(depth/2+.08));selection.rotation.y=yaw;selection.scale.x=(yaw?f.d:f.w)/3.2;
    Object.assign(selectedLabel,{id:s.id,name:s.name,x:f.x+Math.sin(yaw)*(depth/2+.45),y:f.height+.45,z:f.z+Math.cos(yaw)*(depth/2+.45)});
  }
  selectShelf('A-02');
  const campaignDisplay=createCampaignDisplay();k.root.add(campaignDisplay.root);k.textures.push(campaignDisplay.texture);
  const built=k.finish();
  // Daylight through the open roof plus restrained warm task lighting at the counter.
  const taskLight=new T.PointLight('#ffe3a2',9,6,2);taskLight.position.set(4.8,3.6,-2.4);built.root.add(taskLight);
  for(const [x,y,z] of [[-2.4,3.75,-5.3],[1.25,2.6,-5.3],[-7.1,3.25,-.85],[7.1,3.2,1.1]]){
    const light=new T.PointLight('#ffdf9d',1.8,3.7,2);light.position.set(x,y,z);built.root.add(light);
  }
  return {...built,obstacles:pharmacyObstacles(),markers:[selectedLabel],selectShelf,setCampaign:campaignDisplay.update,capturePose:campaignDisplay.capturePose,
    interactions:[PHARMACY_EXIT,...SHELVES.map(s=>({id:s.id,type:'shelf',title:'Выбрать полку '+s.id,x:s.x,z:s.z,radius:1.65,shelf:s.id}))]};
}
