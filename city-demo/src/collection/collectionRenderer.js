import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {CopyShader} from 'three/addons/shaders/CopyShader.js';
import {PROJECTS} from '../city/catalog.js';
import {COLLECTION} from './collectionData.js';
import {createExhibitKit} from './exhibitKit.js';
import {createExhibitMotion,EXHIBIT_REST_ANGLE} from './exhibitMotion.js';
import {createExhibitEffects} from './exhibitEffects.js';
import {createShelfCarousel,SHELF_SPACING} from './shelfCarousel.js';
import {createVegetation} from '../city/vegetation.js';
import {buildProjectBuilding} from '../city/buildings.js';
import {createAssetLibrary} from '../world/assets.js';
import {loadExteriorSurfaces} from '../city/surfaces.js';
import {disposeScene} from '../rendering.js';

// One shelf and all souvenirs share a camera and shadow map. DOM buttons are
// accessible hit areas; the scene itself stays continuous during selection.
export function createCollectionRenderer(host, scrollRoot, onState) {
  let renderer;
  try {renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
  catch {onState('error');return {dispose(){},update(){},interest(){}};}
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.autoClear=false;
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  const environmentScene=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);
  const environment=pmrem.fromScene(environmentScene,.04);environmentScene.dispose();pmrem.dispose();
  // Preserve the transparent background when compositing the lit 3D shelf.
  const copyMaterial=new T.ShaderMaterial({uniforms:T.UniformsUtils.clone(CopyShader.uniforms),vertexShader:CopyShader.vertexShader,fragmentShader:CopyShader.fragmentShader,depthTest:false,depthWrite:false,transparent:true,blending:T.NormalBlending});
  const copyQuad=new FullScreenQuad(copyMaterial);
  const library=createAssetLibrary(),items=new Map(),textures=new Set(),stages=[];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const exhibits=createExhibitMotion(PROJECTS.map(p=>p.id));
  const carousel=createShelfCarousel(COLLECTION.map(p=>p.id));
  let disposed=false,frame=0,lastTime=0,resize=true,wood,stone,track=null,selection=null,count=4;
  const loadTexture=async path=>{const map=await new T.TextureLoader().loadAsync(path);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;textures.add(map);return map;};
  function invalidate(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
  function contextLost(e){e.preventDefault();cancelAnimationFrame(frame);frame=0;onState('error');}
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function surfaceGeometry(geometry,metres=6){
    // World-scale UVs avoid stretching stone pores into horizontal wood grain.
    const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
    for(let i=0;i<p.count;i++){
      if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)/metres,p.getZ(i)/metres);
      else if(geometry.type==='CylinderGeometry'||geometry.type==='LatheGeometry')uv.setXY(i,Math.atan2(p.getX(i),p.getZ(i))*11.45/metres,p.getY(i)/metres);
      else if(Math.abs(n.getZ(i))>.5)uv.setXY(i,p.getX(i)/metres,p.getY(i)/metres);
      else uv.setXY(i,p.getZ(i)/metres,p.getY(i)/metres);
    }return geometry;
  }
  function mesh(geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;}
  function roundedPlate(width,height,depth){
    // Round the outline independently of depth. RoundedBoxGeometry clamps its
    // corner radius to the thin plate's depth and made the old labels square.
    const x=-width/2,y=-height/2,r=height*.13,shape=new T.Shape();
    shape.moveTo(x+r,y);shape.lineTo(x+width-r,y);shape.quadraticCurveTo(x+width,y,x+width,y+r);
    shape.lineTo(x+width,y+height-r);shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
    shape.lineTo(x+r,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-r);
    shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
    return new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.025,curveSegments:8}).translate(0,0,-depth/2);
  }
  function plaque(text,width,height,textScale=.48){
    const group=new T.Group(),ceramic=new T.MeshPhysicalMaterial({color:'#fffdf8',metalness:0,roughness:.4,clearcoat:.2});
    group.add(mesh(roundedPlate(width+.07,height+.05,.09),new T.MeshStandardMaterial({color:'#635f56',roughness:.7}),0,0,-.055));
    group.add(mesh(roundedPlate(width,height,.12),ceramic));
    const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=Math.round(1536*height/width);
    const c=canvas.getContext('2d');c.fillStyle='#171710';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${canvas.height*textScale}px Arial`;c.fillText(text,768,canvas.height*.52,1370);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;textures.add(map);
    const face=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,transparent:true,toneMapped:false}));face.position.z=.088;group.add(face);
    const fastener=new T.MeshStandardMaterial({color:'#44413b',metalness:.15,roughness:.6});
    const inset=height*.19;
    for(const x of [-width/2+inset,width/2-inset])for(const y of [-height/2+inset,height/2-inset])group.add(mesh(new T.SphereGeometry(height*.055,12,8),fastener,x,y,.1));
    return group;
  }
  function createStage(){
    const scene=new T.Scene(),furniture=new T.Group();scene.add(furniture);scene.environment=environment.texture;scene.environmentIntensity=.035;
    scene.add(new T.HemisphereLight('#f6f7f9','#363538',.85));
    const key=new T.DirectionalLight('#fff7ed',3.15);key.position.set(-16,28,18);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);key.shadow.normalBias=.015;key.shadow.bias=-.000025;key.shadow.radius=3;
    Object.assign(key.shadow.camera,{left:-65,right:65,top:35,bottom:-20,near:1,far:120});scene.add(key);
    const fill=new T.DirectionalLight('#ced8de',.45);fill.position.set(20,12,2);scene.add(fill);
    const camera=new T.OrthographicCamera(-15,15,10,-10,.1,180);
    const composer=new EffectComposer(renderer);composer.renderToScreen=false;composer.setPixelRatio(1);
    composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;
    const renderPass=new RenderPass(scene,camera),ao=new GTAOPass(scene,camera,1,1,undefined,{radius:.5,thickness:.7,samples:8},{radius:3,samples:8}),output=new OutputPass();
    ao.blendIntensity=.72;composer.addPass(renderPass);composer.addPass(ao);composer.addPass(output);
    const stage={scene,furniture,camera,key,signature:'',composer,ao,output,size:''};stages.push(stage);return stage;
  }
  function buildFurniture(stage,width){
    const signature=width.toFixed(3);if(stage.signature===signature)return;stage.signature=signature;
    disposeScene(stage.furniture);stage.furniture.clear();
    const woodMat=new T.MeshPhysicalMaterial({map:wood,color:'#d3d9ef',roughness:.55,bumpMap:wood,bumpScale:.1,clearcoat:.15,clearcoatRoughness:.55});
    const topMat=woodMat.clone();topMat.color.set('#ffffff').multiplyScalar(2);topMat.roughness=.44;topMat.clearcoat=.3;topMat.envMapIntensity=.5;
    const slab=new RoundedBoxGeometry(width,3.25,38,5,.22),positions=slab.attributes.position;
    for(let i=0;i<positions.count;i++)if(positions.getX(i)>0)positions.setX(i,positions.getX(i)-(19-positions.getZ(i))/38*1.3);
    slab.computeVertexNormals();
    stage.furniture.add(mesh(surfaceGeometry(slab,9),[woodMat,woodMat,topMat,woodMat,woodMat,woodMat],0,-1.625,1));
    const span=width/2+12;Object.assign(stage.key.shadow.camera,{left:-span,right:span});stage.key.shadow.camera.updateProjectionMatrix();
  }
  function renderShelf(stage,rect,bounds){
    if(rect.bottom<=bounds.top||rect.top>=bounds.bottom||rect.width<1)return;
    const angle=T.MathUtils.degToRad(15);
    const tallest=Math.max(...[...items.values()].map(item=>item.height));
    const padding=parseFloat(getComputedStyle(track).paddingLeft)||0;
    const rowTop=(tallest+1.24)*(count===2?1.5:1.9)*Math.cos(angle)+40*Math.sin(angle)+4;
    const unit=Math.min((rect.width-2*padding)/(count*SHELF_SPACING),(rect.height-24)*.88/rowTop);
    const width=rect.width/unit,height=rect.height/unit,cell=(rect.width-2*padding)/count/unit;
    buildFurniture(stage,width);
    for(const [id,item] of items){
      const state=carousel.states.get(id),x=state.x/SHELF_SPACING*cell;
      item.display.position.set(x,0,state.z);item.display.scale.setScalar(state.scale);
      item.display.visible=Math.abs(x)<width/2+22;stage.scene.add(item.display);
    }
    const camera=stage.camera;camera.position.set(0,70*Math.sin(angle),70*Math.cos(angle));camera.lookAt(0,0,0);
    // Centre the physical display vertically when a wide viewport leaves extra
    // height, instead of anchoring a short building to the bottom of the screen.
    const occupied=(tallest+1.24)*Math.cos(angle)+30*Math.sin(angle)+4;
    const bottomSpace=Math.max(height*.12,(height-occupied)/2);
    camera.left=-width/2;camera.right=width/2;camera.bottom=-20*Math.sin(angle)-bottomSpace;camera.top=camera.bottom+height;camera.zoom=1;camera.updateProjectionMatrix();
    const x=rect.left-bounds.left,y=bounds.height-(rect.bottom-bounds.top);
    if(bounds.width>800){
      const size=Math.round(rect.width)+'/'+Math.round(rect.height);
      if(stage.size!==size){stage.size=size;stage.composer.setSize(Math.round(rect.width),Math.round(rect.height));stage.ao.setSize(Math.round(rect.width*.75),Math.round(rect.height*.75));}
      renderer.setScissorTest(false);stage.composer.render();renderer.setRenderTarget(null);renderer.setScissorTest(true);
    }
    renderer.setViewport(x,y,rect.width,rect.height);renderer.setScissor(Math.max(x,0),Math.max(y,0),Math.min(rect.right,bounds.right)-Math.max(rect.left,bounds.left),Math.min(rect.bottom,bounds.bottom)-Math.max(rect.top,bounds.top));
    if(bounds.width>800){copyMaterial.uniforms.tDiffuse.value=stage.composer.readBuffer.texture;copyQuad.render(renderer);}else renderer.render(stage.scene,camera);
    for(const item of items.values())item.display.removeFromParent();
  }
  function draw(time){
    frame=0;if(disposed||!wood||!track?.isConnected)return;
    const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
    const bounds=host.getBoundingClientRect();if(resize){renderer.setSize(bounds.width,bounds.height,false);resize=false;}
    const effectsMoving=exhibits.step(dt,motion.matches),shelfMoving=carousel.step(dt,motion.matches);
    for(const [id,item] of items){const state=exhibits.states.get(id);item.pivot.rotation.y=state.angle;item.effects.update(state.scene);}
    renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
    renderShelf(stages[0]||createStage(),track.getBoundingClientRect(),bounds);
    if(effectsMoving||shelfMoving)invalidate();
  }
  const observer=new ResizeObserver(entries=>{if(entries.some(e=>e.target===host))resize=true;invalidate();});observer.observe(host);observer.observe(scrollRoot);
  scrollRoot.addEventListener('scroll',invalidate,{passive:true});
  const clearInterest=()=>{exhibits.clearInterest();invalidate();};
  scrollRoot.addEventListener('wheel',clearInterest,{passive:true});scrollRoot.addEventListener('touchmove',clearInterest,{passive:true});
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;exhibits.clearInterest();}else invalidate();};document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',clearInterest);window.addEventListener('blur',clearInterest);
  async function init(){
    const ids=['plant_floor','employee_base',...PROJECTS.map(p=>p.exteriorAsset).filter(Boolean)];
    const results=await Promise.allSettled([loadExteriorSurfaces(),library.prepare(ids),loadTexture('/collection/ivory-travertine-v2.webp'),loadTexture('/collection/charcoal-wood-v2.webp')]);
    const albedos=results[0].status==='fulfilled'?results[0].value:{};Object.values(albedos).forEach(t=>textures.add(t));
    if(disposed){textures.forEach(t=>t.dispose());return;}if(results.some(r=>r.status==='rejected')||library.missing.size){onState('error');return;}
    stone=results[2].value;wood=results[3].value;wood.wrapS=wood.wrapT=T.MirroredRepeatWrapping;const templates=await library.getTemplates(ids);if(disposed)return;
    for(const project of PROJECTS){
      const kit=createExhibitKit(templates,albedos);buildProjectBuilding(kit,{...project,x:0,z:0,yaw:0,galleryDisplay:true});
      kit.box(0,.03,.85,19,.24,13.2,'#aaa79d');kit.plane(0,.16,.85,18.8,13,kit.surface('paving',18.8,13,5,'#dfdbd0'));kit.lamp(-8.4,5.6,1.3);
      const vegetation=createVegetation((x,y,z,w,h,d,col,...rest)=>kit.box(x,y,z,w*(col.startsWith('#')&&h<.8?.66:1),h,d*(col.startsWith('#')&&h<.8?.66:1),col,...rest),{detail:'original'});
      if(project.id==='pharmacy'){
        vegetation.tree(8,-1.2,1.6,57,{planter:false});
        for(const x of [-7.5,7.3]){kit.box(x,.48,5.5,1.15,.95,1.15,'#b09868');vegetation.tree(x,5.5,.58,x+20,{planter:false,base:.8});}
        kit.sign('ЗДОРОВЬЕ',8,1.85,7.5,2.35,2.9,{bg:'#283c37',fg:'#f0ecd9',sub:'БЛИЖЕ К ВАМ',border:'#a48150'});
        for(const x of [6.75,9.25])kit.box(x,1.65,7.4,.12,3.3,.18,'#a7814d');kit.box(8,.24,7.5,2.65,.18,.4,'#8d6c42');
      }
      const built=kit.finish();built.textures.forEach(t=>textures.add(t));
      const effects=createExhibitEffects(project,built.parts);
      const pivot=new T.Group();pivot.rotation.y=EXHIBIT_REST_ANGLE;built.root.position.z=-.85;pivot.add(built.root);
      const mat=new T.MeshStandardMaterial({map:stone,bumpMap:stone,bumpScale:.045,color:'#d5d1c8',roughness:.65});
      const tray=new T.Group();tray.add(mesh(surfaceGeometry(new RoundedBoxGeometry(19.5,1.15,13.8,3,.13),7),mat,0,-.665,0));
      const jointMat=new T.MeshStandardMaterial({color:'#706d65',roughness:1});
      for(let x=-8.75;x<9;x+=1.46)tray.add(mesh(new T.BoxGeometry(.025,.86,.035),jointMat,x,-.64,6.9));
      pivot.add(tray);
      const display=new T.Group();pivot.position.y=1.24;display.add(pivot);
      const label=plaque(COLLECTION.find(p=>p.id===project.id).plaque,16.4,1.8);label.position.set(0,1.05,9);label.rotation.x=-.14;display.add(label);
      items.set(project.id,{display,pivot,assets:built.assets,effects,height:new T.Box3().setFromObject(built.root).max.y});
    }onState('ready');invalidate();
  }
  init().catch(()=>{if(!disposed)onState('error');});
  return {
    update(element,next){
      if(track!==element){if(track)observer.unobserve(track);track=element;if(track)observer.observe(track);}
      count=next.count;carousel.update(next);
      if(selection!==next.selected){selection=next.selected;exhibits.select(selection);}else exhibits.clearInterest();
      invalidate();
    },
    interest(id,source,on){exhibits.interest(id,source,on);invalidate();},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();scrollRoot.removeEventListener('scroll',invalidate);scrollRoot.removeEventListener('wheel',clearInterest);scrollRoot.removeEventListener('touchmove',clearInterest);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',clearInterest);window.removeEventListener('blur',clearInterest);renderer.domElement.removeEventListener('webglcontextlost',contextLost);for(const item of items.values()){item.assets.release();disposeScene(item.display);}for(const stage of stages){disposeScene(stage.scene);stage.ao.dispose();stage.output.dispose();stage.composer.dispose();}textures.forEach(t=>t.dispose());copyQuad.dispose();copyMaterial.dispose();environment.dispose();library.dispose();renderer.dispose();renderer.domElement.remove();},
  };
}
