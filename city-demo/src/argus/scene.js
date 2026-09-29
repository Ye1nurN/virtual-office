import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createAssetLibrary} from '../world/assets.js';
import {mergeCharacter,disposeScene} from '../rendering.js';
import {createNavigation,createKeyboardInput,movementDirection,isTextEntry} from '../movement.js';
import {createLookInput,turnLook,positionEyes,lookDirection} from '../world/firstPerson.js';
import {buildObservationRoom,LAB_ASSETS} from './room.js';
import {LAB_BOUNDS,LAB_SPAWN,LAB_OBSTACLES,LAB_SPOTS,nearestSpot} from './layout.js';

export function createObservationScene(host,callbacks){
  let disposed=false,ready=false,enabled=true,frame=0,last=0,clock=0,width=1,height=1,zoom=1,firstPerson=false,paused=false,dirty=true;
  let room,player,limbs=[],path=[],gesture=null,hint='',experiment=null,external={x:0,z:0},cameraSettle=false;
  const focus=new T.Vector2(0,0),pose={...LAB_SPAWN},look={yaw:0,pitch:0};
  const library=createAssetLibrary(),scene=new T.Scene();scene.background=new T.Color('#d5ddd2');
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.dataset.testid='argus-lab-canvas';
  canvas.setAttribute('aria-label','Лаборатория ARGUS. WASD и стрелки — ходить. E — действие. Выберите счётчик на экране сети.');host.appendChild(canvas);
  const overhead=new T.OrthographicCamera(-15,15,9,-9,.1,150),eyes=new T.PerspectiveCamera(65,1,.06,100);let camera=overhead;
  const composer=new EffectComposer(renderer);composer.setPixelRatio(Math.min(devicePixelRatio,1.25));composer.renderTarget1.samples=2;composer.renderTarget2.samples=2;
  const renderPass=new RenderPass(scene,camera),ao=new GTAOPass(scene,camera,1,1,undefined,{radius:.55,thickness:.7,distanceExponent:1,samples:8},{radius:3,samples:8}),output=new OutputPass();ao.blendIntensity=.6;composer.addPass(renderPass);composer.addPass(ao);composer.addPass(output);
  const sun=new T.DirectionalLight('#ffe0b2',3.1);sun.position.set(-10,22,-7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:.1,far:70});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;
  scene.add(sun,new T.HemisphereLight('#e6f2ff','#967c53',1.6));const fill=new T.DirectionalLight('#e2edee',1.1);fill.position.set(8,12,17);scene.add(fill);
  const ring=new T.Mesh(new T.RingGeometry(.49,.56,48),new T.MeshBasicMaterial({color:'#69e6c4',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.028;scene.add(ring);
  const shadow=new T.Mesh(new T.CircleGeometry(.48,32),new T.MeshBasicMaterial({color:'#18333b',transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.026;scene.add(shadow);
  const navigation=createNavigation(LAB_OBSTACLES,LAB_BOUNDS),ray=new T.Raycaster(),pointer=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();
  function wake(){dirty=true;if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(tick);}
  function stop(){path=[];external={x:0,z:0};wake();}
  const input=createKeyboardInput({eventTarget:window,canUse:()=>ready&&enabled,onChange:e=>{if(e?.pressed)path=[];wake();},onStop:stop,onHome:()=>reset()});
  function projection(){const aspect=width/height,span=Math.max(17.4,24/aspect);Object.assign(overhead,{left:-span*aspect/2,right:span*aspect/2,top:span/2,bottom:-span/2,zoom});overhead.updateProjectionMatrix();eyes.aspect=aspect;eyes.updateProjectionMatrix();}
  function resize(){width=Math.max(1,host.clientWidth);height=Math.max(1,host.clientHeight);renderer.setSize(width,height);composer.setSize(width,height);ao.setSize(Math.round(width*.7),Math.round(height*.7));ao.enabled=width>720&&!firstPerson;projection();wake();}
  function mode(value){firstPerson=value==='first-person';camera=firstPerson?eyes:overhead;renderPass.camera=camera;ao.enabled=width>720&&!firstPerson;input.clear();stop();lookInput.release();if(room)room.envelope.root.visible=firstPerson;callbacks.onCamera?.(firstPerson?'first-person':'overview');wake();}
  function reset(){zoom=1;Object.assign(look,{yaw:0,pitch:0});projection();callbacks.onZoom?.(100);wake();}
  const lookInput=createLookInput(canvas,{canUse:()=>enabled&&ready,isFirstPerson:()=>firstPerson,onToggle:()=>mode(firstPerson?'overview':'first-person'),onStart:stop,onLook:(dx,dy)=>{Object.assign(look,turnLook(look,dx,dy));wake();}});
  function executeSpot(){const spot=nearestSpot(pose);if(!spot){callbacks.onNotice?.('Подойдите к центральной консоли или выберите счётчик на экране.');return;}callbacks.onAction(spot.action);}
  function key(e){if(!ready||!enabled||isTextEntry(e.target)||e.altKey||e.metaKey||e.ctrlKey||e.repeat)return;if(e.code==='KeyE'||['e','у'].includes(e.key?.toLowerCase())){e.preventDefault();executeSpot();}}
  function cast(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
  function down(e){if(e.button!==0||!enabled||!ready)return;gesture={x:e.clientX,y:e.clientY};canvas.focus({preventScroll:true});}
  function up(e){
    if(!gesture||!enabled||!ready)return;const moved=Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y);gesture=null;if(moved>7)return;
    cast(e);const picked=ray.intersectObject(room.board.screen)[0];if(picked){const id=room.board.pick(picked.uv);if(id){callbacks.onSelect(id);return;}}
    if(ray.intersectObject(room.consoleScreen)[0]){callbacks.onAction('nodes');return;}
    if(!firstPerson&&ray.ray.intersectPlane(ground,hit)&&!navigation.blocked(hit.x,hit.z)){path=navigation.findPath(pose,{x:hit.x,z:hit.z});wake();}
  }
  function wheel(e){if(!enabled||firstPerson)return;e.preventDefault();changeZoom(-Math.sign(e.deltaY)*.08);}
  function changeZoom(delta){zoom=T.MathUtils.clamp(zoom+delta,.75,1.75);projection();callbacks.onZoom?.(Math.round(zoom*100));wake();}
  function visibility(){input.clear();stop();last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();}
  function moveAlongPath(distance){while(path.length&&distance>0){const target=path[0],dx=target.x-pose.x,dz=target.z-pose.z,len=Math.hypot(dx,dz);if(len<.035){path.shift();continue;}const n=Math.min(distance,len);navigation.move(pose,dx/len*n,dz/len*n);player.rotation.y=Math.atan2(dx,dz);distance-=n;if(n>=len-.001)path.shift();}}
  function tick(now){
    frame=0;if(disposed||document.hidden)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(ready){
      const before={...pose},dir=movementDirection(input.keys);if(external.x||external.z)Object.assign(dir,external);
      if(enabled&&(dir.x||dir.z)){
        path=[];const d=firstPerson?lookDirection(dir,look.yaw):dir,speed=input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')?5:3.3;
        navigation.move(pose,d.x*dt*speed,d.z*dt*speed);player.rotation.y=Math.atan2(d.x,d.z);
      }else if(enabled&&path.length)moveAlongPath(dt*3.3);
      const walking=Math.hypot(pose.x-before.x,pose.z-before.z)>.0001;
      player.position.set(pose.x,.025,pose.z);player.visible=!firstPerson;ring.visible=!firstPerson;shadow.visible=!firstPerson;ring.position.set(pose.x,.028,pose.z);shadow.position.set(pose.x,.026,pose.z);
      for(const limb of limbs)limb.node.rotation.x=limb.base+(walking?Math.sin(now*.012+limb.side*Math.PI/2)*.42:0);
      if(firstPerson)positionEyes(eyes,player.position,look,1.7);
      else{
        const goal={x:T.MathUtils.clamp(pose.x*.12,-.85,.85),z:T.MathUtils.clamp((pose.z-LAB_SPAWN.z)*.09,-.6,.4)};
        focus.lerp(new T.Vector2(goal.x,goal.z),1-Math.exp(-6*dt));cameraSettle=Math.abs(focus.x-goal.x)+Math.abs(focus.y-goal.z)>.002;
        overhead.position.set(focus.x,21,27+focus.y);overhead.lookAt(focus.x,3.5,-.35+focus.y);
      }
      camera.updateMatrixWorld(true);
      if(!paused){clock+=dt;room.board.animate(clock);}
      const nearby=nearestSpot(pose),key=nearby?.id||'';if(hint!==key){hint=key;callbacks.onHint?.(nearby);}
      canvas.dataset.x=pose.x.toFixed(3);canvas.dataset.z=pose.z.toFixed(3);canvas.dataset.moving=String(walking);
      // Static room shadows are cached. Only feet and limbs animate in the foreground.
      if(dirty||walking||cameraSettle||!paused){composer.render();dirty=false;}
      if(walking||path.length||input.keys.size||external.x||external.z||cameraSettle||!paused)frame=requestAnimationFrame(tick);
    }
  }
  const observer=new ResizeObserver(resize);observer.observe(host);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('wheel',wheel,{passive:false});
  window.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);resize();
  (async()=>{
    try{
      await library.prepare(LAB_ASSETS,(n,total)=>callbacks.onLoading?.(Math.round(n/total*85)));
      const [templates,paving]=await Promise.all([library.getTemplates(LAB_ASSETS),new T.TextureLoader().loadAsync('/textures/paving-albedo.png')]);
      if(disposed){paving.dispose();return;}paving.colorSpace=T.SRGBColorSpace;paving.wrapS=paving.wrapT=T.RepeatWrapping;paving.anisotropy=4;
      room=buildObservationRoom(templates,paving);scene.add(room.root);room.envelope.root.visible=firstPerson;
      player=templates.get('employee_base').clone(true);player.scale.setScalar(1.35);
      const skin=new T.MeshStandardMaterial({vertexColors:true,roughness:.85}),parts=[];
      player.traverse(o=>{if(/^(arm_|leg_)[LR]/.test(o.name))parts.push({node:o,parent:o.parent,base:o.rotation.x,side:o.name.includes('_L')?1:-1});});
      for(const p of parts)p.node.removeFromParent();mergeCharacter(player,skin);for(const p of parts){mergeCharacter(p.node,skin);p.parent.add(p.node);}limbs=parts;player.traverse(o=>{if(o.isMesh)o.castShadow=false;});player.rotation.y=Math.PI;scene.add(player);
      if(experiment)room.board.draw(experiment);room.board.animate(clock);canvas.dataset.missing=[...library.missing].join(',');ready=true;renderer.shadowMap.needsUpdate=true;callbacks.onLoading?.(null);callbacks.onHint?.(nearestSpot(pose));wake();
    }catch(e){if(!disposed)callbacks.onError?.(e.message);}
  })();
  return {
    update(state){experiment=state;paused=state.paused;room?.board.draw(state);wake();},
    enable(value){enabled=value;if(!value){input.clear();lookInput.release();stop();}wake();},
    zoom:changeZoom,reset,mode,interact:executeSpot,
    direction(x,z){if(!enabled)return;external={x,z};path=[];wake();},
    approach(id){const to=LAB_SPOTS[id];if(!enabled||!to)return;path=navigation.findPath(pose,to);wake();},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();input.dispose();lookInput.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('wheel',wheel);window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);room?.board.dispose();room?.assets.release();disposeScene(scene,[],room?.textures||[]);library.dispose();ao.dispose();output.dispose();composer.dispose();renderer.dispose();canvas.remove();}
  };
}
