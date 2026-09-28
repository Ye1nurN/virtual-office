import * as T from 'three';
import {SHELVES} from './catalog.js';
import {PHARMACY_FIXTURES} from './pharmacyLayout.js';

// Advertising areas bind to fixture IDs, independently of their procedural/GLB mesh.
export function shelfDisplayTransform(id,portion='whole'){
  const shelf=SHELVES.find(s=>s.id===id);
  if(!shelf)return null;
  const f=PHARMACY_FIXTURES.find(f=>f.id===shelf.fixture),yaw=f.yaw||0;
  const face=(yaw?f.d:f.w)-.22,depth=yaw?f.w:f.d;
  const width=face*(portion==='whole'?1:.5),offset=portion==='left'?-face/4:portion==='right'?face/4:0;
  const front=depth/2+.17;
  return {x:f.x+Math.sin(yaw)*front+Math.cos(yaw)*offset,z:f.z+Math.cos(yaw)*front-Math.sin(yaw)*offset,y:1.45,yaw,width};
}

export function createCampaignDisplay(){
  const root=new T.Group(),merch=new T.Group();root.visible=false;root.add(merch);
  const unit=new T.BoxGeometry(1,1,1),frameMaterial=new T.MeshBasicMaterial({color:'#e6ac51',toneMapped:false});
  const material=color=>new T.MeshStandardMaterial({color,roughness:.7});
  const cream=material('#fff3d9'),teal=material('#168574'),coral=material('#ecab70');
  const add=(parent,mat,x,y,z,w,h,d)=>{const mesh=new T.Mesh(unit,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  for(const [x,y,w,h] of [[0,.49,1,.026],[0,-.49,1,.026],[-.5,0,.012,1],[.5,0,.012,1]])add(root,frameMaterial,x,y,.02,w,h,.025);
  add(merch,cream,0,0,-.04,.97,.87,.045);
  add(merch,teal,0,-.37,.11,.96,.16,.28);
  for(let i=0;i<6;i++){
    const x=-.40+i*.16,h=i%2?.47:.38;
    add(merch,i%2?teal:coral,x,-.25+h/2,.13,.115,h,.20);
    add(merch,cream,x,-.19+h/2,.235,.11,h*.43,.012);
    add(merch,teal,x,-.14+h/2,.246,.02,.045,.01);
    add(merch,teal,x,-.14+h/2,.247,.045,.018,.01);
  }
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=120;
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const sign=new T.Mesh(new T.PlaneGeometry(.94,.19),new T.MeshBasicMaterial({map:texture,toneMapped:false}));sign.position.set(0,.35,.04);merch.add(sign);
  let lastKey='';
  function update(state){
    const r=state?.request,key=JSON.stringify([r?.shelf,r?.portion,r?.campaign,r?.status,state?.installed,state?.report?.status]);
    if(key===lastKey)return;lastKey=key;
    root.visible=!!r;if(!r)return;
    const t=shelfDisplayTransform(r.shelf,r.portion);if(!t){root.visible=false;return;}
    root.position.set(t.x,t.y,t.z);root.rotation.y=t.yaw;root.scale.x=t.width;
    merch.visible=!!state.installed;
    frameMaterial.color.set(state.report?.status==='approved'?'#64ffbf':state.installed?'#61dbed':r.status==='pending'?'#f6be5c':'#5fffd0');
    const ctx=canvas.getContext('2d');ctx.fillStyle='#167561';ctx.fillRect(0,0,1024,120);ctx.fillStyle='#fff6dc';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 60px Arial';ctx.fillText(r.campaign,512,62,970);texture.needsUpdate=true;
  }
  function capturePose(id,{detail=false,portion='whole'}={}){
    const t=shelfDisplayTransform(id,detail?portion:'whole');if(!t)return null;
    const distance=detail?Math.max(1.85,t.width*1.2):4.4;
    return {target:new T.Vector3(t.x,t.y,t.z),position:new T.Vector3(t.x+Math.sin(t.yaw)*distance,t.y+(detail?.45:1.05),t.z+Math.cos(t.yaw)*distance)};
  }
  return {root,texture,update,capturePose};
}
