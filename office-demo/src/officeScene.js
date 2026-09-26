import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { people, departments } from './data';
import {createNavigation,createKeyboardInput,movementDirection} from './movement';
import {mergeCharacter,disposeScene} from './rendering';

// Everything in the room is world-space geometry. UI labels are projected from
// the same camera; picking and walking therefore continue to work when zooming.
export function createOffice(container, callbacks) {
  let disposed = false, seed = 19;
  let frame=0,last=performance.now(),renderDirty=true,labelsDirty=true,keyboardEnabled=true;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const scene = new T.Scene(); scene.background = new T.Color('#b9c9ca');
  const camera = new T.OrthographicCamera(-14,14,10,-10,.1,160);
  const renderer = new T.WebGLRenderer({antialias:false, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.3));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  renderer.domElement.setAttribute('aria-label','Трёхмерный офис. Перемещение: WASD или стрелки. Shift — быстрее. Можно нажать на свободный пол.');
  renderer.domElement.tabIndex=0;
  renderer.domElement.dataset.testid = 'office-canvas';
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=.12; controls.enableRotate=false;
  controls.screenSpacePanning=false; controls.minZoom=.65; controls.maxZoom=2.1;
  controls.mouseButtons = {LEFT:T.MOUSE.PAN,MIDDLE:T.MOUSE.DOLLY,RIGHT:T.MOUSE.ROTATE};
  controls.touches = {ONE:T.TOUCH.PAN,TWO:T.TOUCH.DOLLY_PAN};
  const materials = new Map(), batches = new Map(), objects = [], obstacles = [], textures = [];
  const baseGeo = new T.BoxGeometry(1,1,1);
  const dummy = new T.Object3D();
  function material(color, opts={}) {
    const key=color+JSON.stringify(opts);
    if(!materials.has(key)) materials.set(key,new T.MeshStandardMaterial({color,roughness:.88,...opts}));
    return materials.get(key);
  }
  function cube(x,y,z,w,h,d,color,rot=0,parent=null,opts={}) {
    const mat=material(color,opts);
    if(parent){const m=new T.Mesh(baseGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    if(!batches.has(mat))batches.set(mat,[]);
    dummy.position.set(x,y,z);dummy.rotation.set(0,rot,0);dummy.scale.set(w,h,d);dummy.updateMatrix();batches.get(mat).push(dummy.matrix.clone());
  }
  function block(x,z,w,d){obstacles.push({x,z,w,d});}
  function post(x,z,h=1.8){cube(x,h/2,z,.11,h,.11,'#405363');cube(x,h+.02,z,.16,.08,.16,'#a8b5b5');}
  function wall(x,z,w,d,h=1.7){cube(x,h/2,z,w,h,d,'#70878d');cube(x,h+.03,z,w+.05,.09,d+.05,'#a1b1b1');cube(x,.13,z,w+.03,.26,d+.03,'#354a5c');block(x,z,w,d);}
  function glassWall(x,z,w,d,h=1.7){
    const mesh = new T.Mesh(new T.BoxGeometry(w,h,d),material('#b9e0df',{transparent:true,opacity:.12,depthWrite:false,roughness:.25}));
    mesh.position.set(x,h/2,z);scene.add(mesh);objects.push(mesh);
    cube(x,.1,z,w,.13,d,'#485f70');cube(x,h,z,w,.065,d,'#b9c8c5');
    const n=Math.ceil(Math.max(w,d)/1.65);
    for(let i=0;i<=n;i++)post(w>d?x-w/2+w*i/n:x,w>d?z:z-d/2+d*i/n,h);
    block(x,z,w,d);
  }
  const loader=new T.TextureLoader();
  function texture(url){const t=loader.load(url,()=>invalidate());t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;textures.push(t);return t;}
  const floorTex=texture('/assets/carpet.webp');floorTex.wrapS=floorTex.wrapT=T.RepeatWrapping;floorTex.repeat.set(8,7);
  const floor=new T.Mesh(new T.BoxGeometry(24,.22,20),new T.MeshStandardMaterial({map:floorTex,color:'#bbc6cc',roughness:1}));floor.position.y=-.15;floor.receiveShadow=true;scene.add(floor);
  cube(0,-.34,0,24.25,.25,20.25,'#4e606e');
  const ground=new T.Mesh(new T.PlaneGeometry(160,160),material('#c5d1cf'));ground.rotation.x=-Math.PI/2;ground.position.y=-.49;ground.receiveShadow=true;scene.add(ground);
  for(let x=-12;x<=12;x+=2)cube(x,.001,0,.018,.008,20,'#758892');
  for(let z=-10;z<=10;z+=2)cube(0,.001,z,24,.008,.018,'#758892');

  // Perimeter glazing and a luminous planted strip outside the windows.
  wall(0,-9.8,24,.3,.65);
  for(let x=-11.9;x<=12;x+=2){post(x,-9.8,3.8);cube(x+1,2.65,-9.8,1.9,.055,.09,'#697e88');cube(x+1,.72,-9.8,1.9,.13,.48,'#c2c6b8');}
  cube(0,3.8,-9.8,24,.18,.23,'#455b68');
  for(const s of [-1,1]){
    wall(s*11.85,0,.3,20,1.05);
    for(let z=-9.8;z<=9.8;z+=2){post(s*11.85,z,2.65);cube(s*11.85,2.65,z+1,.18,.11,1.9,'#667b87');}
  }
  glassWall(-7.1,9.7,9.3,.12,.95);glassWall(7.1,9.7,9.3,.12,.95);
  // Wide circulation openings connect all departments to the central atrium.
  wall(-7.9,-7.9,7.2,.2,1.7);wall(7.9,-7.9,7.2,.2,1.7);
  wall(-7.9,1.1,7.2,.2,1.55);wall(7.9,1.1,7.2,.2,1.55);
  for(const s of [-1,1]){
    glassWall(s*4,-5.7,.13,4.5,1.8);wall(s*4,2.6,.18,3,1.3);glassWall(s*4,7.6,.13,3.7,1.3);
    cube(s*4.04,.6,5.25,.19,1.2,.8,'#9a7150');
  }
  glassWall(-2.5,-4.5,2.8,.12,1.8);glassWall(2.5,-4.5,2.8,.12,1.8);glassWall(-3.9,-6.8,.12,4.7,2);glassWall(3.9,-6.8,.12,4.7,2);

  function plant(x,z,size=1,base=0,pot='#947354'){
    cube(x,base+.23*size,z,.47*size,.46*size,.47*size,pot);
    cube(x,base+.46*size,z,.51*size,.08*size,.51*size,'#b49671');
    cube(x,base+.5*size,z,.4*size,.025,.4*size,'#514832');
    cube(x,base+.85*size,z,.085*size,.7*size,.085*size,'#695338');
    const greens=['#546c27','#648439','#809847','#a1aa4e','#3e653c'];
    for(let i=0;i<28;i++){
      let angle=i*2.399,rad=(.12+random()*.25)*size;
      cube(x+Math.cos(angle)*rad,base+(.74+random()*.66)*size,z+Math.sin(angle)*rad,(.10+random()*.17)*size,.1*size,.16*size,greens[i%greens.length],angle);
    }
  }
  function cup(x,y,z){cube(x,y+.09,z,.14,.18,.14,'#eee6cd');cube(x,y+.186,z,.1,.008,.1,'#493b2d');cube(x+.1,y+.1,z,.065,.1,.065,'#eee6cd');}
  function monitor(x,y,z){
    cube(x,y+.05,z,.46,.06,.3,'#36434f');cube(x,y+.27,z,.09,.42,.1,'#4a5964');
    cube(x,y+.65,z,1.08,.65,.09,'#263544');cube(x,y+.65,z+.052,.95,.52,.018,'#1d3c56',0,null,{emissive:'#173552',emissiveIntensity:.4});
    for(let i=0;i<7;i++)cube(x-.32+((i%3)*.035),y+.82-i*.045,z+.065,.18+random()*.4,.012,.003,['#55aaa2','#8caec7','#c1aa74'][i%3]);
    cube(x,y+.025,z+.54,.64,.045,.25,'#4d5862');
    for(let i=0;i<7;i++)for(let j=0;j<3;j++)cube(x-.26+i*.08,y+.055,z+.46+j*.07,.045,.012,.035,'#a5b3b5');
    cube(x+.55,y+.035,z+.53,.12,.065,.2,'#343e49');
  }
  function desk(x,z,w=2.4){
    cube(x,.89,z,w,.15,1.3,'#b38250');cube(x,.983,z,w-.07,.04,1.24,'#ce9c60');
    for(const s of [-1,1]){cube(x+s*(w/2-.23),.41,z,.36,.82,1.05,'#715843');cube(x+s*(w/2-.23),.45,z+.54,.32,.65,.03,'#8f6946');
      for(let j=0;j<3;j++){cube(x+s*(w/2-.23),.25+j*.22,z+.56,.3,.016,.008,'#584b3d');cube(x+s*(w/2-.23),.33+j*.22,z+.59,.1,.025,.035,'#c0b8a2');}}
    monitor(x,1.01,z-.21);cup(x-w/2+.24,1.015,z+.29);plant(x+w/2-.25,z-.22,.38,1.015);
    cube(x-w/2+.33,1.03,z-.25,.32,.04,.41,'#d8dbc6');
    block(x,z,w,1.3);
  }
  function chair(x,z,angle=0,color='#384b62'){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);
    cube(0,.19,0,.07,.34,.07,'#3d414a',0,g);
    for(let i=0;i<5;i++){let a=i*Math.PI*2/5;cube(Math.sin(a)*.2,.1,Math.cos(a)*.2,.05,.04,.43,'#404b54',a,g);cube(Math.sin(a)*.37,.075,Math.cos(a)*.37,.11,.13,.1,'#263340',0,g);}
    cube(0,.49,0,.65,.15,.65,color,0,g);cube(0,.91,.27,.63,.78,.13,color,0,g);cube(0,.91,.35,.42,.56,.035,'#546476',0,g);
    for(const s of [-1,1]){cube(s*.37,.69,.03,.065,.3,.08,'#34444e',0,g);cube(s*.37,.83,0,.11,.08,.46,color,0,g);}
    return g;
  }
  function shelf(x,z,w=1.15){
    cube(x,.8,z,w,1.6,.45,'#8f6a48');cube(x,.83,z+.24,w-.12,1.42,.02,'#3c4c50');
    for(const s of [-1,1])cube(x+s*(w/2-.05),.85,z+.2,.1,1.55,.18,'#a17b54');
    for(let r=0;r<3;r++){
      cube(x,.18+r*.47,z+.16,w,.08,.5,'#b78e5c');
      for(let i=0;i<7;i++){let h=.23+random()*.13;cube(x-w/2+.13+i*(w-.23)/7,.23+r*.47+h/2,z+.31,.065+random()*.025,h,.22,['#355d73','#77969b','#a58358','#4d6e7c','#cec2a0'][i%5]);}
    }
    plant(x,z,.62,1.61);block(x,z,w,.5);
  }
  const boardTex=texture('/assets/whiteboard.webp');
  function board(x,z){
    cube(x,1.27,z,1.65,1.14,.1,'#c7c2ad');
    const b=new T.Mesh(new T.PlaneGeometry(1.51,1),new T.MeshStandardMaterial({map:boardTex,roughness:1}));b.position.set(x,1.28,z+.058);scene.add(b);objects.push(b);
    for(const s of [-1,1]){cube(x+s*.63,.55,z,.07,1.1,.07,'#9ca6a4');cube(x+s*.63,.06,z+.08,.13,.09,.5,'#455462');}
  }
  function sofa(x,z,w,angle=0){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);
    cube(0,.23,0,w,.32,.83,'#4d625b',0,g);cube(0,.7,-.35,w,.68,.22,'#70816b',0,g);
    for(let i=0;i<3;i++){cube(-w/3+i*w/3,.48,.03,w/3-.05,.2,.62,['#84947c','#768976','#7c907a'][i],0,g);cube(-w/3+i*w/3,.79,-.28,w/3-.05,.45,.2,['#8e9a7b','#7c8a70','#899579'][i],0,g);}
    for(const s of [-1,1])cube(s*(w/2-.07),.57,0,.18,.55,.93,'#5b7367',0,g);
    const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));block(x,z,w*c+s,w*s+c);
  }
  function coffee(x,z,r=.6){const m=new T.Mesh(new T.CylinderGeometry(r,r,.12,12),material('#b98c54'));m.position.set(x,.57,z);m.castShadow=true;scene.add(m);objects.push(m);cube(x,.27,z,.14,.53,.14,'#5a5045');plant(x,z,.39,.64);block(x,z,r*2,r*2);}
  function cabinet(x,z){cube(x,.51,z,.8,1,.65,'#9d7750');for(let i=0;i<3;i++){cube(x,.2+i*.3,z+.34,.7,.25,.04,'#aa835b');cube(x,.26+i*.3,z+.38,.16,.035,.04,'#c5c2aa');}plant(x,z,.62,1.02);block(x,z,.8,.65);}
  function printer(x,z){cube(x,.52,z,.75,1.02,.76,'#667887');cube(x,.73,z+.39,.63,.34,.04,'#8294a1');cube(x,1.1,z,.8,.2,.77,'#c3c6bc');cube(x,1.23,z-.08,.63,.1,.48,'#647981');cube(x,1.29,z-.08,.49,.025,.33,'#e5e4d5');cube(x,.89,z+.43,.46,.035,.16,'#354551');cube(x-.2,1.21,z+.3,.12,.026,.1,'#72b9bc');for(let i=0;i<3;i++)cube(x,.23+i*.15,z+.398,.58,.012,.025,'#a0abb0');block(x,z,.8,.8);}
  for(const s of [-1,1])for(const z of [-5,0,5,8]){cube(s*11.65,1.2,z,.15,.6,.23,'#b59156');cube(s*11.55,1.21,z,.03,.42,.19,'#ffe0a0',0,null,{emissive:'#ffcb77',emissiveIntensity:1.3});}

  desk(-9.3,-4.9);desk(-6.6,-4.9);desk(-7.3,-2.1);
  chair(-9.3,-3.8);chair(-6.6,-3.8);chair(-7.3,-1);chair(-5.3,-4.7,-Math.PI/2);
  desk(7.9,-4.5,2.8);chair(7.9,-3.4);chair(9.9,-4,-Math.PI/2);
  desk(7.3,4.9,3.3);chair(7.3,6.1);chair(6.5,3.7,Math.PI);
  for(const x of [-10.8,-5.1,5.1,10.8])shelf(x,-7.35);
  for(const x of [-10.7,-5.2,5.1,10.7])shelf(x,1.65);
  for(const x of [-7.8,7.9])board(x,-7.4);
  board(-7.8,1.65);board(8,1.65);
  for(const p of [[-10.9,-1.4],[-5,7.9],[10.8,7.8],[-10.8,8.5],[5.2,8.5]])cabinet(...p);
  printer(-9.6,2);printer(10.55,5.5);printer(-10.5,-6.5);
  for(const [x,z] of [[-11,3.2],[10.8,2.8],[-5.3,-6.7],[5.2,-6.6]])plant(x,z,1.2);
  sofa(-8.3,3.7,2.8);sofa(-8.3,7.2,2.8,Math.PI);coffee(-8.3,5.5,.78);
  coffee(8,-1.3,.85);chair(6.75,-1.3,Math.PI/2,'#697b63');chair(9.25,-1.3,-Math.PI/2,'#697b63');
  cube(0,.83,-6.35,4.4,.19,1.9,'#ba8a52');cube(0,.94,-6.35,4.3,.025,1.8,'#d4a966');
  for(const s of [-1,1]){cube(s*1.7,.4,-6.35,.19,.8,1.3,'#736143');for(let i=-1;i<=1;i++)chair(i*1.45,-6.35+s*1.4,s<0?Math.PI:0,'#6b7f64');}
  block(0,-6.35,4.4,1.9);plant(.6,-6.3,.5,.97);cup(-1.3,.97,-6.1);cube(-.7,1.05,-6.15,.68,.11,.5,'#526575');cube(-.7,1.29,-6.39,.68,.43,.06,'#2e4555');
  // Atrium: planted tree and three lounge benches.
  cube(0,.25,1,2.9,.5,2.9,'#adac96');cube(0,.51,1,2.6,.03,2.6,'#46543a');block(0,1,3,3);
  for(let i=0;i<38;i++){const x=(random()-.5)*2.5,z=1+(random()-.5)*2.5;cube(x,.6+random()*.12,z,.25,.2,.25,['#809944','#a4a653','#567740'][i%3]);}
  cube(0,1.55,1,.32,2.4,.35,'#735635');
  for(let i=0;i<7;i++){const a=i*2.4;const g=new T.Mesh(new T.BoxGeometry(.16,1.35,.16),material('#795b37'));g.position.set(Math.sin(a)*.35,2,1+Math.cos(a)*.35);g.rotation.z=Math.sin(a)*.56;g.rotation.x=Math.cos(a)*.5;g.castShadow=true;scene.add(g);objects.push(g);}
  for(let i=0;i<650;i++){let x=(random()-.5)*3.9,z=(random()-.5)*3.3,y=(random()-.5)*1.85;if(x*x/3.8+z*z/2.8+y*y/1.35>1)continue;let s=.14+random()*.18;cube(x,3.1+y,1+z,s,s*.65,s,['#527535','#648239','#7c9340','#a3a34b','#3f6431'][i%5],0);}
  sofa(0,3.1,3.25,Math.PI);sofa(-2.05,1.05,2.45,Math.PI/2);sofa(2.05,1.05,2.45,-Math.PI/2);
  for(const p of [[-2.8,-.6],[2.8,-.6],[-2.8,3],[2.8,3],[-3,7.9],[3,7.9],[-10.8,6.6],[10.8,-1.6]])plant(p[0],p[1],1);
  for(let x=-11;x<=11;x+=2.4)plant(x,-8.9,.9);
  for(let x=-14;x<15;x+=1.7)plant(x,-11.5,1.45,0,'#bac5b6');
  for(let i=0;i<18;i++){let x=-23+i*2.8,h=1+random()*6;cube(x,h/2,-19-random()*6,2,h,2,'#a4bdc4');for(let y=1;y<h;y+=.6)cube(x,y,-17.94,.7,.2,.02,'#d4e0de');}
  // A low entrance gate preserves the overview from the fixed high camera.
  glassWall(-2.1,7.8,1.3,.12,1.25);glassWall(2.1,7.8,1.3,.12,1.25);
  for(const s of [-1,1])for(let j=0;j<5;j++)cube(s*(2.9+j*.18),.75,7.8,.08,1.5,.14,'#9a754a');

  const actors=new Map(), targets=[];
  function actor(person){
    const g=new T.Group();g.position.set(person.x,0,person.z);g.rotation.y=person.angle||0;scene.add(g);
    const skin=person.skin,hair=person.hair,shirt=person.color;
    const l=new T.Group(),r=new T.Group();l.position.set(-.14,.4,0);r.position.set(.14,.4,0);g.add(l,r);
    for(const limb of [l,r]){cube(0,-.16,0,.19,.42,.23,'#354759',0,limb);cube(0,-.34,.055,.21,.12,.34,'#29333e',0,limb);}
    cube(0,.7,0,.49,.49,.31,shirt,0,g);cube(0,.91,0,.2,.14,.19,skin,0,g);
    for(const s of [-1,1]){cube(s*.33,.69,0,.19,.35,.23,shirt,0,g);cube(s*.33,.48,.015,.17,.17,.19,skin,0,g);}
    cube(0,1.18,0,.6,.53,.53,skin,0,g);cube(0,1.47,-.035,.65,.18,.59,hair,0,g);cube(0,1.25,-.26,.62,.43,.13,hair,0,g);
    for(let i=0;i<5;i++)cube(-.27+i*.13,1.38+random()*.07,.235,.14,.16,.11,hair,0,g);
    cube(-.29,1.29,-.035,.08,.23,.42,hair,0,g);cube(.29,1.29,-.035,.08,.23,.42,hair,0,g);
    for(const s of [-1,1]){cube(s*.13,1.2,.277,.073,.084,.025,'#282d32',0,g);cube(s*.14,1.221,.293,.018,.025,.01,'#fcf0d1',0,g);cube(s*.18,1.08,.273,.08,.055,.014,'#be8064',0,g);}
    cube(0,1.12,.29,.075,.08,.065,skin,0,g);cube(0,1.02,.272,.13,.025,.018,'#926450',0,g);
    cube(.07,.72,.17,.09,.1,.016,'#d1c8a9',0,g);
    const hit=new T.Mesh(new T.BoxGeometry(.86,1.65,.86),new T.MeshBasicMaterial({visible:false}));hit.position.y=.85;hit.userData.personId=person.id;g.add(hit);targets.push(hit);
    actors.set(person.id,{group:g,l,r});
  }
  people.forEach(actor);
  const characterMaterial=material('#ffffff',{vertexColors:true});
  actors.forEach((actor,id)=>{
    if(id==='alexey'){mergeCharacter(actor.group,characterMaterial,false);mergeCharacter(actor.l,characterMaterial);mergeCharacter(actor.r,characterMaterial);}
    else mergeCharacter(actor.group,characterMaterial);
  });
  const me=actors.get('alexey'), markerMat=new T.MeshBasicMaterial({color:'#86e9c9',side:T.DoubleSide,transparent:true,opacity:.95});
  const ring=new T.Mesh(new T.RingGeometry(.58,.64,48),markerMat);ring.rotation.x=-Math.PI/2;ring.position.y=.027;scene.add(ring);
  const destination=new T.Mesh(new T.RingGeometry(.15,.21,32),markerMat.clone());destination.rotation.x=-Math.PI/2;destination.visible=false;scene.add(destination);
  // Collapse static furniture into instanced batches while retaining true depth/shadows.
  for(const [mat,matrices] of batches){const inst=new T.InstancedMesh(baseGeo,mat,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}
  batches.clear();
  // Merge small static chair/sofa meshes by material to keep draw calls bounded.
  const mergeGroups=new Map(),actorGroups=new Set([...actors.values()].map(a=>a.group));
  scene.updateMatrixWorld(true);
  for(const child of [...scene.children])if(child.isGroup && !actorGroups.has(child)){
    child.traverse(m=>{if(m.isMesh){if(!mergeGroups.has(m.material))mergeGroups.set(m.material,[]);mergeGroups.get(m.material).push(m.geometry.clone().applyMatrix4(m.matrixWorld));}});scene.remove(child);
  }
  for(const [mat,geos] of mergeGroups){const geo=mergeGeometries(geos);const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);geos.forEach(g=>g.dispose());}
  const sun=new T.DirectionalLight('#fff1c9',2.5);sun.position.set(-9,18,-10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-19,right:19,top:20,bottom:-18,near:.5,far:60});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
  scene.add(new T.HemisphereLight('#d6eaf6','#808770',1.8));
  const fill=new T.DirectionalLight('#c6dfec',.8);fill.position.set(9,10,12);scene.add(fill);

  // Static object matrices and shadows are reused until something moves.
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(o.isMesh&&o!==ring&&o!==destination)o.matrixAutoUpdate=false;});
  const navigation=createNavigation(obstacles);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),intersect=new T.Vector3();
  const projection=new T.Vector3(),labelPosition=new T.Vector3();
  let path=[],pathIndex=0,pointerStart=null,labelTimer=0,walking=false,hoverTimer=0,pendingDirection=null;
  let width=1,height=1,renderFrames=0,shadowFrames=0;

  function requestFrame(){if(!disposed&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
  function invalidate(){renderDirty=true;labelsDirty=true;requestFrame();}
  function setWalking(value){if(walking!==value){walking=value;callbacks.onWalk?.(value);}}
  function stop(){path=[];pathIndex=0;pendingDirection=null;destination.visible=false;invalidate();}
  const input=createKeyboardInput({eventTarget:window,canUse:()=>keyboardEnabled&&!document.hidden,
    onChange(event){const dir=movementDirection(input.keys);if(!event)pendingDirection=null;else if(event.pressed)pendingDirection=dir.x||dir.z?dir:null;if(dir.x||dir.z){path=[];pathIndex=0;destination.visible=false;}invalidate();},onStop:stop,onHome:reset});
  function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
  function down(e){pointerStart=[e.clientX,e.clientY];renderer.domElement.focus({preventScroll:true});}
  function up(e){
    if(e.button!==0||!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>6)return;
    pick(e);const hits=raycaster.intersectObjects(targets,false);
    if(hits.length){stop();callbacks.onPerson(hits[0].object.userData.personId);return;}
    if(raycaster.ray.intersectPlane(plane,intersect)&&Math.abs(intersect.x)<11.4&&Math.abs(intersect.z)<9.2){
      if(navigation.blocked(intersect.x,intersect.z)){callbacks.onNotice('Нажмите на свободное место на полу');return;}
      input.clear();path=navigation.findPath(me.group.position,intersect);pathIndex=0;
      if(path.length){const end=path.at(-1);destination.position.set(end.x,.03,end.z);destination.visible=true;invalidate();}
      else callbacks.onNotice('До этого места пока не пройти');
    }
  }
  function hover(e){if(e.timeStamp-hoverTimer<50||e.buttons)return;hoverTimer=e.timeStamp;pick(e);renderer.domElement.style.cursor=raycaster.intersectObjects(targets,false).length?'pointer':'grab';}
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointermove',hover);
  controls.addEventListener('change',invalidate);

  function resize(){width=container.clientWidth;height=container.clientHeight;renderer.setSize(width,height);const aspect=width/height;const vertical=width<620?22:Math.max(14.5,25.2/aspect);camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();invalidate();}
  function reset(){camera.position.set(0,25,22);controls.target.set(0,.1,0);camera.zoom=1;camera.updateProjectionMatrix();controls.update();invalidate();}
  reset();resize();const observer=new ResizeObserver(resize);observer.observe(container);
  function project(v){projection.copy(v).project(camera);return {x:Math.round((projection.x+1)*width),y:Math.round((1-projection.y)*height),visible:projection.z<1&&Math.abs(projection.x)<1.08&&Math.abs(projection.y)<1.08};}
  function publishLabels(){
    // Quantize to half a CSS pixel; emit only after camera/player changes.
    const rooms=departments.map(d=>{const p=project(labelPosition.set(d.x,1.05,d.z+(d.id==='meeting'?.5:0)));p.x/=2;p.y/=2;return {...p,y:Math.max(width<620?155:115,p.y),visible:p.visible&&p.x>75&&p.x<width-75,id:d.id,name:d.name};});
    labelPosition.copy(me.group.position);labelPosition.y+=1.93;
    const own=project(labelPosition);own.x/=2;own.y/=2;
    callbacks.onLabels({rooms,me:own,zoom:Math.round(camera.zoom*100)});labelsDirty=false;
  }
  function keepPlayerVisible(){
    projection.copy(me.group.position).project(camera);
    if(Math.abs(projection.x)<.73&&Math.abs(projection.y)<.64)return;
    const dx=(me.group.position.x-controls.target.x)*.08,dz=(me.group.position.z-controls.target.z)*.08;
    camera.position.x+=dx;camera.position.z+=dz;controls.target.x+=dx;controls.target.z+=dz;labelsDirty=true;
  }
  function tick(now){
    frame=0;if(disposed||document.hidden)return;
    const dt=Math.min((now-last)/1000,.05);last=now;
    const fromX=me.group.position.x,fromZ=me.group.position.z;
    let dir=movementDirection(input.keys);const tapped=!(dir.x||dir.z)&&pendingDirection;
    if(tapped)dir=pendingDirection;pendingDirection=null;
    const speed=input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')?4.2:2.4;
    let moved=false;
    if(dir.x||dir.z){const step=speed*(tapped?1/30:dt);moved=navigation.move(me.group.position,dir.x*step,dir.z*step);}
    else if(pathIndex<path.length){
      let remaining=2.4*dt;
      while(remaining>0&&pathIndex<path.length){
        const node=path[pathIndex],dx=node.x-me.group.position.x,dz=node.z-me.group.position.z,distance=Math.hypot(dx,dz);
        if(distance<.001){pathIndex++;continue;}
        const step=Math.min(distance,remaining);
        const changed=navigation.move(me.group.position,dx/distance*step,dz/distance*step);moved=changed||moved;
        if(!changed){path=[];pathIndex=0;break;}
        remaining-=step;if(step===distance)pathIndex++;
      }
      if(pathIndex>=path.length)destination.visible=false;
    }
    const wasWalking=walking;
    if(moved){me.group.rotation.y=Math.atan2(me.group.position.x-fromX,me.group.position.z-fromZ);me.l.rotation.x=Math.sin(now*.016)*.48;me.r.rotation.x=-me.l.rotation.x;keepPlayerVisible();}
    else{me.l.rotation.x=0;me.r.rotation.x=0;}
    setWalking(moved);
    if(moved||wasWalking){renderer.shadowMap.needsUpdate=true;renderDirty=true;labelsDirty=true;}
    ring.position.x=me.group.position.x;ring.position.z=me.group.position.z;
    const cameraChanged=controls.update();
    if(renderDirty||cameraChanged){
      if(renderer.shadowMap.needsUpdate)shadowFrames++;
      renderer.render(scene,camera);renderDirty=false;renderFrames++;
      if(import.meta.env.DEV){
        Object.assign(renderer.domElement.dataset,{drawCalls:renderer.info.render.calls,renderFrames,shadowFrames,playerX:me.group.position.x.toFixed(4),playerZ:me.group.position.z.toFixed(4),triangles:renderer.info.render.triangles});
      }
    }
    if(labelsDirty&&(now-labelTimer>65||!moved)){publishLabels();labelTimer=now;}
    if(moved||pathIndex<path.length||cameraChanged||labelsDirty)requestFrame();
  }
  function visibility(){
    if(document.hidden){input.clear();stop();setWalking(false);me.l.rotation.x=me.r.rotation.x=0;renderer.shadowMap.needsUpdate=true;cancelAnimationFrame(frame);frame=0;}
    else{last=performance.now();invalidate();}
  }
  document.addEventListener('visibilitychange',visibility);
  function restored(){renderer.shadowMap.needsUpdate=true;invalidate();}
  renderer.domElement.addEventListener('webglcontextrestored',restored);
  requestFrame();
  return {
    zoom(delta){camera.zoom=T.MathUtils.clamp(camera.zoom+delta,.65,2.1);camera.updateProjectionMatrix();invalidate();},reset,
    setKeyboardEnabled(value){keyboardEnabled=value;if(!value){input.clear();stop();}},
    locate(id){const p=actors.get(id)?.group.position;if(p){const dx=p.x-controls.target.x,dz=p.z-controls.target.z;camera.position.x+=dx;camera.position.z+=dz;controls.target.x+=dx;controls.target.z+=dz;controls.update();invalidate();}},
    dispose(){
      disposed=true;input.dispose();cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('change',invalidate);controls.dispose();
      document.removeEventListener('visibilitychange',visibility);
      renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointermove',hover);renderer.domElement.removeEventListener('webglcontextrestored',restored);
      disposeScene(scene,materials.values(),textures);renderer.dispose();renderer.domElement.remove();
    }
  };
}
