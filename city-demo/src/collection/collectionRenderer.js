import * as T from 'three';
import {PROJECTS} from '../city/catalog.js';
import {createSceneKit} from '../city/sceneKit.js';
import {buildProjectBuilding} from '../city/buildings.js';
import {createAssetLibrary} from '../world/assets.js';
import {loadExteriorSurfaces} from '../city/surfaces.js';
import {disposeScene} from '../rendering.js';

// One WebGL context, shared building factories, visible viewports only, no idle animation loop.
export function createCollectionRenderer(host, scrollRoot, onState) {
  let renderer;
  try {renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
  catch {onState('error');return {dispose(){},update(){},rotate(){},drag(){}};}
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.autoClear=false;
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  const library=createAssetLibrary(),items=new Map(),allTextures=new Set();
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),corner=new T.Vector3();
  let disposed=false,frame=0,slots=[],lastTime=0,resize=true,heroId=null;
  function invalidate(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
  function contextLost(e){e.preventDefault();cancelAnimationFrame(frame);frame=0;onState('error');}
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function draw(time) {
    frame=0;if(disposed)return;
    const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
    const bounds=host.getBoundingClientRect(),width=bounds.width,height=bounds.height;
    if(resize){renderer.setSize(width,height,false);resize=false;}
    renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
    let moving=false;
    for(const slot of slots){
      const item=items.get(slot.id);if(!item||!slot.element?.isConnected)continue;
      const rect=slot.element.getBoundingClientRect();
      if(rect.bottom<=bounds.top||rect.top>=bounds.bottom||rect.width<1||rect.height<1)continue;
      const delta=item.target-item.pivot.rotation.y;
      if(Math.abs(delta)>.0005){item.pivot.rotation.y=motion.matches?item.target:item.pivot.rotation.y+delta*(1-Math.exp(-dt*13));moving=true;}
      else item.pivot.rotation.y=item.target;
      if(item.pivot.scale.x<.9995){item.pivot.scale.setScalar(motion.matches?1:item.pivot.scale.x+(1-item.pivot.scale.x)*(1-Math.exp(-dt*14)));moving=true;}
      else item.pivot.scale.setScalar(1);
      const hero=slot.hero;
      item.pedestal.visible=hero;item.tray.visible=!hero;
      item.building.position.y=hero?1.65:.38;
      const aspect=rect.width/rect.height;
      const viewHeight=Math.max(hero?17.7:16.7,(hero?25:23)/aspect);
      const camera=item.camera;
      const shelfOffset=hero?.2:1.6;
      camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2+shelfOffset;camera.bottom=-viewHeight/2+shelfOffset;
      camera.position.set(-17,20,55);camera.lookAt(0,hero?4.6:4.4,0);camera.updateProjectionMatrix();
      if(!hero){
        // Rest each base on the shelf despite differing building heights and viewport ratios.
        camera.updateMatrixWorld();item.pivot.updateMatrixWorld(true);
        let bottom=1;
        for(const x of [-9.75,9.75])for(const z of [-6.05,7.75])bottom=Math.min(bottom,corner.set(x,0,z).applyMatrix4(item.pivot.matrixWorld).project(camera).y);
        const shift=(bottom+.96)*viewHeight/2;camera.top+=shift;camera.bottom+=shift;camera.updateProjectionMatrix();
      }
      const x=rect.left-bounds.left,y=height-(rect.bottom-bounds.top);
      renderer.setViewport(x,y,rect.width,rect.height);
      renderer.setScissor(Math.max(x,0),Math.max(y,0),Math.min(rect.right,bounds.right)-Math.max(rect.left,bounds.left),Math.min(rect.bottom,bounds.bottom)-Math.max(rect.top,bounds.top));
      renderer.render(item.scene,camera);
    }
    if(moving)invalidate();
  }
  const observer=new ResizeObserver(()=>{resize=true;invalidate();});observer.observe(host);observer.observe(scrollRoot);
  scrollRoot.addEventListener('scroll',invalidate,{passive:true});
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else invalidate();};
  document.addEventListener('visibilitychange',visibility);
  motion.addEventListener('change',invalidate);

  async function init(){
    const ids=['plant_floor',...PROJECTS.map(p=>p.exteriorAsset).filter(Boolean)];
    const stonePromise=new T.TextureLoader().loadAsync('/collection/travertine.png').then(map=>{
      map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(3,1);allTextures.add(map);return map;
    });
    const results=await Promise.allSettled([loadExteriorSurfaces(),library.prepare(ids),stonePromise]);
    const albedos=results[0].status==='fulfilled'?results[0].value:{};
    Object.values(albedos).forEach(t=>allTextures.add(t));
    if(disposed){allTextures.forEach(t=>t.dispose());return;}
    if(results.some(r=>r.status==='rejected')||library.missing.size){onState('error');return;}
    const templates=await library.getTemplates(ids);
    if(disposed)return;
    for(const project of PROJECTS){
      const kit=createSceneKit(templates,albedos);
      buildProjectBuilding(kit,{...project,x:0,z:0,yaw:0});
      // A small piece of the city's pavement and its street lantern travel with each souvenir.
      kit.box(0,.03,.85,19,.24,13.2,'#c8bda2');
      kit.plane(0,.16,.85,18.8,13,kit.surface('paving',18.8,13,8,'#e9d4aa'));
      kit.lamp(-8.4,5.6,1.1);
      const built=kit.finish();built.textures.forEach(t=>allTextures.add(t));
      const scene=new T.Scene(),pivot=new T.Group();scene.add(pivot);pivot.add(built.root);
      const stone=new T.MeshStandardMaterial({color:'#e3cbb0',map:results[2].value,roughness:.62});
      const pedestal=new T.Mesh(new T.CylinderGeometry(11.4,11.5,1.65,96),stone);pedestal.position.set(0,.825,.85);pedestal.receiveShadow=true;pedestal.castShadow=true;pivot.add(pedestal);
      const tray=new T.Mesh(new T.BoxGeometry(19.5,.38,13.8),stone);tray.position.set(0,.19,.85);tray.receiveShadow=true;pivot.add(tray);
      scene.add(new T.HemisphereLight('#fff0d5','#625448',.95));
      const key=new T.DirectionalLight('#ffe2aa',3.4);key.position.set(-17,30,20);key.castShadow=true;
      key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:100});key.shadow.normalBias=.035;key.shadow.bias=-.0001;scene.add(key);
      const fill=new T.DirectionalLight('#c4d9ef',.65);fill.position.set(20,10,3);scene.add(fill);
      items.set(project.id,{scene,pivot,building:built.root,pedestal,tray,assets:built.assets,camera:new T.OrthographicCamera(-15,15,10,-10,.1,150),target:0});
    }
    onState('ready');invalidate();
  }
  init().catch(()=>{if(!disposed)onState('error');});
  return {
    update(next){const nextHero=next.find(s=>s.hero)?.id;if(heroId!==nextHero){heroId=nextHero;const item=items.get(heroId);if(item&&!motion.matches)item.pivot.scale.setScalar(.95);}slots=next;resize=true;invalidate();},
    rotate(id,amount=.65){const item=items.get(id);if(item){item.target+=amount;invalidate();}},
    drag(id,amount){const item=items.get(id);if(item){item.target+=amount;item.pivot.rotation.y=item.target;invalidate();}},
    dispose(){
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();scrollRoot.removeEventListener('scroll',invalidate);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',invalidate);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      for(const item of items.values()){item.assets.release();disposeScene(item.scene);}
      items.clear();allTextures.forEach(t=>t.dispose());library.dispose();renderer.dispose();renderer.domElement.remove();
    },
  };
}
