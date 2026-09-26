import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ArrowLeft,ArrowUpRight,DownloadSimple,Cube,ArrowsClockwise,GridFour,Sun,Stack,ArrowCounterClockwise,MagnifyingGlass,X} from '@phosphor-icons/react';
import '@fontsource-variable/inter';
import './model-library.css';
import {MODEL_PRESETS} from './model-presets.js';

const fmt=new Intl.NumberFormat('ru-RU');
function ModelLibrary(){
  const [catalog,setCatalog]=useState([]),[selected,setSelected]=useState('workstation'),[query,setQuery]=useState(''),[category,setCategory]=useState('Все');
  const [busy,setBusy]=useState(true),[error,setError]=useState(''),[wire,setWire]=useState(false),[rotate,setRotate]=useState(false),[daylight,setDaylight]=useState(true),[reference,setReference]=useState(false);
  const [renderInfo,setRenderInfo]=useState(null);const mount=useRef(null),engine=useRef(null),serial=useRef(0);
  useEffect(()=>{fetch('/models/manifest.json').then(r=>{if(!r.ok)throw new Error('Не удалось открыть каталог');return r.json();}).then(d=>setCatalog(d.assets)).catch(e=>{setError(e.message);setBusy(false);});},[]);
  useEffect(()=>{
    const scene=new T.Scene();scene.background=new T.Color('#e8e7df');
    const camera=new T.PerspectiveCamera(32,1,.01,150);
    const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
    renderer.domElement.setAttribute('aria-label','Настоящая 3D-модель. Перетаскивайте для вращения, используйте колесо для приближения.');renderer.domElement.tabIndex=0;mount.current.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=.18;controls.maxDistance=35;
    const hemi=new T.HemisphereLight('#dceaff','#76644b',2.0);scene.add(hemi);
    const sun=new T.DirectionalLight('#fff0cf',3.2);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-6;sun.shadow.bias=-.0002;sun.shadow.normalBias=.01;scene.add(sun);
    const fill=new T.DirectionalLight('#deebff',1.1);fill.position.set(5,3,-3);scene.add(fill);
    const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=-.007;floor.receiveShadow=true;scene.add(floor);
    const content=new T.Group();scene.add(content);const cache=new Map();const loader=new GLTFLoader();let frame=0,auto=false,disposed=false;
    function draw(){frame=0;if(disposed||document.hidden)return;if(auto)controls.update();renderer.render(scene,camera);if(auto)frame=requestAnimationFrame(draw);}
    function invalidate(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
    controls.addEventListener('change',invalidate);
    function resize(){if(disposed||!mount.current)return;const {width,height}=mount.current.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();invalidate();}
    const observer=new ResizeObserver(resize);observer.observe(mount.current);
    const onVisible=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else invalidate();};document.addEventListener('visibilitychange',onVisible);
    function fit(){
      const b=new T.Box3().setFromObject(content),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
      controls.target.copy(c);const direction=new T.Vector3(.40,.73,1).normalize();
      camera.position.copy(c).add(direction);camera.lookAt(c);
      const inverse=camera.quaternion.clone().invert(),tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let distance=.18;
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
        const p=new T.Vector3(x,y,z).sub(c).applyQuaternion(inverse);
        distance=Math.max(distance,p.z+Math.abs(p.y)/tan,p.z+Math.abs(p.x)/(tan*camera.aspect));
      }
      distance*=1.18;camera.position.copy(c).addScaledVector(direction,distance);camera.near=Math.max(.001,distance/200);camera.far=distance*30+30;
      camera.updateProjectionMatrix();controls.update();invalidate();return{width:s.x,height:s.y,depth:s.z};
    }
    async function load(id){if(!cache.has(id))cache.set(id,loader.loadAsync('/models/'+id+'.glb'));const g=await cache.get(id);const obj=g.scene.clone(true);obj.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.castShadow=!(o.material.transmission>0);o.receiveShadow=true;}});return obj;}
    function clear(){while(content.children.length){const o=content.children[0];o.traverse(n=>{if(n.isMesh)n.material.dispose();});content.remove(o);}}
    engine.current={scene,content,load,clear,fit,invalidate,setWire(v){content.traverse(o=>{if(o.isMesh)o.material.wireframe=v;});invalidate();},setRotate(v){auto=v;controls.autoRotate=v;controls.autoRotateSpeed=1.1;invalidate();},setDaylight(v){sun.color.set(v?'#fff0cf':'#ffffff');sun.intensity=v?3.2:2.2;hemi.intensity=v?2.0:2.6;invalidate();}};
    resize();return()=>{disposed=true;serial.current++;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',onVisible);controls.dispose();clear();for(const promise of cache.values())promise.then(g=>g.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}}));floor.geometry.dispose();floor.material.dispose();renderer.dispose();renderer.domElement.remove();engine.current=null;};
  },[]);
  useEffect(()=>{
    if(!catalog.length||!engine.current)return;const e=engine.current;const version=++serial.current;setBusy(true);setError('');setRenderInfo(null);e.clear();
    const arrangements=MODEL_PRESETS[selected]?.objects||[[selected,0,0,0]];
    Promise.all(arrangements.map(async([id,x,y,z,rot=0])=>{const obj=await e.load(id);obj.position.set(x,y,z);obj.rotation.y=rot;return obj;})).then(objects=>{if(version!==serial.current){objects.forEach(o=>o.traverse(n=>{if(n.isMesh)n.material.dispose();}));return;}objects.forEach(o=>e.content.add(o));e.setWire(wire);const dimensions=e.fit();let triangles=0,parts=0;e.content.traverse(o=>{if(o.isMesh){parts++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});setRenderInfo({...dimensions,triangles,parts});setBusy(false);}).catch(err=>{if(version===serial.current){setError('Не удалось загрузить модель: '+err.message);setBusy(false);}});
  },[selected,catalog]);
  useEffect(()=>engine.current?.setWire(wire),[wire]);useEffect(()=>engine.current?.setRotate(rotate),[rotate]);useEffect(()=>engine.current?.setDaylight(daylight),[daylight]);
  const asset=catalog.find(a=>a.id===selected);const filtered=catalog.filter(a=>(category==='Резерв'?a.kit==='reserve':a.kit!=='reserve'&&(category==='Все'||a.category===category))&&(a.title+' '+a.id).toLowerCase().includes(query.toLowerCase()));
  const categories=['Все',...new Set(catalog.map(a=>a.category)),'Резерв'];
  const title=asset?.title||MODEL_PRESETS[selected]?.title;
  return <div className="library-app"><header className="library-header"><a href="/" className="back-office"><ArrowLeft size={18}/>Наш офис</a><div className="library-brand"><Cube size={22}/><strong>Библиотека объектов</strong><span>Версия 02</span></div><a className="download-pack" href="/models/office-assets-pack.zip" download><DownloadSimple size={17}/>Скачать GLB-набор</a></header>
    <aside className="library-sidebar"><div className="sidebar-intro"><span className="eyebrow">Из рисунка в объём</span><h1>Детали будущего офиса.</h1><p>{catalog.filter(a=>a.kit!=='reserve').length} объектов по плану четырёх этажей.<br/>Вращайте и рассматривайте с любой стороны.</p></div><div className="assemblies"><span className="eyebrow">Примеры сборки</span><button onClick={()=>setSelected('workstation')} className={selected==='workstation'?'active':''}><Stack size={18}/>Рабочее место<ArrowUpRight size={16}/></button><button onClick={()=>setSelected('reception')} className={selected==='reception'?'active':''}><Stack size={18}/>Ресепшен и ожидание<ArrowUpRight size={16}/></button><button onClick={()=>setSelected('learning')} className={selected==='learning'?'active':''}><Stack size={18}/>Переговорная<ArrowUpRight size={16}/></button></div><div className="asset-search"><MagnifyingGlass size={16}/><input placeholder="Найти объект" aria-label="Найти объект" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="category-filter">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="asset-list">{filtered.map((a,i)=><button key={a.id} className={selected===a.id?'active':''} onClick={()=>setSelected(a.id)}><span className="asset-number">{String(catalog.indexOf(a)+1).padStart(2,'0')}</span><span><strong>{a.title}</strong><small>{a.kit==='reserve'?'Резерв · ':''}{a.category}</small></span><Cube size={15}/></button>)}{!filtered.length&&<p className="empty">Такого объекта пока нет в наборе.</p>}</div><div className="library-note">Реконструкция по одному ракурсу.<br/>Скрытые стороны и размеры восстановлены предположительно.</div></aside>
    <main className="model-area"><div className="model-canvas" ref={mount}/><div className="viewport-label"><span className="eyebrow">{asset?'Отдельный объект':'Собрано из отдельных GLB'}</span><h2>{title}</h2><span className="real-model"><i/>Настоящая 3D-геометрия</span></div>{busy&&<div className="loading-model" role="status">Загрузка модели…</div>}{error&&<div className="model-error" role="alert">{error}</div>}
      <div className="viewer-actions"><button aria-label="Сбросить ракурс" title="Сбросить ракурс" onClick={()=>engine.current?.fit()}><ArrowCounterClockwise size={19}/></button><button aria-label="Автовращение" aria-pressed={rotate} title="Автовращение" className={rotate?'active':''} onClick={()=>setRotate(!rotate)}><ArrowsClockwise size={19}/></button><button aria-label="Показать сетку модели" aria-pressed={wire} title="Сетка модели" className={wire?'active':''} onClick={()=>setWire(!wire)}><GridFour size={19}/></button><button aria-label="Дневное освещение" aria-pressed={daylight} title="Дневное освещение" className={daylight?'active':''} onClick={()=>setDaylight(!daylight)}><Sun size={19}/></button></div>
      <div className="model-bottom"><div className="model-description"><p>{asset?.description||MODEL_PRESETS[selected]?.description}</p><div className="model-meta">{renderInfo&&<><span>{fmt.format(renderInfo.triangles)} треугольников</span><span>{renderInfo.width.toFixed(2)} × {renderInfo.depth.toFixed(2)} × {renderInfo.height.toFixed(2)} м</span></>}</div></div><div className="model-links"><button onClick={()=>setReference(true)}>Сравнить с эталоном<ArrowUpRight size={16}/></button>{asset&&<a href={'/models/'+asset.file} download><DownloadSimple size={16}/>Скачать GLB</a>}</div></div><span className="orbit-hint">Перетаскивание — вращение · Колесо — масштаб · Правая кнопка — сдвиг</span></main>
    {reference&&<div className="reference-modal" role="dialog" aria-modal="true" aria-label="Исходное изображение" onClick={()=>setReference(false)}><div className="reference-modal-card" onClick={e=>e.stopPropagation()}><div><h2>Исходный дизайн</h2><button aria-label="Закрыть эталон" onClick={()=>setReference(false)}><X size={22}/></button></div><img src={asset?.reference||"/assets/four-floor-plan.png"} alt="Утверждённый дизайн офиса для сравнения с реконструированными моделями"/><p>Реконструкция видимых предметов. Скрытые поверхности и размеры интерпретированы. {asset?.assumption}</p></div></div>}
  </div>;
}
const reactRoot=import.meta.hot?.data.root??createRoot(document.getElementById('root'));
reactRoot.render(<ModelLibrary/>);
if(import.meta.hot)import.meta.hot.dispose(data=>{data.root=reactRoot;});
