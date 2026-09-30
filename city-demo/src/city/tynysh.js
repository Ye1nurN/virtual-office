import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createSceneKit} from './sceneKit.js';
import {TYNYSH_TABLES,TYNYSH_EXIT,tynyshObstacles} from './tynyshLayout.js';
import {tableGuests} from './tynyshDemo.js';

export function buildTynysh(templates,albedos){
  const k=createSceneKit(templates,albedos),cream='#f0e6cf',gold='#bc9960',sage='#657f63',dark='#345747';
  const cloth=k.material('#f6f0de'),wood=k.material('#ad824d'),ivory=k.material('#fffcf0'),glass=k.material('#c8d8ce');
  function cylinder(x,y,z,r,h,mat,group=k.root,r2=r,segments=48){const mesh=new T.Mesh(new T.CylinderGeometry(r,r2,h,segments),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
  function flowers(x,y,z,seed=0){
    k.box(x,y+.12,z,.22,.24,.22,gold);k.bush(x,z,.24,seed,y+.22);
    for(let i=0;i<10;i++){const a=i*2.4,r=.13+(i%3)*.08;const fx=x+Math.cos(a)*r,fz=z+Math.sin(a)*r,fy=y+.44+(i%4)*.09;k.box(fx,fy-.13,fz,.018,.27,.018,sage);k.box(fx,fy,fz,.13,.085,.13,i%3?'#fff3ce':'#d8ba67');k.box(fx,fy+.035,fz,.07,.06,.07,'#f3d38b');}
  }
  k.box(0,-.16,0,18.2,.32,14.4,'#c4b99f');k.plane(0,.012,0,17.9,14,k.surface('parquet',18,14,4));
  // Brass perimeter inlay and a quiet dance floor at the head of the central aisle.
  for(const x of [-8.35,8.35])k.box(x,.025,0,.045,.014,13.4,gold);
  for(const z of [-6.65,6.65])k.box(0,.025,z,16.75,.014,.045,gold);
  k.box(0,.018,-2.35,4.05,.015,3.4,'#b59468');
  for(const x of [-2.02,2.02])k.box(x,.035,-2.35,.065,.02,3.5,cream);
  for(const z of [-4.08,-.62])k.box(0,.035,z,4.1,.02,.065,cream);
  k.box(0,2.7,-7,18,5.4,.24,cream);
  // Tall windows and pleated sage drapes: roof omitted for the cutaway view.
  for(const side of [-1,1]){
    k.box(side*8.92,2.7,0,.22,5.4,14,cream);
    k.box(side*8.72,.45,0,.15,.9,14,'#d1c2a1');
    for(const z of [-4.7,-.8,3.1]){
      k.box(side*8.77,2.75,z,.1,3.55,2.95,k.glow('#d8e2d5',.25));
      for(const dz of [-1.5,0,1.5])k.box(side*8.64,2.75,z+dz,.13,3.7,.085,gold);
      for(const y of [1,3.5,4.55])k.box(side*8.61,y,z,.16,.10,3.15,gold);
      for(const dz of [-1.64,1.64])for(let j=0;j<5;j++)k.box(side*(8.52-(j%2)*.035),2.85,z+dz+j*.07,.2,4.45,.08,j%2?sage:'#789072');
      k.box(side*8.45,5.12,z,.25,.16,3.8,gold);
      k.box(side*8.33,2.65,z+1.86,.17,1,.17,gold);k.box(side*8.22,2.65,z+1.86,.2,.63,.2,k.glow('#ffdd91',1.1));
    }
    k.box(side*8.72,5.3,0,.48,.22,14.2,'#c4b99d');
    k.box(side*5.22,.4,6.93,7,.8,.21,'#d8ceb6');k.box(side*5.22,.86,6.93,7,.12,.32,cream);
    for(const z of [-5.6,5.6]){k.box(side*7.6,.42,z,.87,.84,.87,'#ccb98f');k.model('plant_floor',side*7.6,z,1.45,0,.45);}
    for(const z of [-5.3,0,4.6]){k.box(side*8.1,.9,z,.7,1.8,.65,'#d6c59e');flowers(side*8.1,1.8,z,Math.round(z+10));}
  }
  // Small stage with curtains, flowers, speakers and a microphone.
  k.box(0,.29,-5.55,8.3,.56,2.3,'#a48250');k.box(0,.6,-5.55,8.5,.12,2.4,'#cca36e');
  k.box(0,.13,-4.18,4.6,.26,.45,'#c3a176');
  for(let i=0;i<70;i++)k.box(-4.14+i*.12,2.9,-6.76+(i%2)*.08,.14,4.4,.16,i%2?'#e6d3ae':'#f1e2c2');
  for(const x of [-4.35,4.35])for(let i=0;i<5;i++)k.box(x+i*.1,2.95,-6.56,.14,4.3,.2,i%2?sage:'#7d906c');
  for(const x of [-3.75,3.75]){k.box(x,1.2,-5.12,.52,1.1,.45,'#383c35');for(const y of [.95,1.35]){const speaker=cylinder(x,y,-4.88,.16,.035,k.material('#222922'),k.root,.16,20);speaker.rotation.x=Math.PI/2;}flowers(x,.66,-4.75,5);}
  cylinder(0,.69,-5.55,.23,.04,wood);cylinder(0,1.45,-5.55,.025,1.5,k.material('#3a413b'));k.box(0,2.22,-5.55,.065,.15,.09,'#263930');
  for(const x of [-2.8,2.8]){flowers(x,.65,-6,12);flowers(x+.35,.72,-5.8,9);}
  for(const side of [-1,1]){
    for(const x of [5.15,6.25]){
      k.box(side*x,2.7,-6.77,.32,5.25,.26,gold);
      k.box(side*x,3.5,-6.48,.12,1.15,.12,gold);k.box(side*x,3.5,-6.36,.2,.72,.2,k.glow('#ffe1a0',1.3));
    }
    k.box(side*5.7,2.7,-6.78,.75,4.9,.17,sage);
    k.model('plant_floor',side*6.6,-5.9,1.8,0,.08);
    for(let i=0;i<4;i++)flowers(side*(5.5+i*.22),.45+i*.3,-5.3-(i%2)*.28,30+i);
  }
  k.sign('Tynysh',0,4.25,-6.5,2.3,.52,{bg:'#eadbbe',fg:'#546a4b'});
  const tables=new Map(),markers=[];
  for(const t of TYNYSH_TABLES){
    cylinder(t.x,.48,t.z,.2,.95,wood);cylinder(t.x,1.04,t.z,1.2,.15,cloth);
    const skirt=cylinder(t.x,.84,t.z,1.19,.34,cloth,k.root,1.27,64);
    const positions=skirt.geometry.attributes.position;for(let i=0;i<positions.count;i++){const a=Math.atan2(positions.getZ(i),positions.getX(i)),s=1+Math.sin(a*24)*.018;positions.setX(i,positions.getX(i)*s);positions.setZ(i,positions.getZ(i)*s);}skirt.geometry.computeVertexNormals();
    k.box(t.x,1.123,t.z,.42,.012,2.2,'#839275');flowers(t.x,1.14,t.z,t.id);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,cx=t.x+Math.sin(a)*1.52,cz=t.z+Math.cos(a)*1.52;
      k.box(cx,.54,cz,.48,.14,.45,cream,a);k.box(cx,.635,cz,.41,.045,.38,sage,a);
      k.box(cx+Math.sin(a)*.2,1.02,cz+Math.cos(a)*.2,.49,.77,.075,gold,a);
      k.box(cx+Math.sin(a)*.245,1.03,cz+Math.cos(a)*.245,.39,.6,.07,i%3?sage:cream,a);
      for(const dx of [-.18,.18])for(const dz of [-.15,.15])k.box(cx+Math.cos(a)*dx+Math.sin(a)*dz,.26,cz-Math.sin(a)*dx+Math.cos(a)*dz,.045,.52,.045,gold,a);
    }
    const settings=new T.Group();k.root.add(settings);
    // Merge each material per table to keep a fully served banquet inexpensive to render.
    const seats=[];
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,x=t.x+Math.sin(a)*.92,z=t.z+Math.cos(a)*.92,seat=new T.Group();
      cylinder(x,1.16,z,.17,.035,ivory,seat,.17,24);cylinder(x,1.185,z,.12,.018,cloth,seat,.12,24);
      cylinder(x+.2,1.24,z,.055,.17,glass,seat,.04,12);
      const napkin=new T.Mesh(new T.BoxGeometry(.12,.027,.19),k.material(sage));napkin.position.set(x,1.215,z);napkin.rotation.y=a;seat.add(napkin);
      const fork=new T.Mesh(new T.BoxGeometry(.018,.015,.2),k.material(gold));fork.position.set(x-.21,1.17,z);fork.rotation.y=a;seat.add(fork);
      const groups=new Map();seat.children.forEach(m=>{m.updateMatrix();const geo=m.geometry.clone().applyMatrix4(m.matrix);if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(geo);m.geometry.dispose();});seat.clear();
      for(const [mat,geos] of groups){const mesh=new T.Mesh(mergeGeometries(geos),mat);mesh.castShadow=true;seat.add(mesh);geos.forEach(g=>g.dispose());}settings.add(seat);seats.push(seat);
    }
    const halo=new T.Mesh(new T.RingGeometry(1.79,1.84,64),new T.MeshBasicMaterial({color:'#77d5b5',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.set(t.x,.065,t.z);k.root.add(halo);
    const marker={id:'table-'+t.id,name:'Стол '+t.id,x:t.x,y:1.75,z:t.z};markers.push(marker);tables.set(t.id,{settings,seats,halo,marker});
  }
  // Reception and service console leave the full central entrance clear.
  k.box(-7.7,.7,5.1,.9,1.4,2.2,dark);k.box(-7.7,1.46,5.1,1.05,.16,2.4,cream);
  for(let z=4.08;z<6.2;z+=.14)k.box(-7.23,.71,z,.02,1.28,.025,gold);
  k.model('monitor',-7.7,4.8,1,Math.PI/2,1.53);flowers(-7.7,1.55,5.75,3);
  k.box(7.35,.86,5.1,1.2,1.7,2,dark);k.box(7.35,1.74,5.1,1.4,.14,2.2,gold);
  for(let i=0;i<6;i++)cylinder(7.35,1.86+i*.04,4.7,.23,.035,ivory);
  flowers(7.3,1.84,5.6,4);
  k.box(0,.025,6,2.7,.018,1.45,sage);for(const x of [-1.31,1.31])k.box(x,.04,6,.025,.01,1.4,gold);
  const built=k.finish();
  return {...built,obstacles:tynyshObstacles(),interactions:[TYNYSH_EXIT,...TYNYSH_TABLES.map(t=>({id:'table-'+t.id,type:'table',table:t.id,title:'Выбрать стол '+t.id,...t.approach,radius:.95}))],markers,
    setTynyshDemo(state){if(!state)return;for(const [id,v] of tables){const done=state.tasks.find(t=>t.table===id).done;v.settings.visible=done;v.seats.forEach((s,i)=>s.visible=i<tableGuests(state,id));v.halo.visible=id===state.selected;v.marker.name=id===state.selected?`Стол ${id} · ${done?'готов':state.phase==='seating'?'рассадка':'сервировка'}`:'Стол '+id;}},
  };
}
