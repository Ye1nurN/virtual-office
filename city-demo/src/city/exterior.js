import {createSceneKit,noise} from './sceneKit.js';
import {buildProjectBuilding} from './buildings.js';
import {PROJECTS,RESERVE_PLOTS,exteriorPortals} from './catalog.js';
import {buildingBackGarden} from './buildingFrame.js';
import {buildCityBoundary,CITY_PAVING_SIZE} from './cityBoundary.js';

import {districtFurniture,districtPeople,districtObstacles} from './districtLayout.js';

export function buildExterior(templates,albedos={}){
  const k=createSceneKit(templates,albedos),interactions=exteriorPortals(),markers=[];
  k.box(0,-.61,0,500,.4,500,'#768e55');
  k.box(0,-.23,0,CITY_PAVING_SIZE,.32,CITY_PAVING_SIZE,'#a99e86');
  k.plane(0,-.025,0,CITY_PAVING_SIZE,CITY_PAVING_SIZE,k.surface('paving',CITY_PAVING_SIZE,CITY_PAVING_SIZE,5,'#f5edda'));
  // Distinct brick gutters subdivide the tile field into streets and sidewalks.
  for(const x of [-35,-13.1,-10.9,10.9,13.1,35]){
    k.box(x,.004,0,.62,.06,76,'#bd997b');
    for(let z=-38;z<=38;z+=.46)k.box(x,.041,z,.59,.06,.4,Math.round(z*2)%2?'#c9aa89':'#b89673');
  }
  for(const z of [-34.3,-12.4,-10.4,10.4,12.4,34.3]){
    k.box(0,.01,z,76,.06,.6,'#b5977a');
    for(let x=-38;x<=38;x+=.47)k.box(x,.047,z,.4,.06,.56,Math.round(x*2)%2?'#ccb396':'#b99a7b');
  }
  for(const p of RESERVE_PLOTS){
    k.box(p.x,.045,p.z,19.25,.14,18.5,'#95856a');
    k.plane(p.x,.125,p.z,18.7,18,k.surface('grass',18.7,18,5.8,'#b3c28a'));
    for(const dx of [-9.45,9.45])k.curb(p.x+dx,p.z,.44,18.7);
    for(const dz of [-9.15,9.15])k.curb(p.x,p.z+dz,19.4,.44);
    // Sparse tufts and wildflowers break the flat lawn without closing the paths.
    for(let i=0;i<42;i++){
      const xx=p.x+(noise(i+Number(p.id)*100)-.5)*15.5,zz=p.z+(noise(i*7+Number(p.id)*11)-.5)*14.5;
      if(Math.abs(xx-p.x)<3.5&&Math.abs(zz-p.z-1.5)<2)continue;
      k.bush(xx,zz,.25+noise(i)*.14,i,.12);
      if(i%4===0){k.box(xx,.43,zz,.1,.08,.17,'#f0d878');k.box(xx+.14,.35,zz+.2,.12,.1,.12,'#fff1ca');}
    }
    interactions.push({id:'plot-'+p.id,type:'plot',title:'Участок '+p.id,x:p.x,z:p.z+3.1,radius:2.3,plot:p.id});
  }
  for(const p of PROJECTS){
    const parcelX=p.parcelX??p.x,parcelZ=p.parcelZ??p.z,garden=buildingBackGarden(p);
    k.box(parcelX,.005,parcelZ,19.3,.08,18.6,'#aea088');
    k.plane(parcelX,.061,parcelZ,18.9,18.2,k.surface('paving',18.9,18.2,5,'#e1d7ba'));
    for(const dx of [-9.55,9.55])k.curb(parcelX+dx,parcelZ,.35,18.5);
    for(const dz of [-9.25,9.25])k.curb(parcelX,parcelZ+dz,19.3,.35);
    k.flowerbed(garden.x,garden.z,garden.w-.2,garden.d-.2,12);
    buildProjectBuilding(k,p);
    markers.push({id:p.id,name:p.name,x:p.x,y:p.h+2,z:p.z});
  }
  // Central garden square, framed by stone, with an accessible open south approach.
  k.box(0,.02,0,19.2,.1,18.7,'#8d806a');
  k.plane(0,.085,0,18.8,18.25,k.surface('paving',18.8,18.25,4.8,'#e8dbc3'));
  for(const x of [-9.45,9.45])k.curb(x,0,.37,18.7);
  for(const z of [-9.2,9.2])k.curb(0,z,19.3,.37);
  for(const i of districtFurniture()){
    const {x,z,w,d,s=1,seed=0}=i;
    if(i.type==='tree')k.tree(x,z,s,seed,{planter:i.planter});
    if(i.type==='potted-tree'){
      k.box(x,.36,z,w,.72,d,'#9b713d');k.box(x,.74,z,w+.12,.12,d+.12,'#b98b4c');
      for(const dx of [-w*.34,w*.34])k.box(x+dx,.36,z+d*.505,.06,.67,.04,'#74572e');
      k.tree(x,z,s,seed,{planter:false,base:.66});
    }
    if(i.type==='bench')k.bench(x,z,i.yaw||0,s);
    if(i.type==='lamp')k.lamp(x,z,s);
    if(i.type==='flowers'){
      if(i.central){
        for(const dx of [-2.2,2.2])k.flowerbed(x+dx,z,.65,4.8,32);
        for(const dz of [-2.2,2.2])k.flowerbed(x,z+dz,3.9,.65,84);
      }else k.flowerbed(x,z,w-.16,d-.16,seed);
    }
    if(i.type==='plot-sign'){
      for(const dx of [-1.9,1.9])k.box(x+dx,.98,z,.19,1.96,.2,'#8e6137');
      k.sign('УЧАСТОК '+i.id,x,2.02,z+.15,5.45,1.38,{bg:'#dcc191',fg:'#242e27',size:100,border:'#a37b4a'});
    }
    if(i.type==='map'){
      for(const dx of [-1.46,1.46])k.box(x+dx,1.25,z,.16,2.5,.2,'#304f55');
      k.box(x,2,z,3.25,2.2,.19,'#304f55');
      k.sign('КАРТА ГОРОДА',x,2.78,z+.16,2.9,.43,{bg:'#f3e7ca',fg:'#365d53',size:93});
      // The map uses the actual project coordinates, as small coloured 3D relief plots.
      k.box(x,1.79,z+.15,2.89,1.58,.035,'#c1d3ab');
      for(let col=-1;col<=1;col++)for(let row=-1;row<=1;row++)k.box(x+col*.89,1.8-row*.46,z+.19,.72,.36,.045,(col===0&&row===-1)?'#b67846':row===0&&col===-1?'#51a18a':row===0&&col===1?'#456c89':'#829e4f');
      interactions.push({id:'map',type:'map',title:'Карта проектов',x,z:z+1.4,radius:2.4});
    }
    if(i.type==='banner'){
      k.lamp(x,z,.93);k.box(x,2.32,z+.19,1.1,1.5,.07,'#348d80');
      k.box(x,3.12,z+.15,1.35,.07,.1,'#b6a376');k.box(x,1.54,z+.15,1.12,.08,.1,'#c9b786');
      k.model('plant_floor',x,z+.55,1.35);k.box(x,2.3,z+.25,.09,.94,.025,'#dfdca9');
      for(const dy of [-.28,0,.28])for(const dx of [-.23,.23])k.box(x+dx,2.4+dy,z+.26,.3,.14,.03,'#dfdca9',0,0,dx<0?-.55:.55);
    }
  }
  buildCityBoundary(k);
  for(const {assetId,x,z,s,yaw,y} of districtPeople())k.model(assetId,x,z,s,yaw,y);
  return {...k.finish(),obstacles:districtObstacles(),markers,interactions};
}
