import {buildAutofixBuilding} from './autofixBuilding.js';
import {buildTynyshBuilding} from './tynyshBuilding.js';
import {Euler,Quaternion,Vector3} from 'three';
import {buildingPoint,rotatedFootprint} from './buildingFrame.js';

// Rotate authoring coordinates before batching, keeping both scene-kit renderers usable.
function facingKit(raw,p){
  const yaw=p.yaw||0;
  if(!yaw)return raw;
  const turn=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),yaw),q=new Quaternion(),euler=new Euler();
  const point=(x,z)=>buildingPoint(p,x-p.x,z-p.z);
  return {...raw,
    box(x,y,z,w,h,d,color,angle=0,rx=0,rz=0){
      const at=point(x,z);q.setFromEuler(euler.set(rx,angle,rz)).premultiply(turn);euler.setFromQuaternion(q);
      return raw.box(at.x,y,at.z,w,h,d,color,euler.y,euler.x,euler.z);
    },
    plane(x,y,z,w,d,mat){const at=point(x,z),mesh=raw.plane(at.x,y,at.z,w,d,mat);mesh.quaternion.premultiply(turn);return mesh;},
    sign(text,x,y,z,w,h,options={}){const at=point(x,z);return raw.sign(text,at.x,y,at.z,w,h,{...options,yaw:yaw+(options.yaw||0)});},
    model(id,x,z,s=1,angle=0,y=0){const at=point(x,z);return raw.model(id,at.x,at.z,s,yaw+angle,y);},
    bush(x,z,s,seed,y){const at=point(x,z);return raw.bush(at.x,at.z,s,seed,y);},
    flowerbed(x,z,w,d,seed,y){const at=point(x,z),size=rotatedFootprint(w,d,yaw);return raw.flowerbed(at.x,at.z,size.w,size.d,seed,y);},
  };
}

// Authored modular facades. All pieces have real depth and remain replaceable by one GLB.
export function buildProjectBuilding(k,p){
  if(p.exteriorAsset){k.model(p.exteriorAsset,p.x,p.z,p.exteriorScale,(p.yaw||0)+(p.exteriorYaw||0));return;}
  if(p.id==='autofix'){buildAutofixBuilding(facingKit(k,p),p);return;}
  if(p.id==='tynysh'){buildTynyshBuilding(facingKit(k,p),p);return;}
  const raw=facingKit(k,p),ys=p.heightScale||1;
  k={...raw,box:(x,y,z,w,h,d,...rest)=>raw.box(x,y*ys,z,w,h*ys,d,...rest),
    plane:(x,y,z,w,d,mat)=>raw.plane(x,y*ys,z,w,d,mat),
    sign:(text,x,y,z,w,h,opt)=>raw.sign(text,x,y*ys,z,w,h*ys,opt),
    model:(id,x,z,s,yaw,y=0)=>raw.model(id,x,z,s,yaw,y*ys),
    bush:(x,z,s,seed,y)=>raw.bush(x,z,s,seed,y*ys)};
  const {x,z,w,d}=p,h=p.h/ys,front=z+d/2,office=p.id==='office',pharmacy=p.id==='pharmacy';
  const dark=office?'#403d35':pharmacy?'#376f59':'#253d4b';
  const stone=office?'#bc9b72':pharmacy?'#ddd6bb':'#768b91';
  const edge=office?'#d0a774':pharmacy?'#efe2bd':'#526872';
  const body=office?k.surface('brick',w,h,6,'#f1c7a4'):pharmacy?'#5c9a79':'#324d5a';
  k.box(x,.15,z,w+.5,.3,d+.5,'#918d7a');
  k.box(x,h/2+.25,z,w,h,d,body);
  k.box(x,.48,z,w+.2,.38,d+.2,stone);
  // Footings, horizontal bands, deep corner piers and dressed-stone courses.
  for(const y of office?[.8,3.65,7.75]:[.8,3.35,h-.18])k.box(x,y,z,w+.35,.24,d+.35,stone);
  for(const dx of [-w/2+.22,w/2-.22])for(const dz of [-d/2+.15,d/2+.15]){
    k.box(x+dx,h/2,z+dz,.54,h,.46,dark);
    for(let yy=.7;yy<h;yy+=.65)k.box(x+dx,yy,z+dz+.1,.65,.5,.5,office?'#a36b42':stone);
  }
  if(!office){
    for(let yy=1;yy<h-.2;yy+=.65){
      k.box(x,yy,front+.05,w,.038,.08,pharmacy?'#b6c9a7':'#172e3d');
      k.box(x+w/2+.045,yy,z,.08,.038,d,pharmacy?'#a4baa0':'#172e3d');
    }
    if(!pharmacy)for(let dx=-w/2+1.1;dx<w/2;dx+=1.35)k.box(x+dx,h/2,front+.055,.025,h,.08,'#172e3d');
  }
  function face(side,u,y,v,ww,hh,dd,col){
    const a=side*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    const bx=side===1?x+w/2:side===-1?x-w/2:x,bz=side===0?front:z;
    k.box(bx+u*c+v*s,y,bz-u*s+v*c,ww,hh,dd,col,a);
  }
  function window(side,u,y,ww,hh,warm=false){
    const frame=office?'#543e2c':'#d5cfb5',glass=warm?k.glow('#df952f',.9):k.glow(pharmacy?'#96b8a5':'#428aab',.27);
    face(side,u,y,.08,ww+.45,hh+.45,.17,'#2c3836');
    face(side,u,y,.19,ww,hh,.06,glass);
    // Display shelves and lit interiors sit behind raised glazing bars.
    if(pharmacy&&side===0){
      for(const row of [-.65,0,.65]){
        face(side,u,y+row-.17,.25,ww-.15,.09,.18,'#c59956');
        for(let j=0;j<9;j++)face(side,u-ww/2+.22+j*(ww-.3)/9,y+row,.29,.18,.28,.09,['#fff0c6','#488c8a','#dfb95e','#e3c5a3'][j%4]);
      }
    }else{
      if(warm){
        face(side,u-ww*.23,y+.35,.22,ww*.22,hh*.55,.025,k.glow('#ffe4a3',1.4));
        face(side,u+ww*.2,y-.45,.225,ww*.27,hh*.3,.025,k.glow('#efa343',.7));
        face(side,u,y+.76,.23,.16,.28,.025,k.glow('#fff1bd',2.2));
      }
      face(side,u-ww*.2,y,.24,.1,hh*.87,.03,warm?'#fff0ae':'#abcbd0');
      face(side,u+ww*.22,y+hh*.15,.245,ww*.16,hh*.6,.025,warm?'#c87b29':'#75b0bc');
    }
    for(const du of [-ww/2,ww/2])face(side,u+du,y,.33,.13,hh+.2,.22,frame);
    for(const dy of [-hh/2,hh/2])face(side,u,y+dy,.33,ww+.2,.15,.22,frame);
    face(side,u,y,.38,.1,hh,.09,frame);face(side,u,y-.13,.38,ww,.1,.09,frame);
    face(side,u,y-hh/2-.16,.36,ww+.56,.17,.62,stone);
    face(side,u,y+hh/2+.18,.26,ww+.5,.16,.44,edge);
  }
  if(office){
    for(const u of [-5.15,5.15])window(0,u,1.95,2.3,2.5,true);
    // Keep the window tops aligned while reserving a clear band for the sign.
    for(const u of [-5.35,-2.7,0,2.7,5.35])window(0,u,6.23,1.37,1.81,u!==0);
    for(const side of [-1,1])for(const u of [-3.8,0,3.8])for(const y of [1.95,5.9])window(side,u,y,1.85,2.5,true);
    for(const u of [-3.55,3.55])face(0,u,5.7,.17,.29,3.75,.26,'#935b36');
  }else{
    for(const u of [-4.6,4.6])window(0,u,1.9,3.7,2.32,pharmacy);
    for(const side of [-1,1])for(const u of [-3.5,0,3.5])window(side,u,1.9,1.95,2.2,false);
  }
  // Recessed entry, glazed double doors, brass pulls and a projecting canopy.
  k.box(x,1.72,front+.07,3.75,3.44,.18,'#1e3538');
  for(const dx of [-.79,.79]){
    k.box(x+dx,1.67,front+.25,1.46,3.16,.06,k.glow(office?'#e7ba70':'#77a9a5',office?.6:.2));
    k.box(x+dx,2.22,front+.29,1.31,1.71,.03,k.glow(office?'#ffe3aa':'#abd1bf',office?.5:.12));
    k.box(x+dx-.28,2.26,front+.33,.11,1.48,.027,office?'#fff0c6':'#d1ead7');
    k.box(x+dx*.32,1.27,front+.46,.07,.61,.11,'#c5af76');
    k.box(x+dx,2.88,front+.3,1.45,.13,.06,dark);
    k.box(x+dx,.48,front+.31,1.44,.14,.06,dark);
  }
  k.box(x,1.69,front+.35,.11,3.25,.1,dark);
  for(const dx of [-1.8,1.8])k.box(x+dx,1.75,front+.33,.32,3.5,.42,stone);
  k.box(x,3.5,front+.65,4.2,.26,1.3,stone);
  k.box(x,.1,front+.73,4.1,.18,1.25,'#c2baa2');
  k.box(x,.035,front+1.45,4.5,.08,.48,'#d9cbaa');
  k.box(x,3.47,front+1,2.5,.065,.08,k.glow('#fff0b3',.8));
  if(pharmacy){
    // The awning covers the display window, leaving the central doorway clear.
    for(let i=0;i<9;i++){
      const xx=x-6.6+i*.56,col=i%2?'#eee9ca':'#369c78';
      k.box(xx,3.05,front+.94,.555,.12,1.7,col,0,.13);
      k.box(xx,2.75,front+1.77,.555,.42,.12,col);
    }
  }
  const signY=office?4.34:4.14,signW=office?8.3:10.4;
  k.box(x,signY,front+.37,signW+.38,office?1.3:1.44,.45,office?'#232e3b':pharmacy?'#21795c':'#172f46');
  k.sign(office?'МОЙ ОФИС':pharmacy?'АПТЕКА':'ARGUS',x+(pharmacy?1.05:!office?.7:0),signY,front+.62,pharmacy?7.2:office?8:7,office?1.12:1.3,{bg:office?'#28323c':pharmacy?'#247a60':'#183a52',size:240});
  if(pharmacy){
    k.box(x-4.22,signY,front+.74,1.72,1.86,.27,'#1b7458');
    k.box(x-4.22,signY,front+.94,.32,1.25,.15,k.glow('#efffe1',.38));k.box(x-4.22,signY,front+.95,1.21,.34,.15,k.glow('#efffe1',.38));
  }else if(!office){
    const cyan=k.glow('#24c7ec',1.15);
    for(const dx of [-6.8,6.8,-2.2,2.2]){k.box(x+dx,1.98,front+.56,.105,2.4,.09,cyan);k.box(x+dx,3.19,front+.56,.4,.13,.1,cyan);}
    // A metal shield emblem assembled as a small physical relief.
    k.box(x-4.2,signY+.08,front+.77,1.25,1.3,.14,cyan);
    k.box(x-4.2,signY-.57,front+.77,.89,.89,.14,cyan,0,0,Math.PI/4);
    k.box(x-4.2,signY+.05,front+.87,.94,1.1,.08,'#276686');
    k.box(x-4.2,signY-.41,front+.88,.66,.66,.08,'#276686',0,0,Math.PI/4);
    k.box(x-4.3,signY-.02,front+.97,.14,.52,.06,'#e9ffff',0,0,.65);
    k.box(x-4.05,signY+.1,front+.97,.14,.72,.06,'#e9ffff',0,0,-.62);
  }
  // Roof deck, stepped coping, glazing, service units and planted corners.
  const roof=h+.39;
  k.box(x,h+.14,z,w+.63,.3,d+.63,edge);
  k.plane(x,roof,z,w-.42,d-.42,k.surface('paving',w,d,4,office?'#ceb996':'#c4c9ba'));
  for(const dx of [-w/2,w/2]){k.box(x+dx,roof+.54,z,.36,1.08,d+.45,stone);k.box(x+dx,roof+1.12,z,.55,.18,d+.62,edge);}
  for(const dz of [-d/2,d/2]){k.box(x,roof+.5,z+dz,w,.98,.35,stone);k.box(x,roof+1.04,z+dz,w+.55,.17,.53,edge);}
  const solarX=office?x:x+.7,solarZ=z-.1;
  k.box(solarX,roof+.18,solarZ,4.45,.26,3.15,'#536672');
  for(let ix=0;ix<4;ix++)for(let iz=0;iz<3;iz++)k.box(solarX-1.65+ix*1.1,roof+.33,solarZ-1+iz*.99,1.02,.055,.91,k.glow('#316486',.05));
  for(let ix=0;ix<=4;ix++)k.box(solarX-2.2+ix*1.1,roof+.38,solarZ,.065,.08,3.15,'#bcc7bb');
  for(let iz=0;iz<=3;iz++)k.box(solarX,roof+.38,solarZ-1.5+iz,4.45,.08,.065,'#bcc7bb');
  for(let i=0;i<2;i++){
    const ax=x+(office?5:-5.3),az=z-d/2+1.6+i*1.8;
    k.box(ax,roof+.48,az,1.28,.92,1.36,'#b7c2ba');k.box(ax,roof+.98,az,1.47,.12,1.53,'#d2d6c8');
    k.box(ax,roof+1.06,az,.95,.05,.94,'#43545b');
    for(let j=0;j<7;j++)k.box(ax-.48+j*.16,roof+1.1,az,.06,.04,.98,'#839295');
    for(let j=0;j<5;j++)k.box(ax,roof+.24+j*.12,az+.7,1.08,.048,.03,'#677a7d');
  }
  for(const [dx,dz] of [[-5,d/2-1.2],[5,d/2-1.2],[4,-d/2+1.3]]){
    k.box(x+dx,roof+.22,z+dz,1.8,.44,1.4,stone);k.bush(x+dx,z+dz,1.5,dx+dz,roof+.44);k.model('plant_floor',x+dx,z+dz,1.55,0,roof+.46);
  }
  // Pots, window-box blooms and entrance furniture establish human scale.
  for(const dx of [-6.4,6.4]){
    k.box(x+dx,.32,front+1.28,1.1,.64,1.1,office?'#886239':'#978c69');
    k.model('plant_floor',x+dx,front+1.28,1.9,0,.32);k.bush(x+dx,front+1.28,.75,dx,.65);
  }
  for(const dx of [-2.9,2.9])k.model('plant_floor',x+dx,front+.8,1.35);
  for(const dx of [-5,5])k.flowerbed(x+dx,front+2.45,3.15,.77,Math.abs(dx)*3);
}
