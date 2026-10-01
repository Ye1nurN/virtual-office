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

// Desktop mouse look is persistent; touch and browsers denying pointer lock
// retain drag-to-look. Only a user gesture requests a lock, never an unlock event.
export function createLookInput(canvas,{eventTarget=window,documentTarget=canvas.ownerDocument,canUse,isFirstPerson,onToggle,onLook,onStart,onUnlock}){
  let drag=null,pending=false,wanted=false,locked=false,disposed=false;
  const ownsLock=()=>documentTarget?.pointerLockElement===canvas;
  function report(state,error=''){if(canvas.dataset){canvas.dataset.mouseLook=state;canvas.dataset.mouseLockError=error;}}
  report('free');
  const key=e=>e.code==='KeyV'||['v','м'].includes(e.key?.toLowerCase());
  function downKey(e){
    if(e.key==='Escape'){release();return;}
    if(!canUse()||isTextEntry(e.target)||e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return;
    if(key(e)){e.preventDefault();if(!e.repeat)onToggle();return;}
    if(!isFirstPerson())return;
    const direction={KeyJ:[-20,0],KeyL:[20,0],KeyI:[0,-15],KeyK:[0,15]}[e.code];
    if(direction){e.preventDefault();onLook(...direction);}
  }
  function releaseDrag(){
    const previous=drag;drag=null;
    if(previous&&canvas.hasPointerCapture?.(previous.id))canvas.releasePointerCapture(previous.id);
  }
  function release(){
    wanted=false;releaseDrag();
    if(ownsLock())documentTarget.exitPointerLock();
    report('free');
  }
  function lockChange(){
    pending=false;
    if(ownsLock()){
      if(disposed||!wanted||!canUse()||!isFirstPerson()){release();return;}
      locked=true;releaseDrag();canvas.focus({preventScroll:true});report('locked');onStart?.();
    }else{
      wanted=false;releaseDrag();if(locked)onUnlock?.();locked=false;report('free');
    }
  }
  function lockError(error){pending=false;wanted=false;report('drag',error?.name||'PointerLockError');}
  function capture(){
    if(disposed||pending||ownsLock()||!canUse()||!isFirstPerson()||!canvas.requestPointerLock)return;
    if(documentTarget?.defaultView?.matchMedia?.('(pointer: fine)').matches===false)return;
    wanted=true;pending=true;canvas.focus({preventScroll:true});report('requesting');
    try{
      // Older browsers return void; modern browsers reject a Promise on denial.
      const request=canvas.requestPointerLock();
      request?.then(()=>{if(disposed||!wanted||!canUse()||!isFirstPerson())release();},lockError);
    }catch{lockError();}
  }
  function down(e){
    if(e.button!==0||!canUse()||!isFirstPerson())return;
    e.preventDefault();canvas.focus({preventScroll:true});onStart?.();
    if(ownsLock())return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);
    if(!e.pointerType||e.pointerType==='mouse')capture();
  }
  function move(e){
    if(ownsLock())return;
    if(!drag||e.pointerId!==drag.id)return;
    if(!canUse()||!isFirstPerson()){release();return;}
    onLook(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;
  }
  function mouseMove(e){
    if(!ownsLock())return;
    if(disposed||!wanted||!canUse()||!isFirstPerson()){release();return;}
    onLook(e.movementX||0,e.movementY||0);
  }
  function focus(e){if(isTextEntry(e.target))release();}
  function visibility(){if(documentTarget.hidden)release();}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);
  canvas.addEventListener('pointerup',releaseDrag);canvas.addEventListener('pointercancel',releaseDrag);canvas.addEventListener('lostpointercapture',releaseDrag);
  documentTarget?.addEventListener('mousemove',mouseMove);documentTarget?.addEventListener('pointerlockchange',lockChange);documentTarget?.addEventListener('pointerlockerror',lockError);documentTarget?.addEventListener('visibilitychange',visibility);
  eventTarget.addEventListener('keydown',downKey);eventTarget.addEventListener('blur',release);eventTarget.addEventListener('focusin',focus);
  return {capture,release,dispose(){disposed=true;release();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',releaseDrag);canvas.removeEventListener('pointercancel',releaseDrag);canvas.removeEventListener('lostpointercapture',releaseDrag);documentTarget?.removeEventListener('mousemove',mouseMove);documentTarget?.removeEventListener('pointerlockchange',lockChange);documentTarget?.removeEventListener('pointerlockerror',lockError);documentTarget?.removeEventListener('visibilitychange',visibility);eventTarget.removeEventListener('keydown',downKey);eventTarget.removeEventListener('blur',release);eventTarget.removeEventListener('focusin',focus);}};
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
    // Complete the existing parapet, rather than placing a floor-to-ceiling
    // pane over it. Each interior supplies its actual opening and wall plane.
    const f=typeof front==='object'?front:{};
    const span=f.width??width,z=f.z??depth/2,opening=f.doorWidth??doorWidth;
    const bottom=f.baseHeight??1.1,doorTop=f.doorHeight??2.4;
    const windowTop=f.windowTop??Math.min(height-.45,doorTop+.2),thickness=f.thickness??.2;
    const infill=new T.MeshStandardMaterial({color:f.wallColor??'#546b76',roughness:.85});
    const frame=new T.MeshStandardMaterial({color:f.frameColor??'#365365',roughness:.65});
    const glass=new T.MeshStandardMaterial({color:'#bfdddc',transparent:true,opacity:.2,roughness:.3,depthWrite:false});
    const sideWidth=(span-opening)/2,jamb=.16,rail=.10;
    for(const sign of [-1,1]){
      const x=sign*(opening+sideWidth)/2;
      box(x,(windowTop+height)/2,z,sideWidth,height-windowTop,thickness,infill);
      for(const edge of [-1,1])box(x+edge*(sideWidth-jamb)/2,(bottom+windowTop)/2,z,jamb,windowTop-bottom,thickness,frame);
      for(const y of [bottom+rail/2,windowTop-rail/2])box(x,y,z,sideWidth-2*jamb,rail,thickness,frame);
      box(x,(bottom+windowTop)/2,z,jamb,windowTop-bottom-2*rail,thickness,frame);
      const paneWidth=(sideWidth-3*jamb)/2;
      for(const pane of [-1,1])box(x+pane*(paneWidth+jamb)/2,(bottom+windowTop)/2,z,paneWidth,windowTop-bottom-2*rail,.045,glass);
    }
    // Door frame sits outside the traversable opening, with a real lintel.
    box(0,(doorTop+height)/2,z,opening,height-doorTop,thickness,infill);
    box(0,doorTop+rail/2,z,opening,rail,thickness+.035,frame);
    for(const sign of [-1,1])box(sign*(opening+jamb)/2,doorTop/2,z,jamb,doorTop,thickness+.035,frame);
  }
  root.visible=false;
  return {root,box,wall,dispose(){geometry.dispose();for(const m of new Set(root.children.map(c=>c.material)))m.dispose();root.removeFromParent();}};
}
