import * as T from 'three';
import {isTextEntry} from '../movement.js';

export const EYE_HEIGHT=1.62;
export const PHARMACY_HEIGHT_SCALE=.72;
export const LOOK_LIMIT=Math.PI*.42;
export function lookDirection({x,z},yaw){
  return {x:x*Math.cos(yaw)+z*Math.sin(yaw),z:-x*Math.sin(yaw)+z*Math.cos(yaw)};
}
export function turnLook(pose,dx,dy){
  return {yaw:Math.atan2(Math.sin(pose.yaw-dx*.004),Math.cos(pose.yaw-dx*.004)),pitch:Math.max(-LOOK_LIMIT,Math.min(LOOK_LIMIT,pose.pitch-dy*.004))};
}
export function positionEyes(camera,position,pose,height=EYE_HEIGHT){
  camera.position.set(position.x,position.y+height,position.z);
  camera.rotation.order='YXZ';camera.rotation.set(pose.pitch,pose.yaw,0);camera.updateMatrixWorld(true);
}

// Drag-to-look keeps the cursor available for the CRM. No pointer lock or global
// mouse capture: releases, dialogs and tab changes always stop the gesture.
export function createLookInput(canvas,{eventTarget=window,canUse,isFirstPerson,onToggle,onLook,onStart}){
  let drag=null;
  const key=e=>e.code==='KeyV'||['v','м'].includes(e.key?.toLowerCase());
  function downKey(e){
    if(e.key==='Escape'){release();return;}
    if(!canUse()||isTextEntry(e.target)||e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return;
    if(key(e)){e.preventDefault();if(!e.repeat)onToggle();return;}
    if(!isFirstPerson())return;
    const direction={KeyJ:[-20,0],KeyL:[20,0],KeyI:[0,-15],KeyK:[0,15]}[e.code];
    if(direction){e.preventDefault();onLook(...direction);}
  }
  function release(){
    const previous=drag;drag=null;
    if(previous&&canvas.hasPointerCapture?.(previous.id))canvas.releasePointerCapture(previous.id);
  }
  function down(e){
    if(e.button!==0||!canUse()||!isFirstPerson())return;
    e.preventDefault();canvas.focus({preventScroll:true});onStart?.();
    drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);
  }
  function move(e){
    if(!drag||e.pointerId!==drag.id)return;
    if(!canUse()||!isFirstPerson()){release();return;}
    onLook(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;
  }
  function focus(e){if(isTextEntry(e.target))release();}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  eventTarget.addEventListener('keydown',downKey);eventTarget.addEventListener('blur',release);eventTarget.addEventListener('focusin',focus);
  return {release,dispose(){release();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',release);canvas.removeEventListener('pointercancel',release);canvas.removeEventListener('lostpointercapture',release);eventTarget.removeEventListener('keydown',downKey);eventTarget.removeEventListener('blur',release);eventTarget.removeEventListener('focusin',focus);}};
}

// The overview is a cutaway. These real interior surfaces are visible only at
// eye level; they never change footprints or block the existing door openings.
export function createRoomEnvelope({width,depth,height,front=false,doorWidth=4}){
  const root=new T.Group(),geometry=new T.BoxGeometry(1,1,1);
  const wall=new T.MeshStandardMaterial({color:'#c7d7cc',roughness:.85});
  const ceiling=new T.MeshStandardMaterial({color:'#f1eadb',emissive:'#f1eadb',emissiveIntensity:.3,roughness:1});
  const glow=new T.MeshBasicMaterial({color:'#fff2d7',toneMapped:false});
  function box(x,y,z,w,h,d,material){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(w,h,d);root.add(m);return m;}
  box(0,height+.06,0,width,.12,depth,ceiling);
  for(const x of [-width*.28,width*.28])for(const z of [-depth*.28,0,depth*.28])box(x,height-.02,z,1.2,.025,.45,glow);
  if(front){
    const glass=new T.MeshStandardMaterial({color:'#bfdddc',transparent:true,opacity:.2,roughness:.3,depthWrite:false});
    for(const sign of [-1,1])box(sign*(width+doorWidth)/4,height/2,depth/2,(width-doorWidth)/2,height,.08,glass);
    box(0,height-.13,depth/2,width,.26,.2,wall);
    for(const x of [-doorWidth/2,doorWidth/2])box(x,height/2,depth/2,.16,height,.18,wall);
  }
  root.visible=false;
  return {root,box,wall,dispose(){geometry.dispose();for(const m of new Set(root.children.map(c=>c.material)))m.dispose();root.removeFromParent();}};
}
