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
import {createSceneKit} from '../city/sceneKit.js';
import {createVegetation} from '../city/vegetation.js';
import {buildProjectBuilding} from '../city/buildings.js';
import {createAssetLibrary} from '../world/assets.js';
import {loadExteriorSurfaces} from '../city/surfaces.js';
import {disposeScene} from '../rendering.js';

// Shelves and souvenirs share cameras and shadow maps. DOM slots are hit areas,
// never separate pictures that need to be aligned with a CSS shelf.
export function createCollectionRenderer(host, scrollRoot, onState) {
  let renderer;
  try {renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
  catch {onState('error');return {dispose(){},update(){},rotate(){},drag(){}};}
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.autoClear=false;
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  const environmentScene=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);
  const environment=pmrem.fromScene(environmentScene,.04);environmentScene.dispose();pmrem.dispose();
  const copyMaterial=new T.ShaderMaterial({uniforms:T.UniformsUtils.clone(CopyShader.uniforms),vertexShader:CopyShader.vertexShader,fragmentShader:CopyShader.fragmentShader,depthTest:false,depthWrite:false,blending:T.NoBlending});
  const copyQuad=new FullScreenQuad(copyMaterial);
  // Mix complete rendered frames, including alpha, so opaque shelves do not
  // become translucent and shared GLB materials never need to be modified.
  const blendMaterial=new T.ShaderMaterial({
    uniforms:{before:{value:null},after:{value:null},progress:{value:0}},
    vertexShader:CopyShader.vertexShader,
    fragmentShader:'uniform sampler2D before; uniform sampler2D after; uniform float progress; varying vec2 vUv; void main(){gl_FragColor=mix(texture2D(before,vUv),texture2D(after,vUv),progress);}',
    depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false,
  });
  const blendQuad=new FullScreenQuad(blendMaterial);
  const library=createAssetLibrary(),items=new Map(),textures=new Set(),stages=[];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,frame=0,slots=[],lastTime=0,resize=true,wood,stone,heroId,transition=null;
  const transitionDuration=460;
  const ease=t=>t*t*(3-2*t);
  function clearTransition(){if(!transition)return;transition.before.dispose();transition.after.dispose();transition=null;blendMaterial.uniforms.before.value=null;blendMaterial.uniforms.after.value=null;}
  const loadTexture=async path=>{const map=await new T.TextureLoader().loadAsync(path);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;textures.add(map);return map;};
  function invalidate(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
  function contextLost(e){e.preventDefault();cancelAnimationFrame(frame);frame=0;clearTransition();onState('error');}
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function surfaceGeometry(geometry,metres=6){
    // World-scale UVs avoid stretching stone pores into horizontal wood grain.
    const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
    for(let i=0;i<p.count;i++){
      if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)/metres,p.getZ(i)/metres);
      else if(geometry.type==='CylinderGeometry')uv.setXY(i,Math.atan2(p.getX(i),p.getZ(i))*11.45/metres,p.getY(i)/metres);
      else if(Math.abs(n.getZ(i))>.5)uv.setXY(i,p.getX(i)/metres,p.getY(i)/metres);
      else uv.setXY(i,p.getZ(i)/metres,p.getY(i)/metres);
    }return geometry;
  }
  function mesh(geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;}
  function plaque(text,width,height){
    const group=new T.Group(),brass=new T.MeshStandardMaterial({color:'#d3af6d',metalness:.5,roughness:.27});
    group.add(mesh(new RoundedBoxGeometry(width+.12,height+.1,.07,3,.04),new T.MeshStandardMaterial({color:'#4b351e',roughness:.55}),0,0,-.025));
    group.add(mesh(new RoundedBoxGeometry(width,height,.095,3,.045),brass));
    const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=Math.round(1536*height/width);
    const c=canvas.getContext('2d');c.fillStyle='#171710';c.textAlign='center';c.textBaseline='middle';c.font=`600 ${canvas.height*.49}px Arial`;c.fillText(text,768,canvas.height*.52,1370);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;textures.add(map);
    const face=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,transparent:true,toneMapped:false}));face.position.z=.053;group.add(face);
    for(const x of [-width/2+.16,width/2-.16])group.add(mesh(new T.SphereGeometry(.052,8,6),brass,x,0,.065));
    return group;
  }
  function createStage(){
    const scene=new T.Scene(),furniture=new T.Group();scene.add(furniture);scene.environment=environment.texture;scene.environmentIntensity=.035;
    scene.add(new T.HemisphereLight('#fff6e6','#433a2d',.85));
    const key=new T.DirectionalLight('#fff0da',3.15);key.position.set(-16,28,18);key.castShadow=true;
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
  function buildFurniture(stage,width,hero,entries){
    const signature=JSON.stringify([width.toFixed(3),hero,entries.map(e=>[e.id,e.x.toFixed(3)])]);
    if(stage.signature===signature)return;stage.signature=signature;
    stage.furniture.traverse(o=>{const map=o.material?.map;if(map?.isCanvasTexture){map.dispose();textures.delete(map);}});
    disposeScene(stage.furniture);stage.furniture.clear();
    const woodMat=new T.MeshStandardMaterial({map:wood,color:'#ffffff',roughness:.43,bumpMap:wood,bumpScale:.045});
    const depth=hero?11:27,front=hero?13:24,thick=hero?1.4:4;
    const slab=new RoundedBoxGeometry(width,thick,depth,3,.09),positions=slab.attributes.position;
    // A gently receding side edge matches the shallow perspective of the shelf.
    for(let i=0;i<positions.count;i++)if(positions.getX(i)>0)positions.setX(i,positions.getX(i)-(depth/2-positions.getZ(i))/depth*(hero?.7:1.8));
    slab.computeVertexNormals();
    stage.furniture.add(mesh(surfaceGeometry(slab,12),woodMat,hero?-.9:0,-thick/2,front-depth/2));
    stage.furniture.add(mesh(surfaceGeometry(new RoundedBoxGeometry(width,.12,.17,3,.05),12),woodMat,hero?-.9:0,-.06,front+.025));
    if(hero){
      const stoneMat=new T.MeshPhysicalMaterial({map:stone,bumpMap:stone,bumpScale:.11,color:'#fff4df',roughness:.4,clearcoat:.22,clearcoatRoughness:.3});
      stage.furniture.add(mesh(surfaceGeometry(new T.CylinderGeometry(11.7,11.74,2.25,128),8),stoneMat,0,1.125,.85));
      const label=plaque(entries[0].label.toUpperCase(),8.3,1.05);label.position.set(2.05,.98,12.7);stage.furniture.add(label);
    }else for(const e of entries){const label=plaque(e.label,Math.min(15.5,e.cell*.72),2.05);label.position.set(e.x,1.02,front-5);label.rotation.x=-.1;stage.furniture.add(label);}
    const lightSpan=Math.max(17,width/2+3);Object.assign(stage.key.shadow.camera,{left:-lightSpan,right:lightSpan});stage.key.shadow.camera.updateProjectionMatrix();
  }
  function renderStage(stage,rect,entries,hero,bounds,progress=1){
    if(rect.bottom<=bounds.top||rect.top>=bounds.bottom||rect.width<1)return;
    const cellPx=hero?rect.width:Math.min(...entries.map(e=>e.rect.width));
    const angle=T.MathUtils.degToRad(hero?12:13);
    const modelHeight=hero?items.get(entries[0].id)?.height||10:0;
    const unit=hero?Math.min(rect.width/27,(rect.height-24)*.9/((modelHeight+2.34)*Math.cos(angle)+3.2)):cellPx/25;
    const width=rect.width/unit,height=rect.height/unit;
    for(const e of entries){e.x=hero?0:((e.rect.left+e.rect.width/2)-(rect.left+rect.width/2))/unit;e.cell=e.rect.width/unit;e.label=COLLECTION.find(p=>p.id===e.id).plaque;}
    buildFurniture(stage,width,hero,entries);
    for(const e of entries){const item=items.get(e.id);if(!item)continue;stage.scene.add(item.pivot);item.pivot.position.set(e.x,hero?2.34:.47,.85);item.tray.visible=!hero;}
    const camera=stage.camera;camera.position.set(0,50*Math.sin(angle),50*Math.cos(angle));camera.lookAt(0,0,0);
    const front=hero?13:24,edge=hero?.9:1-rect.slotHeight*.24/rect.height;
    camera.left=-width/2-(hero?.9:0);camera.right=width/2-(hero?.9:0);camera.top=height*edge-front*Math.sin(angle);camera.bottom=camera.top-height;
    camera.zoom=hero?1-.018*(1-ease(progress)):1;camera.updateProjectionMatrix();
    const x=rect.left-bounds.left,y=bounds.height-(rect.bottom-bounds.top);
    if(bounds.width>800){
      const size=Math.round(rect.width)+'/'+Math.round(rect.height);
      if(stage.size!==size){stage.size=size;stage.composer.setSize(Math.round(rect.width),Math.round(rect.height));stage.ao.setSize(Math.round(rect.width*.75),Math.round(rect.height*.75));}
      renderer.setScissorTest(false);stage.composer.render();renderer.setRenderTarget(null);renderer.setScissorTest(true);
    }
    renderer.setViewport(x,y,rect.width,rect.height);renderer.setScissor(Math.max(x,0),Math.max(y,0),Math.min(rect.right,bounds.right)-Math.max(rect.left,bounds.left),Math.min(rect.bottom,bounds.bottom)-Math.max(rect.top,bounds.top));
    if(bounds.width>800){copyMaterial.uniforms.tDiffuse.value=stage.composer.readBuffer.texture;copyQuad.render(renderer);}else renderer.render(stage.scene,camera);
    for(const e of entries)items.get(e.id)?.pivot.removeFromParent();
  }
  function draw(time){
    frame=0;if(disposed||!wood)return;
    const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
    const bounds=host.getBoundingClientRect();if(resize){renderer.setSize(bounds.width,bounds.height,false);resize=false;}
    const progress=transition?.start!=null?Math.min(1,Math.max(0,(time-transition.start)/transitionDuration)):1;
    renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);let moving=false;
    for(const item of items.values()){const delta=item.target-item.pivot.rotation.y;if(Math.abs(delta)>.0005){item.pivot.rotation.y=motion.matches?item.target:item.pivot.rotation.y+delta*(1-Math.exp(-dt*13));moving=true;}else item.pivot.rotation.y=item.target;}
    const visible=slots.filter(s=>s.element?.isConnected).map(s=>({...s,rect:s.element.getBoundingClientRect()}));
    const hero=visible.find(s=>s.hero);let index=0;
    if(hero){renderStage(stages[index]||createStage(),hero.rect,[hero],true,bounds,progress);index++;}
    const rows=[];
    for(const slot of visible.filter(s=>!s.hero)){let row=rows.find(r=>Math.abs(r[0].rect.top-slot.rect.top)<5);if(!row)rows.push(row=[]);row.push(slot);}
    for(const row of rows){const parent=row[0].element.closest('.collection-miniatures').getBoundingClientRect(),top=Math.min(...row.map(e=>e.rect.top)),bottom=Math.max(...row.map(e=>e.rect.bottom));const rect={left:parent.left,right:parent.right,top:top-28,bottom,width:parent.width,height:bottom-top+28,slotHeight:bottom-top};renderStage(stages[index]||createStage(),rect,row,false,bounds);index++;}
    if(transition?.start!=null){
      if(progress<1&&!motion.matches){
        renderer.copyFramebufferToTexture(transition.after);
        renderer.setScissorTest(false);renderer.setViewport(0,0,bounds.width,bounds.height);
        blendMaterial.uniforms.before.value=transition.before;blendMaterial.uniforms.after.value=transition.after;blendMaterial.uniforms.progress.value=ease(progress);
        blendQuad.render(renderer);moving=true;
      }else clearTransition();
    }
    if(moving)invalidate();
  }
  const observer=new ResizeObserver(entries=>{if(entries.some(e=>e.target===host)){clearTransition();resize=true;}invalidate();});observer.observe(host);observer.observe(scrollRoot);
  scrollRoot.addEventListener('scroll',invalidate,{passive:true});
  const stopTransition=()=>{clearTransition();invalidate();};
  scrollRoot.addEventListener('wheel',stopTransition,{passive:true});scrollRoot.addEventListener('touchmove',stopTransition,{passive:true});
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;clearTransition();}else invalidate();};document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',stopTransition);
  async function init(){
    const ids=['plant_floor',...PROJECTS.map(p=>p.exteriorAsset).filter(Boolean)];
    const results=await Promise.allSettled([loadExteriorSurfaces(),library.prepare(ids),loadTexture('/collection/travertine.png'),loadTexture('/collection/walnut.png')]);
    const albedos=results[0].status==='fulfilled'?results[0].value:{};Object.values(albedos).forEach(t=>textures.add(t));
    if(disposed){textures.forEach(t=>t.dispose());return;}if(results.some(r=>r.status==='rejected')||library.missing.size){onState('error');return;}
    stone=results[2].value;wood=results[3].value;const templates=await library.getTemplates(ids);if(disposed)return;
    for(const project of PROJECTS){
      const kit=createSceneKit(templates,albedos);buildProjectBuilding(kit,{...project,x:0,z:0,yaw:0,galleryDisplay:true});
      kit.box(0,.03,.85,19,.24,13.2,'#b5aa94');kit.plane(0,.16,.85,18.8,13,kit.surface('paving',18.8,13,5,'#e3d4b9'));kit.lamp(-8.4,5.6,1.3);
      const vegetation=createVegetation((x,y,z,w,h,d,col,...rest)=>kit.box(x,y,z,w*(col.startsWith('#')&&h<.8?.66:1),h,d*(col.startsWith('#')&&h<.8?.66:1),col,...rest),{detail:'original'});
      if(project.id==='pharmacy'){
        vegetation.tree(8,-1.2,1.6,57,{planter:false});
        for(const x of [-7.5,7.3]){kit.box(x,.48,5.5,1.15,.95,1.15,'#b09868');vegetation.tree(x,5.5,.58,x+20,{planter:false,base:.8});}
        kit.sign('ЗДОРОВЬЕ',8,1.85,7.5,2.35,2.9,{bg:'#283c37',fg:'#f0ecd9',sub:'БЛИЖЕ К ВАМ',border:'#a48150'});
        for(const x of [6.75,9.25])kit.box(x,1.65,7.4,.12,3.3,.18,'#a7814d');kit.box(8,.24,7.5,2.65,.18,.4,'#8d6c42');
      }
      const built=kit.finish();built.textures.forEach(t=>textures.add(t));
      const pivot=new T.Group();pivot.rotation.y=.19;built.root.position.z=-.85;pivot.add(built.root);
      const mat=new T.MeshStandardMaterial({map:stone,bumpMap:stone,bumpScale:.035,color:'#e7dcc6',roughness:.55});
      const tray=mesh(surfaceGeometry(new RoundedBoxGeometry(19.5,.38,13.8,2,.06),5),mat,0,-.28,0);pivot.add(tray);
      items.set(project.id,{pivot,tray,assets:built.assets,target:.19,height:new T.Box3().setFromObject(built.root).max.y});
    }onState('ready');invalidate();
  }
  init().catch(()=>{if(!disposed)onState('error');});
  return {
    prepareTransition(){
      if(disposed||!wood||motion.matches||document.hidden)return;
      // Capture the currently blended frame on rapid clicks, before React swaps
      // the DOM slots. No second WebGL context or persistent render loop is used.
      cancelAnimationFrame(frame);frame=0;draw(performance.now());
      const {width,height}=renderer.domElement;
      const before=new T.FramebufferTexture(width,height);renderer.copyFramebufferToTexture(before);
      clearTransition();transition={before,after:new T.FramebufferTexture(width,height),start:null};
    },
    update(next){const nextHero=next.find(s=>s.hero)?.id;if(nextHero!==heroId){heroId=nextHero;for(const item of items.values()){item.target=.19;item.pivot.rotation.y=.19;}}slots=next;if(transition?.start===null)transition.start=performance.now();invalidate();},
    rotate(id,amount=.65){const item=items.get(id);if(item){item.target+=amount;invalidate();}},
    drag(id,amount){const item=items.get(id);if(item){item.target+=amount;item.pivot.rotation.y=item.target;invalidate();}},
    dispose(){disposed=true;cancelAnimationFrame(frame);clearTransition();observer.disconnect();scrollRoot.removeEventListener('scroll',invalidate);scrollRoot.removeEventListener('wheel',stopTransition);scrollRoot.removeEventListener('touchmove',stopTransition);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',stopTransition);renderer.domElement.removeEventListener('webglcontextlost',contextLost);for(const item of items.values()){item.assets.release();disposeScene(item.pivot);}for(const stage of stages){disposeScene(stage.scene);stage.ao.dispose();stage.output.dispose();stage.composer.dispose();}textures.forEach(t=>t.dispose());copyQuad.dispose();copyMaterial.dispose();blendQuad.dispose();blendMaterial.dispose();environment.dispose();library.dispose();renderer.dispose();renderer.domElement.remove();},
  };
}
