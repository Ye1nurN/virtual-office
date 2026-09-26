import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createNavigation,createKeyboardInput,movementDirection,isTextEntry} from '../movement.js';
import {FLOORS,NAV_BOUNDS} from './floors.js';
import {createAssetLibrary,assembleFloor} from './assets.js';
import {doorCollider} from './colliders.js';
import {findSeatApproach} from './interactions.js';
import {CAMERA_RIG,followPlayer,cameraRelativeDirection} from './camera.js';

export function createOffice(container,callbacks={}){
  let disposed=false,frame=0,last=performance.now(),dirty=true,labelsDirty=true,keyboardEnabled=true,loading=true,loadToken=0;
  let world=null,config=null,navigation=null,player=null,playerStanding=null,playerSeated=null,legs=[],arms=[],path=[],pathIndex=0,walking=false,seated=null,pending=null;
  let width=1,height=1,renderFrames=0,shadowFrames=0,hoverTime=0,pointerStart=null,hint=null,doorsAnimating=[],obstacles=[],inspectionTarget=null;
  let activeFrameCount=0,activeFrameMs=0,lastActiveTime=0;
  const doorStates={},library=createAssetLibrary(),scene=new T.Scene();scene.background=new T.Color('#d6e2de');
  const camera=new T.OrthographicCamera(-15,15,11,-11,.1,180);
  let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(error){library.dispose();throw new Error('WebGL 2 недоступен. Попробуйте браузер с аппаратным ускорением.');}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.4));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.dataset.testid='office-canvas';canvas.dataset.engine='Three.js / GLB';
  canvas.setAttribute('aria-label','Трёхмерный офис. WASD или стрелки — ходить, E — взаимодействовать, Home — камера к персонажу.');container.appendChild(canvas);
  const controls=new OrbitControls(camera,canvas);controls.enableRotate=false;controls.enablePan=false;controls.enableDamping=false;
  controls.screenSpacePanning=false;controls.minZoom=.65;controls.maxZoom=2.1;controls.mouseButtons={LEFT:T.MOUSE.PAN,MIDDLE:T.MOUSE.DOLLY,RIGHT:T.MOUSE.PAN};
  const sun=new T.DirectionalLight('#ffe4b5',2.8);sun.position.set(-12,22,-10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:.5,far:70});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;
  scene.add(sun,new T.HemisphereLight('#edf4ff','#718875',1.45));
  const fill=new T.DirectionalLight('#dce8ff',.55);fill.position.set(8,10,15);scene.add(fill);
  const ringMaterial=new T.MeshBasicMaterial({color:'#73e9ca',side:T.DoubleSide,transparent:true,opacity:.9});
  const ring=new T.Mesh(new T.RingGeometry(.39,.44,48),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.025;scene.add(ring);
  const destination=new T.Mesh(new T.RingGeometry(.15,.2,32),ringMaterial.clone());destination.rotation.x=-Math.PI/2;destination.visible=false;scene.add(destination);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),intersection=new T.Vector3(),projected=new T.Vector3();
  function requestFrame(){if(!disposed&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
  function invalidate(shadows=false){dirty=true;labelsDirty=true;if(shadows)renderer.shadowMap.needsUpdate=true;requestFrame();}
  function setWalking(next){if(walking!==next){walking=next;callbacks.onWalk?.(next);}}
  function stop(){path=[];pathIndex=0;pending=null;destination.visible=false;invalidate();}
  const input=createKeyboardInput({eventTarget:window,canUse:()=>keyboardEnabled&&!loading&&!document.hidden,
    onChange(event){const dir=movementDirection(input.keys);if(!event)pending=null;else if(event.pressed)pending=dir.x||dir.z?dir:null;if(dir.x||dir.z){path=[];pathIndex=0;destination.visible=false;}invalidate();},
    onStop:stop,onHome:reset});
  function reset(){inspectionTarget=null;camera.zoom=1;camera.updateProjectionMatrix();followPlayer(camera,controls.target,player?.position||{x:0,z:0});controls.update();invalidate();}
  function resize(){
    width=Math.max(1,container.clientWidth);height=Math.max(1,container.clientHeight);renderer.setSize(width,height);
    const aspect=width/height,vertical=Math.max(CAMERA_RIG.viewHeight,8/aspect);
    camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical*CAMERA_RIG.screenAnchor;camera.bottom=-vertical*(1-CAMERA_RIG.screenAnchor);camera.updateProjectionMatrix();invalidate();
  }
  function rebuildNavigation(){
    if(!world)return;
    obstacles=[...world.obstacles,...config.doors.map(d=>doorCollider(d,doorStates[d.id]))];
    navigation=createNavigation(obstacles,NAV_BOUNDS);
  }
  function safePosition(preferred){
    if(!navigation.blocked(preferred.x,preferred.z))return preferred;
    for(let r=.35;r<4;r+=.35)for(let a=0;a<Math.PI*2;a+=Math.PI/8){
      const p={x:preferred.x+Math.sin(a)*r,z:preferred.z+Math.cos(a)*r};
      if(!navigation.blocked(p.x,p.z))return p;
    }
    return config.liftSpawn;
  }
  async function changeFloor(id,entry='lift'){
    const target=FLOORS.find(f=>f.id===Number(id));if(!target||disposed)return false;
    const token=++loadToken;loading=true;input.clear();stop();setWalking(false);setHint(null);doorsAnimating=[];
    callbacks.onLoading?.({floor:id,progress:0,error:null});
    try{
      const ids=[...target.objects.map(o=>o.assetId),'employee_base','employee_seated'];
      await library.prepare(ids,(done,total)=>{if(token===loadToken&&!disposed)callbacks.onLoading?.({floor:id,progress:Math.round(done/total*100),error:null});});
      const templates=await library.getTemplates(ids);if(disposed||token!==loadToken)return false;
      world?.release();player?.removeFromParent();config=target;activeFrameCount=0;activeFrameMs=0;lastActiveTime=0;
      world=assembleFloor(config,templates,doorStates);scene.add(world.root);rebuildNavigation();
      player=new T.Group();playerStanding=templates.get('employee_base').clone(true);playerSeated=templates.get('employee_seated').clone(true);
      playerSeated.visible=false;player.add(playerStanding,playerSeated);scene.add(player);seated=null;
      legs=[];arms=[];playerStanding.traverse(o=>{if(/^leg_[LR]/.test(o.name))legs.push({node:o,base:o.rotation.x});if(/^arm_[LR]/.test(o.name))arms.push({node:o,base:o.rotation.x});});
      const spawn=safePosition(entry==='entrance'?config.spawn:config.liftSpawn);player.position.set(spawn.x,0,spawn.z);player.rotation.y=Math.PI;
      loading=false;last=performance.now();reset();invalidate(true);updateHint();
      callbacks.onFloor?.(config.id);callbacks.onLoading?.(null);
      if(library.missing.size)callbacks.onNotice?.('Временные модели: '+[...library.missing].join(', '));
      return true;
    }catch(error){if(disposed||token!==loadToken)return false;loading=false;callbacks.onLoading?.({floor:id,error:'Не удалось загрузить этаж. Повторите попытку.',progress:0});return false;}
  }
  function setHint(value){
    if(hint?.id===value?.id&&hint?.label===value?.label)return;
    hint=value;callbacks.onHint?.(value?{id:value.id,label:value.label,type:value.type}:null);
  }
  function candidates(){
    if(!config)return [];
    return [...config.interactions,...config.doors.map(d=>({...d,type:'door',title:d.title,radius:2.15})),
      ...config.npcs.map(n=>({...n,type:'person',title:'Поговорить',radius:1.65})),
      ...config.rooms.filter(r=>r.id.startsWith('meeting')||r.id.startsWith('guest')||r.id==='events').map(r=>({...r,type:'room',title:r.name,radius:1.6}))];
  }
  function updateHint(){
    if(!player||loading)return;
    if(seated){setHint({...seated,label:'Встать',type:'stand'});return;}
    let best=null,bestScore=Infinity;
    for(const c of candidates()){
      const dist=Math.hypot(player.position.x-c.x,player.position.z-c.z);if(dist>(c.radius||1.6))continue;
      // Context actions never pass through a wall; doors are approached from either side.
      if(c.type!=='door'&&c.type!=='seat'&&!navigation.clearSegment(player.position,c))continue;
      if(c.type==='seat'&&!findSeatApproach(c,navigation,player.position,obstacles))continue;
      const score=dist-(c.type==='door'?.2:0);if(score<bestScore){best=c;bestScore=score;}
    }
    setHint(best?{...best,label:best.type==='door'?(doorStates[best.id]?'Закрыть дверь':'Открыть дверь'):best.title}:null);
  }
  function stand(){
    if(!seated)return true;
    const choices=[seated.previous,seated.exit];
    const p=choices.find(p=>p&&!navigation.blocked(p.x,p.z)&&Math.hypot(p.x-seated.x,p.z-seated.z)<2.7);
    if(!p){callbacks.onNotice?.('Рядом нет свободного места, чтобы встать.');return false;}
    player.position.set(p.x,0,p.z);playerStanding.visible=true;playerSeated.visible=false;seated=null;updateHint();invalidate(true);return true;
  }
  function interact(){
    if(!keyboardEnabled||loading||!hint||!player)return;
    const h=hint;input.clear();stop();
    if(h.type==='stand'){stand();return;}
    if(h.type==='lift'||h.type==='stairs'||h.type==='reception'){callbacks.onCompany?.();return;}
    if(h.type==='person'){callbacks.onPerson?.(h.id);return;}
    if(h.type==='room'){callbacks.onDepartment?.(h.department||h.id);return;}
    if(h.type==='door'){
      if(doorsAnimating.some(a=>a.id===h.id))return;
      const d=config.doors.find(d=>d.id===h.id),open=!doorStates[h.id],next=doorCollider(d,open);
      const p=player.position;
      if(Math.abs(p.x-next.x)<next.w/2+.33&&Math.abs(p.z-next.z)<next.d/2+.33){callbacks.onNotice?.('Отойдите немного от створки двери.');return;}
      // Opening removes the barrier only once the leaf has finished moving.
      if(!open){doorStates[h.id]=false;rebuildNavigation();}
      doorsAnimating.push({id:h.id,hinge:d.hinge,from:d.hinge?.rotation.y||0,to:open?-Math.PI/2:0,progress:0,open});
      invalidate(true);return;
    }
    if(h.type==='seat'){
      const previous={x:player.position.x,z:player.position.z};
      // Require an approach to the front; do not allow sitting through a partition.
      const approach=findSeatApproach(h,navigation,previous,obstacles);
      if(!approach){callbacks.onNotice?.('Подойдите к креслу спереди.');return;}
      seated={...h,previous,exit:approach};player.position.set(h.x,0,h.z);player.rotation.y=h.yaw;
      playerStanding.visible=false;playerSeated.visible=true;updateHint();invalidate(true);
    }
  }
  function actionKey(e){if(e.code!=='KeyE'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||isTextEntry(e.target)||!keyboardEnabled||loading)return;e.preventDefault();interact();}
  window.addEventListener('keydown',actionKey);
  function pick(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
  function down(e){if(e.button!==0)return;pointerStart=[e.clientX,e.clientY];canvas.focus({preventScroll:true});}
  function up(e){
    const start=pointerStart;pointerStart=null;
    if(e.button!==0||!start||loading||!keyboardEnabled||!player||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;
    pick(e);scene.updateMatrixWorld(true);const hits=raycaster.intersectObjects(world.pickables,false);
    if(hits.length){stop();callbacks.onPerson?.(hits[0].object.userData.personId);return;}
    if(!raycaster.ray.intersectPlane(plane,intersection))return;
    if(navigation.blocked(intersection.x,intersection.z)){callbacks.onNotice?.('Выберите свободный участок пола. Дверь открывается клавишей E.');return;}
    if(!stand())return;
    input.clear();path=navigation.findPath(player.position,intersection);pathIndex=0;
    if(path.length){const end=path.at(-1);destination.position.set(end.x,.03,end.z);destination.visible=true;invalidate();}
    else callbacks.onNotice?.('Проход закрыт. Подойдите к двери и нажмите E.');
  }
  function hover(e){if(e.timeStamp-hoverTime<70||e.buttons||!world)return;hoverTime=e.timeStamp;pick(e);canvas.style.cursor=raycaster.intersectObjects(world.pickables,false).length?'pointer':'default';}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointermove',hover);
  function project(x,y,z){projected.set(x,y,z).project(camera);return {x:(projected.x+1)*width/2,y:(1-projected.y)*height/2,visible:projected.z<1&&Math.abs(projected.x)<.97&&Math.abs(projected.y)<.9};}
  function publishLabels(){
    if(!config||!player)return;
    const top=width<620?125:80;
    const rooms=config.rooms.filter(r=>r.department!=='lift').map(r=>({...project(r.x,1.6,r.z),id:r.department,name:r.name,key:r.id})).map(r=>({...r,visible:r.visible&&r.y>top&&r.y<height-105}));
    const me=project(player.position.x,1.65,player.position.z);
    callbacks.onLabels?.({rooms,me:{...me,visible:me.visible&&me.y>top&&me.y<height-100},zoom:Math.round(camera.zoom*100)});labelsDirty=false;
  }
  function tick(now){
    frame=0;if(disposed||document.hidden)return;
    const dt=Math.min((now-last)/1000,.05);last=now;
    let moved=false;
    if(player&&!loading){
      let dir=movementDirection(input.keys);const tapped=!(dir.x||dir.z)&&pending;if(tapped)dir=pending;pending=null;
      dir=cameraRelativeDirection(dir);
      const x=player.position.x,z=player.position.z;
      if((dir.x||dir.z)&&seated)stand();
      if(!seated&&(dir.x||dir.z)){
        const speed=input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')?4.2:2.4;
        moved=navigation.move(player.position,dir.x*speed*(tapped?1/30:dt),dir.z*speed*(tapped?1/30:dt));
      }else if(!seated&&pathIndex<path.length){
        let remaining=2.4*dt;
        while(remaining>0&&pathIndex<path.length){
          const p=path[pathIndex],dx=p.x-player.position.x,dz=p.z-player.position.z,dist=Math.hypot(dx,dz);
          if(dist<.005){pathIndex++;continue;}const step=Math.min(dist,remaining);
          const changed=navigation.move(player.position,dx/dist*step,dz/dist*step);moved=changed||moved;
          if(!changed){path=[];break;}remaining-=step;if(step===dist)pathIndex++;
        }
        if(pathIndex>=path.length)destination.visible=false;
      }
      if(moved){player.rotation.y=Math.atan2(player.position.x-x,player.position.z-z);inspectionTarget=null;}
      for(let i=0;i<legs.length;i++)legs[i].node.rotation.x=legs[i].base+(moved?Math.sin(now*.015+i*Math.PI)*.42:0);
      for(let i=0;i<arms.length;i++)arms[i].node.rotation.x=arms[i].base+(moved?-Math.sin(now*.015+i*Math.PI)*.24:0);
      if(moved||walking){invalidate(true);updateHint();}setWalking(moved);
      ring.position.x=player.position.x;ring.position.z=player.position.z;ring.visible=!seated;
    }
    if(doorsAnimating.length){
      for(const a of doorsAnimating){a.progress=Math.min(1,a.progress+dt*3.6);if(a.hinge)a.hinge.rotation.y=T.MathUtils.lerp(a.from,a.to,1-(1-a.progress)**3);if(a.progress===1)doorStates[a.id]=a.open;}
      const finished=doorsAnimating.some(a=>a.progress===1);doorsAnimating=doorsAnimating.filter(a=>a.progress<1);
      if(finished){rebuildNavigation();updateHint();}invalidate(true);
    }
    if(player)followPlayer(camera,controls.target,inspectionTarget||player.position);
    const changed=controls.update();
    if(dirty||changed){
      if(renderer.shadowMap.needsUpdate)shadowFrames++;
      renderer.render(scene,camera);renderFrames++;dirty=false;
      if(moved&&lastActiveTime){activeFrameMs+=now-lastActiveTime;activeFrameCount++;}lastActiveTime=moved?now:0;
      if(import.meta.env.DEV){
        Object.assign(canvas.dataset,{floor:config?.id||'',playerX:player?.position.x.toFixed(3)||'',playerZ:player?.position.z.toFixed(3)||'',cameraTargetX:controls.target.x.toFixed(3),cameraTargetZ:controls.target.z.toFixed(3),seated:seated?.id||'',interaction:hint?.id||'',renderFrames,shadowFrames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,loadedAssets:library.stats().loaded,assetRequests:library.stats().requests,missingModels:[...library.missing].join(','),openDoors:config?.doors.filter(d=>doorStates[d.id]).map(d=>d.id).join(',')||'',activeFrameCount,activeFrameMs:activeFrameMs.toFixed(1),activeFps:activeFrameMs?(1000*activeFrameCount/activeFrameMs).toFixed(1):'',objects:config?.objects.length||0});
      }
    }
    if(labelsDirty)publishLabels();
    if(moved||pathIndex<path.length||changed||doorsAnimating.length)requestFrame();
  }
  function visibility(){input.clear();stop();setWalking(false);if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();invalidate(true);}}
  function restored(){invalidate(true);}
  document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextrestored',restored);
  const cameraChange=()=>invalidate();controls.addEventListener('change',cameraChange);reset();resize();const observer=new ResizeObserver(resize);observer.observe(container);
  changeFloor(1,'entrance');
  return {
    changeFloor,interact,reset,
    zoom(delta){camera.zoom=T.MathUtils.clamp(camera.zoom+delta,.65,2.1);camera.updateProjectionMatrix();invalidate();},
    setKeyboardEnabled(value){keyboardEnabled=value;if(!value){input.clear();stop();}},
    async locate(id){
      const floor=FLOORS.find(f=>f.npcs.some(n=>n.id===id));if(id==='alexey'){reset();return;}
      if(!floor)return;
      if(floor.id!==config?.id)await changeFloor(floor.id);
      if(disposed)return;const npc=floor.npcs.find(p=>p.id===id);
      inspectionTarget=npc;followPlayer(camera,controls.target,npc);controls.update();invalidate();
    },
    dispose(){
      disposed=true;loadToken++;input.dispose();cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('change',cameraChange);controls.dispose();
      window.removeEventListener('keydown',actionKey);document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointermove',hover);canvas.removeEventListener('webglcontextrestored',restored);
      world?.release();player?.removeFromParent();library.dispose();sun.shadow.dispose();ring.geometry.dispose();ring.material.dispose();destination.geometry.dispose();destination.material.dispose();renderer.dispose();canvas.remove();
    }
  };
}
