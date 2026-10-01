import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {createAssetLibrary} from '../world/assets.js';
import {createNavigation,createKeyboardInput,movementDirection,isTextEntry} from '../movement.js';
import {cameraRelativeDirection,CAMERA_RIG} from '../world/camera.js';
import {compactCharacter,disposeScene} from '../rendering.js';
import {EYE_HEIGHT,PHARMACY_HEIGHT_SCALE,lookDirection,turnLook,positionEyes,createLookInput} from '../world/firstPerson.js';
import {cityPixelRatio} from './renderBudget.js';
import {buildExterior,buildInterior,COMMON_ASSETS} from './geometry.js';
import {PROJECTS,CITY_SPAWN,CITY_BOUNDS,INTERIOR_BOUNDS,getProject} from './catalog.js';
import {loadExteriorSurfaces,loadTynyshSurfaces} from './surfaces.js';
import {createTynyshActors} from './tynyshActors.js';
import {TYNYSH_SPAWN} from './tynyshLayout.js';
import {createGuideActor} from '../guide/guideActor.js';
import {createGuideWalker,guideMeetingPoint} from '../guide/guideWalker.js';
import {GUIDE_POSITION} from '../guide/knowledge.js';
import {PHARMACY_CAMERA,PHARMACY_SPAWN,pharmacyDirection} from './pharmacyLayout.js';
import {createPharmacyActors} from './pharmacyActors.js';
import {createArgusActors} from './argusActors.js';

export function createCityWorld(container,{location='city',spawn=CITY_SPAWN,overview=true,cameraMode='overview',director,...callbacks}={}){
  let disposed=false,ready=false,enabled=true,frame=0,last=performance.now(),dirty=true,walking=false;
  let guideActor=null,guideWalker=null,guideProject=null,guideRestore=null;
  let player=null,world=null,navigation=null,path=[],pending=null,manual={x:0,z:0},hint=null;
  let width=1,height=1,showOverview=location==='city'&&overview,zoom=1,pointerStart=null;
  let activeFrameCount=0,activeFrameMs=0,renderFrames=0,shadowFrames=0;
  let pharmacyDemo=null,argusDemo=null,tynyshDemo=null,selectedShelf='A-02';
  let botVisuals=null,botResult=null,botViewKey='',lastBotUi=0,cameraMoving=false;
  const cameraFocus=new T.Vector2(0,0),focusPoint=new T.Vector2(),projected=new T.Vector3();
  const isPharmacy=location==='pharmacy',isArgus=location==='argus',isTynysh=location==='tynysh',isStory=isPharmacy||isArgus||isTynysh;
  const roomCamera=isTynysh?{height:19,distance:20,yaw:0}:isArgus?{height:19,distance:25,yaw:0}:PHARMACY_CAMERA;
  const library=createAssetLibrary(),scene=new T.Scene();scene.background=new T.Color(isPharmacy?'#cbd4ca':isArgus?'#b8cbd1':'#c8d4b6');
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.dataset.testid='city-canvas';canvas.dataset.location=location;
  canvas.setAttribute('aria-label','Трёхмерный город. WASD или стрелки — движение, Shift — быстрее, E — взаимодействовать.');container.appendChild(canvas);
  const arrival=location==='city'&&PROJECTS.find(p=>Math.hypot(spawn.x-p.entry.x,spawn.z-p.entry.z)<2.2);
  const defaultYaw=arrival?(arrival.yaw||0)+Math.PI:0;
  let firstPerson=cameraMode==='first-person',lookPose={yaw:defaultYaw,pitch:0};
  const overhead=isStory?new T.PerspectiveCamera(32,1,.1,260):new T.OrthographicCamera(-30,30,24,-24,.1,260),target=new T.Vector3();
  const eyes=new T.PerspectiveCamera(68,1,.045,260);let camera=firstPerson?eyes:overhead;
  const composer=new EffectComposer(renderer);
  composer.renderTarget1.samples=2;composer.renderTarget2.samples=2;
  const renderPass=new RenderPass(scene,camera),ao=new GTAOPass(scene,overhead,1,1,undefined,{radius:.75,thickness:.75,distanceExponent:1,samples:8},{radius:4,samples:8}),output=new OutputPass();
  const bloom=new UnrealBloomPass(new T.Vector2(1,1),.2,.15,1.8);
  ao.blendIntensity=.65;composer.addPass(renderPass);composer.addPass(ao);composer.addPass(bloom);composer.addPass(output);
  renderer.info.autoReset=false;
  const sun=new T.DirectionalLight('#ffdeb0',3.5);sun.position.set(-28,46,-18);sun.castShadow=true;sun.shadow.mapSize.set(location==='city'?4096:2048,location==='city'?4096:2048);
  const shadowSpan=location==='city'?49:15;
  Object.assign(sun.shadow.camera,{left:-shadowSpan,right:shadowSpan,top:shadowSpan,bottom:-shadowSpan,near:1,far:140});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;
  scene.add(sun,new T.HemisphereLight('#deedff',isPharmacy?'#947953':'#566936',isPharmacy?1.15:1.35));
  const fill=new T.DirectionalLight(isPharmacy?'#fff0d7':'#d9e7ec',isPharmacy?1.6:1.25);fill.position.set(15,18,30);scene.add(fill);
  const ringMaterial=new T.MeshBasicMaterial({color:'#70e7c2',side:T.DoubleSide});
  const ring=new T.Mesh(new T.RingGeometry(.53,.6,40),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.085;scene.add(ring);
  // Moving actors use a small contact shadow; the sun map contains only static
  // architecture/foliage and is refreshed on real scene changes, not footsteps.
  const contact=new T.Mesh(new T.CircleGeometry(location==='city'?.66:.44,24),new T.MeshBasicMaterial({color:'#263c32',transparent:true,opacity:.19,depthWrite:false}));
  contact.rotation.x=-Math.PI/2;contact.position.y=.075;contact.scale.y=.75;scene.add(contact);
  const destination=new T.Mesh(new T.RingGeometry(.18,.25,24),ringMaterial.clone());destination.rotation.x=-Math.PI/2;destination.visible=false;scene.add(destination);
  const ray=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),point=new T.Vector3();
  let limbs=[];
  const invalidate=(shadow=false)=>{dirty=true;if(shadow)renderer.shadowMap.needsUpdate=true;if(!disposed&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);};
  function setWalking(next){if(next!==walking){walking=next;callbacks.onWalk?.(next);}}
  function stop(){path=[];manual={x:0,z:0};pending=null;destination.visible=false;setWalking(false);invalidate();}
  const input=createKeyboardInput({eventTarget:window,canUse:()=>enabled&&ready&&!document.hidden,
    onChange(event){if(event?.pressed){if(!walking){activeFrameCount=0;activeFrameMs=0;}path=[];destination.visible=false;pending=movementDirection(input.keys);}invalidate();},
    onStop:stop,onHome:reset});
  function projection(){
    const aspect=width/height;
    eyes.aspect=aspect;eyes.fov=aspect<1?82:68;eyes.updateProjectionMatrix();
    if(firstPerson)return;
    if(isStory){camera.aspect=aspect;camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.max(17.2,(isTynysh&&aspect<.85?19.5:aspect<.85?24:21.4)/aspect)/(2*Math.hypot(roomCamera.height,roomCamera.distance))));camera.zoom=zoom;camera.updateProjectionMatrix();return;}
    const span=showOverview?Math.max(52,78/aspect):Math.max(location==='city'?23:location==='autofix'?20:14,15/aspect);
    camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span*(showOverview?.52:.60);camera.bottom=-span*(showOverview?.48:.40);camera.zoom=zoom;camera.updateProjectionMatrix();
  }
  function follow(dt){
    if(!player)return;
    if(firstPerson){cameraMoving=false;positionEyes(eyes,player.position,lookPose,location==='city'?1.72:EYE_HEIGHT);return;}
    // A lightly clamped follow keeps the whole small shop legible while walking.
    let focus=location==='autofix'?{x:0,z:0}:isStory?{x:T.MathUtils.clamp(player.position.x*.12,-.6,.6),z:T.MathUtils.clamp((player.position.z-4.3)*.10,-.65,.1)}:showOverview?{x:0,z:0}:player.position;
    if(isStory){
      const simulation=isTynysh?tynyshDemo:isArgus?argusDemo:pharmacyDemo;
      if(simulation?.automation.follow&&botResult){const actor=botResult.actors.find(a=>a.id===botResult.view.actor);if(actor)focus={x:actor.x*.72,z:actor.z*.65};}
      cameraFocus.lerp(focusPoint.set(focus.x,focus.z),1-Math.exp(-7*dt));cameraMoving=Math.hypot(cameraFocus.x-focus.x,cameraFocus.y-focus.z)>.002;
      focus={x:cameraFocus.x,z:cameraFocus.y};if(cameraMoving)dirty=true;
    }
    const yaw=isStory?roomCamera.yaw:(showOverview?0:CAMERA_RIG.azimuthDegrees)*Math.PI/180;
    const distance=isStory?roomCamera.distance:showOverview?75:CAMERA_RIG.distance,height=isStory?roomCamera.height:showOverview?61:CAMERA_RIG.height;
    const aim=isStory?1.4:.8;
    target.set(focus.x,aim,focus.z);camera.position.set(focus.x+Math.sin(yaw)*distance,height+aim,focus.z+Math.cos(yaw)*distance);camera.lookAt(target);camera.updateMatrixWorld(true);
  }
  function reset(){if(firstPerson){lookPose={yaw:defaultYaw,pitch:0};invalidate();return;}showOverview=false;zoom=1;projection();invalidate();}
  function overviewMap(value){if(location!=='city')return;if(firstPerson)setCameraMode('overview');stop();showOverview=typeof value==='boolean'?value:!showOverview;zoom=1;projection();invalidate();}
  function resize(){width=Math.max(1,container.clientWidth);height=Math.max(1,container.clientHeight);const ratio=cityPixelRatio(width,height,window.devicePixelRatio);renderer.setPixelRatio(ratio);renderer.setSize(width,height);composer.setPixelRatio(ratio);composer.setSize(width,height);ao.setSize(Math.round(width*ratio*.65),Math.round(height*ratio*.65));bloom.setSize(Math.round(width*ratio*.5),Math.round(height*ratio*.5));ao.enabled=!firstPerson&&width>720;bloom.enabled=width>720;projection();invalidate();}
  function look(dx,dy){if(!enabled||!firstPerson)return;lookPose=turnLook(lookPose,dx,dy);invalidate();}
  function setCameraMode(mode){
    firstPerson=mode==='first-person';input.clear();stop();lookInput.release();camera=firstPerson?eyes:overhead;
    renderPass.camera=camera;ao.enabled=!firstPerson&&width>720;showOverview=false;cameraMoving=false;
    if(player)player.visible=!firstPerson;ring.visible=contact.visible=!firstPerson;world?.setFirstPerson?.(firstPerson);
    scene.background.set(firstPerson?'#c9e2ec':isTynysh?'#ded8c6':isPharmacy?'#cbd4ca':isArgus?'#b8cbd1':'#c8d4b6');scene.fog=firstPerson&&location==='city'?new T.Fog('#c9e2ec',65,180):null;
    callbacks.onCameraMode?.(firstPerson?'first-person':'overview');projection();invalidate(true);
    if(firstPerson)lookInput.capture();
  }
  const lookInput=createLookInput(canvas,{canUse:()=>enabled&&ready&&!document.hidden,isFirstPerson:()=>firstPerson,onToggle:()=>setCameraMode(firstPerson?'overview':'first-person'),onLook:look,onUnlock:()=>{input.clear();stop();},onStart:()=>{path=[];destination.visible=false;invalidate();}});
  function project(x,y,z){const p=projected.set(x,y,z).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<.95&&Math.abs(p.y)<.9};}
  function getGuidePosition(){
    if(!ready||!guideWalker)return null;
    const entry=getProject(guideProject)?.entry;
    return {...guideWalker.snapshot(),canEnter:!!entry&&Math.hypot(player.position.x-entry.x,player.position.z-entry.z)<2.7&&navigation.clearSegment(player.position,entry)};
  }
  function publish(){
    if(guideWalker){const pose=guideWalker.snapshot();Object.assign(canvas.dataset,{guideX:pose.x.toFixed(3),guideZ:pose.z.toFixed(3),guideMoving:String(pose.moving),guidePhase:pose.phase});}
    const bot=botResult?.actors.find(a=>a.id===botResult.view.actor);
    const simulation=isTynysh?tynyshDemo:isArgus?argusDemo:pharmacyDemo;
    const running=isArgus?argusDemo?.phase!=='setup':!!pharmacyDemo?.request;
    const bubbles=isStory&&bot&&running&&simulation?.automation.mode==='auto'&&botResult.view.phase!=='complete'?[{id:'bot-'+bot.id,kind:'bot',name:bot.name+' · '+(simulation.automation.paused?'Пауза':botResult.view.text),x:bot.x,y:2.65*(isPharmacy?PHARMACY_HEIGHT_SCALE:isArgus?.75:1),z:bot.z}]:[];
    const markers=[...world.markers,...bubbles].map(m=>{const screen=project(m.x,m.y,m.z);return {...m,...screen,visible:screen.visible&&!(showOverview&&location==='city')};});
    const me=project(player.position.x,location==='city'?3.15:2.08,player.position.z);
    callbacks.onLabels?.({markers: firstPerson?[]:markers,me:{...me,visible:!firstPerson&&me.visible},overview:showOverview,zoom:Math.round(zoom*100)});
    Object.assign(canvas.dataset,{cameraMode:firstPerson?'first-person':'overview',cameraYaw:lookPose.yaw.toFixed(3),cameraPitch:lookPose.pitch.toFixed(3),eyeHeight:camera.position.y.toFixed(3),avatarVisible:String(player.visible),playerX:player.position.x.toFixed(3),playerZ:player.position.z.toFixed(3),overview:showOverview?'true':'false',interaction:hint?.id||'',moving:String(walking),enabled:String(enabled),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),activeFps:activeFrameCount>4?(1000*activeFrameCount/activeFrameMs).toFixed(1):'',activeFrames:String(activeFrameCount),renderFrames:String(renderFrames),shadowFrames:String(shadowFrames),pixelRatio:renderer.getPixelRatio().toFixed(2),missingModels:[...library.missing].join(',')});
    if(isArgus&&argusDemo)Object.assign(canvas.dataset,{incidentPhase:argusDemo.phase,incidentScenario:argusDemo.scenario,incidentRevision:String(argusDemo.revision)});
    if(isTynysh&&tynyshDemo)Object.assign(canvas.dataset,{banquetPhase:tynyshDemo.phase,banquetReady:String(tynyshDemo.tasks.filter(t=>t.done).length),banquetGuests:String(tynyshDemo.event.guests)});
    if(botResult)Object.assign(canvas.dataset,{botPhase:botResult.view.phase,botActor:botResult.view.actor,botAction:botResult.view.text,botProgress:String(botResult.view.progress??''),botPositions:JSON.stringify(botResult.actors.map(({id,x,z,carrying})=>({id,x:+x.toFixed(3),z:+z.toFixed(3),carrying}))),botFollowing:String(!firstPerson&&!!simulation?.automation.follow)});
  }
  function updateHint(){
    let next=null,distance=Infinity;
    for(const item of world.interactions){
      const dist=Math.hypot(player.position.x-item.x,player.position.z-item.z);
      if(dist<item.radius&&dist<distance&&navigation.clearSegment(player.position,item)){next=item;distance=dist;}
    }
    if(next?.id!==hint?.id){hint=next;callbacks.onHint?.(next);if(isPharmacy&&next?.type==='shelf'){world.selectShelf(next.shelf);callbacks.onShelfFocus?.(next.shelf);dirty=true;}}
  }
  function interact(){if(!ready||!enabled||!hint)return;input.clear();stop();callbacks.onAction?.({...hint});}
  function actionKey(e){if(e.repeat||!enabled||isTextEntry(e.target)||e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;if(e.code==='KeyE'||['e','у'].includes(e.key?.toLowerCase())){e.preventDefault();interact();}}
  function navigate(to){
    if(!ready||navigation.blocked(to.x,to.z))return false;
    const route=navigation.findPath(player.position,to);
    if(!route.length){callbacks.onNotice?.('К этой точке пока нет свободного прохода.');return false;}
    input.clear();activeFrameCount=0;activeFrameMs=0;path=route;pending=null;destination.position.set(to.x,.09,to.z);destination.visible=true;
    if(showOverview){showOverview=false;projection();}invalidate();return true;
  }
  function down(e){if(firstPerson||e.button!==0)return;pointerStart=[e.clientX,e.clientY];canvas.focus({preventScroll:true});}
  function up(e){const start=pointerStart;pointerStart=null;if(firstPerson||!enabled||!ready||!start||e.button!==0||Math.hypot(start[0]-e.clientX,start[1]-e.clientY)>6)return;
    const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
    if(ray.ray.intersectPlane(plane,point)&&!navigate(point))callbacks.onNotice?.('Нажмите на свободную дорожку. Входы открываются клавишей E.');
  }
  function zoomBy(delta){if(firstPerson)return;zoom=T.MathUtils.clamp(zoom+delta,.65,2.1);projection();invalidate();}
  function wheel(e){if(!enabled)return;e.preventDefault();zoomBy(-Math.sign(e.deltaY)*.08);}
  function tick(now){
    frame=0;if(disposed||document.hidden)return;
    const interval=now-last,dt=Math.min(.04,interval/1000);last=now;
    let moved=false,guideActive=false;
    if(ready&&guideWalker){
      const wasMoving=guideWalker.snapshot().moving,pose=guideWalker.update(dt);
      guideActor.update(pose,now/1000);guideActive=pose.moving;
      if(wasMoving||guideActive)dirty=true;
    }
    if(ready&&isStory&&director){
      const simulation=isTynysh?tynyshDemo:isArgus?argusDemo:pharmacyDemo;
      botResult=director.update(simulation,Math.min(interval/1000,1));botVisuals.update(botResult,simulation);world.updateIncident?.(argusDemo,botResult);
      const key=JSON.stringify([botResult.view.phase,botResult.view.text,botResult.view.actor]);
      if(key!==botViewKey||botResult.active&&now-lastBotUi>250){botViewKey=key;lastBotUi=now;callbacks.onBotView?.(botResult.view);}
      if(botResult.active)dirty=true;
      if(botResult.command){
        const command=botResult.command;
        if(command.command==='CAPTURE'){
          try{command.image=captureShelf(pharmacyDemo.request.shelf,{detail:command.detail});}
          catch{command.image=null;} // The reducer surfaces a retryable photo error; the render loop stays alive.
        }
        callbacks.onBotEvent?.(command);
      }
    }
    if(ready&&enabled){
      const oldX=player.position.x,oldZ=player.position.z;
      let dir=movementDirection(input.keys);if(manual.x||manual.z)dir=manual;
      const tapped=!(dir.x||dir.z)&&pending;if(tapped)dir=pending;pending=null;
      if(dir.x||dir.z){
        if(showOverview){showOverview=false;projection();}
        dir=firstPerson?lookDirection(dir,lookPose.yaw):isPharmacy?pharmacyDirection(dir):(isArgus||isTynysh)?dir:cameraRelativeDirection(dir);const speed=location==='city'?(input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')?7.8:4.7):2.8;
        moved=navigation.move(player.position,dir.x*speed*(tapped?1/30:dt),dir.z*speed*(tapped?1/30:dt));
      }else if(path.length){
        const next=path[0],dx=next.x-player.position.x,dz=next.z-player.position.z,dist=Math.hypot(dx,dz),step=Math.min(dist,(location==='city'?5.7:2.8)*dt);
        if(dist<.04)path.shift();else if(!navigation.move(player.position,dx/dist*step,dz/dist*step))path=[];else moved=true;
        if(!path.length)destination.visible=false;
      }
      if(moved){player.rotation.y=Math.atan2(player.position.x-oldX,player.position.z-oldZ);dirty=true;}
      for(let i=0;i<limbs.length;i++){const l=limbs[i];l.node.rotation.x=l.base+(moved?Math.sin(now*.013+(l.side==='L'?0:Math.PI))*(l.arm?-.28:.45):0);}
      if(moved&&walking){activeFrameCount++;activeFrameMs+=interval;}
      if(walking!==moved)dirty=true;setWalking(moved);updateHint();
    }
    if(ready){ring.position.x=contact.position.x=player.position.x;ring.position.z=contact.position.z=player.position.z;follow(Math.min(interval/1000,.1));}
    if(dirty){if(renderer.shadowMap.needsUpdate)shadowFrames++;renderer.info.reset();composer.render();renderFrames++;dirty=false;if(ready)publish();}
    if(guideActive||moved||path.length||botResult?.active||cameraMoving||(enabled&&(input.keys.size||manual.x||manual.z)))invalidate();
  }
  function visibility(){input.clear();stop();if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();invalidate(true);}}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',actionKey);document.addEventListener('visibilitychange',visibility);
  const assets=[...COMMON_ASSETS,...PROJECTS.map(p=>p.exteriorAsset).filter(Boolean)];
  Promise.all([
    library.prepare(assets,(done,total)=>{if(!disposed)callbacks.onLoading?.(Math.round(done/total*100));}).then(()=>library.getTemplates(assets)),
    location==='city'?loadExteriorSurfaces():isTynysh?loadTynyshSurfaces():Promise.resolve({})
  ]).then(([templates,albedos])=>{
    if(disposed){Object.values(albedos).forEach(t=>t.dispose());return;}
    world=location==='city'?buildExterior(templates,albedos):buildInterior(location,templates,albedos);scene.add(world.root);
    if(location==='city'){guideActor=createGuideActor(templates);scene.add(guideActor.root);world.interactions.push(guideActor.interaction);world.markers.push(guideActor.marker);}
    if(isPharmacy){botVisuals=createPharmacyActors(templates);botVisuals.root.scale.y=PHARMACY_HEIGHT_SCALE;scene.add(botVisuals.root);}
    if(isArgus){botVisuals=createArgusActors(templates);botVisuals.root.scale.y=.75;scene.add(botVisuals.root);world.updateIncident(argusDemo,null);}
    if(isTynysh){botVisuals=createTynyshActors(templates);scene.add(botVisuals.root);world.setTynyshDemo(tynyshDemo);}
    world.setFirstPerson?.(firstPerson);world.setCampaign?.(pharmacyDemo);world.selectShelf?.(selectedShelf);
    navigation=createNavigation(world.obstacles,location==='city'?CITY_BOUNDS:INTERIOR_BOUNDS);
    if(guideActor){guideWalker=createGuideWalker(navigation,GUIDE_POSITION);guideWalker.restore(guideRestore);guideActor.update(guideWalker.snapshot(),0);}
    player=new T.Group();const figure=compactCharacter(templates.get('employee_base').clone(true));figure.scale.setScalar(location==='city'?2.4:(isPharmacy||isTynysh)?2.0:1.5);if(isPharmacy)figure.scale.y*=PHARMACY_HEIGHT_SCALE;player.add(figure);
    figure.traverse(node=>{if(/^(leg_|arm_)[LR]/.test(node.name))limbs.push({node,base:node.rotation.x,side:node.name.includes('_L')?'L':'R',arm:node.name.startsWith('arm')});});
    const start=location==='city'?spawn:isTynysh?TYNYSH_SPAWN:isPharmacy?PHARMACY_SPAWN:{x:0,z:4.4};player.position.set(start.x,.08,start.z);player.rotation.y=Math.PI;scene.add(player);
    player.visible=!firstPerson;ring.visible=contact.visible=!firstPerson;
    scene.background.set(firstPerson?'#c9e2ec':isTynysh?'#ded8c6':isPharmacy?'#cbd4ca':isArgus?'#b8cbd1':'#c8d4b6');if(firstPerson&&location==='city')scene.fog=new T.Fog('#c9e2ec',65,180);
    ready=true;last=performance.now();callbacks.onLoading?.(null);invalidate(true);updateHint();
    if(library.missing.size)callbacks.onNotice?.('Некоторые модели заменены временной геометрией.');
  }).catch(error=>{if(!disposed)callbacks.onError?.(error.message||'Не удалось собрать город.');});
  function captureShelf(id,{detail=false}={}){
      if(!ready||!isPharmacy)return null;
      const pose=world.capturePose?.(id,{detail,portion:pharmacyDemo?.request?.portion});if(!pose)return null;
      // Capture only actual scene pixels. This never requests a camera or uploads an image.
      const photoCamera=new T.PerspectiveCamera(43,4/3,.05,35);photoCamera.position.copy(pose.position);photoCamera.lookAt(pose.target);photoCamera.updateMatrixWorld(true);
      const photoTarget=new T.WebGLRenderTarget(640,480,{depthBuffer:true});photoTarget.texture.colorSpace=T.SRGBColorSpace;
      const previous=renderer.getRenderTarget(),pixels=new Uint8Array(640*480*4),photo=document.createElement('canvas');photo.width=640;photo.height=480;
      const frameVisible=world.root.visible,playerVisible=player.visible,ringVisible=ring.visible,destinationVisible=destination.visible,contactVisible=contact.visible;
      try{
        player.visible=false;ring.visible=false;contact.visible=false;destination.visible=false;if(botVisuals)botVisuals.root.visible=false;scene.updateMatrixWorld(true);
        renderer.setRenderTarget(photoTarget);renderer.clear();renderer.render(scene,photoCamera);renderer.readRenderTargetPixels(photoTarget,0,0,640,480,pixels);
        const ctx=photo.getContext('2d'),data=ctx.createImageData(640,480);
        for(let y=0;y<480;y++)data.data.set(pixels.subarray((479-y)*640*4,(480-y)*640*4),y*640*4);
        ctx.putImageData(data,0,0);ctx.fillStyle='#173b32';ctx.fillRect(0,446,640,34);ctx.font='14px Arial';ctx.fillStyle='#dfffee';ctx.fillText('DEMO · 3D-сцена · '+id,16,468);
        return photo.toDataURL('image/jpeg',.88);
      }finally{renderer.setRenderTarget(previous);photoTarget.dispose();world.root.visible=frameVisible;player.visible=playerVisible;ring.visible=ringVisible;contact.visible=contactVisible;destination.visible=destinationVisible;if(botVisuals)botVisuals.root.visible=true;invalidate();}
  }
  return {
    getGuidePosition,
    restoreGuide(pose){guideRestore=pose;if(guideWalker){guideWalker.restore(pose);guideActor.update(guideWalker.snapshot(),0);invalidate();}},
    walkGuideTo(id){const project=getProject(id);if(!ready||!guideWalker||!project)return false;guideProject=id;const ok=guideWalker.goTo(guideMeetingPoint(project,navigation),project.yaw||0);invalidate();return ok;},
    pauseGuide(){guideWalker?.pause();if(guideWalker)guideActor.update(guideWalker.snapshot(),0);invalidate();},
    stop,getPosition:()=>player?{x:player.position.x,z:player.position.z,navigating:path.length>0}:null,
    interact,reset,setCameraMode,look,overview:overviewMap,zoom:zoomBy,navigate,captureShelf,
    selectShelf(id){selectedShelf=id;world?.selectShelf?.(id);invalidate();},
    setPharmacyDemo(state){if(firstPerson&&state?.automation.follow&&!pharmacyDemo?.automation.follow)setCameraMode('overview');const changed=pharmacyDemo?.installed!==state?.installed;pharmacyDemo=state;world?.setCampaign?.(state);if(isPharmacy){last=performance.now();invalidate(changed);}},
    setArgusDemo(state){if(firstPerson&&state?.automation.follow&&!argusDemo?.automation.follow)setCameraMode('overview');argusDemo=state;if(isArgus){world?.updateIncident?.(state,botResult);last=performance.now();invalidate();}},
    setTynyshDemo(state){tynyshDemo=state;if(isTynysh){world?.setTynyshDemo?.(state);last=performance.now();invalidate(true);}},
    setRoomTop(value){if(!isTynysh)return;roomCamera.height=value?32:19;roomCamera.distance=value?.01:20;projection();invalidate();},
    goToProject(id){const p=getProject(id);return p?navigate(p.entry):false;},
    setKeyboardEnabled(value){enabled=value;if(!value){input.clear();stop();lookInput.release();}invalidate();},
    setDirection(x,z){if(!enabled)return;manual={x,z};path=[];invalidate();},
    dispose(){disposed=true;lookInput.dispose();input.dispose();cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('wheel',wheel);window.removeEventListener('keydown',actionKey);document.removeEventListener('visibilitychange',visibility);world?.assets.release();disposeScene(scene,[],world?.textures||[]);library.dispose();renderPass.dispose();ao.dispose();bloom.dispose();output.dispose();composer.dispose();renderer.dispose();canvas.remove();}
  };
}
