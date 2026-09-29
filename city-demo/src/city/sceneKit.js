import * as T from 'three';
import {assembleFloor} from '../world/assets.js';
import {createVegetation} from './vegetation.js';

// A shared set of small solid meshes, not sprites: paths and portals remain independent.
export {noise} from './vegetation.js';
export function createSceneKit(templates,albedos={}){
  const root=new T.Group(),batches=new Map(),materials=new Map(),objects=[],textures=[...Object.values(albedos)];
  const cube=new T.BoxGeometry(1,1,1),matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion(),euler=new T.Euler();
  let serial=0;
  function material(color){
    if(color?.isMaterial)return color;
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.88}));
    return materials.get(color);
  }
  function glow(color,intensity=.6){
    const key='glow-'+color+'-'+intensity;
    if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.4}));
    return materials.get(key);
  }
  function surface(name,w,h,metres=4,tint='#ffffff'){
    if(!albedos[name])return material(tint);
    const key=[name,w,h,metres,tint].join('/');
    if(!materials.has(key)){
      const map=albedos[name].clone();map.repeat.set(w/metres,h/metres);map.needsUpdate=true;textures.push(map);
      materials.set(key,new T.MeshStandardMaterial({map,color:tint,roughness:.94}));
    }
    return materials.get(key);
  }
  function box(x,y,z,w,h,d,color,yaw=0,rx=0,rz=0,fit=null){
    const mat=material(color);if(!batches.has(mat))batches.set(mat,[]);
    position.set(x,y,z);scale.set(w,h,d);rotation.setFromEuler(euler.set(rx,yaw,rz));
    matrix.compose(position,rotation,scale);if(fit)matrix.premultiply(fit);batches.get(mat).push(matrix.clone());
  }
  function model(assetId,x,z,s=1,yaw=0,y=0){objects.push({id:'city-model-'+serial++,assetId,position:[x,y,z],scale:Array.isArray(s)?s:[s,s,s],yaw,collidable:false,dynamic:false});}
  function plane(x,y,z,w,d,mat){
    const mesh=new T.Mesh(new T.PlaneGeometry(w,d),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  function sign(text,x,y,z,w,h,{bg='#26394b',fg='#fff9e9',yaw=0,sub='',size=180,border=null}={}){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(96,Math.round(1024*h/w));
    const ch=canvas.height,c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,ch);
    if(border){c.strokeStyle=border;c.lineWidth=8;c.strokeRect(6,6,1012,ch-12);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
    const fontSize=ch*(sub?.63:1.04);c.font=`700 ${fontSize}px Inter, Arial`;
    c.fillText(text,512,ch*(sub?.37:.52),940);if(sub){c.font=`500 ${ch*.22}px Inter, Arial`;c.fillText(sub,512,ch*.8,940);}
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;textures.push(texture);
    const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false}));
    panel.position.set(x,y,z);panel.rotation.y=yaw;root.add(panel);
    box(x-Math.sin(yaw)*.1,y,z-Math.cos(yaw)*.1,w+.18,h+.18,.16,bg,yaw);return panel;
  }
  const {tree,bush,flowerbed}=createVegetation(box);
  function bench(x,z,yaw=0,s=1){
    const local=(dx,dy,dz,w,h,d,col)=>box(x+(dx*Math.cos(yaw)+dz*Math.sin(yaw))*s,dy*s,z+(-dx*Math.sin(yaw)+dz*Math.cos(yaw))*s,w*s,h*s,d*s,col,yaw);
    for(const dx of [-.98,.98]){local(dx,.35,0,.12,.7,.64,'#354b46');local(dx,1.05,-.4,.12,.9,.12,'#354b46');local(dx,.92,0,.12,.12,.8,'#354b46');}
    for(let i=0;i<5;i++)local(0,.74,-.3+i*.16,2.5,.12,.13,i%2?'#c19049':'#daa453');
    for(let i=0;i<3;i++)local(0,1+i*.2,-.42,2.5,.15,.12,i%2?'#e4ae5e':'#b88339');
    for(const x0 of [-.94,.94])for(let i=0;i<3;i++)local(x0,1+i*.2,-.345,.045,.045,.02,'#584934');
  }
  function lamp(x,z,s=1){
    const dark='#293d3a';
    box(x,.12,z,.67*s,.24,.67*s,dark);box(x,.36,z,.4*s,.26,.4*s,'#50605a');
    box(x,2.1*s,z,.15*s,3.9*s,.15*s,dark);box(x,3.91*s,z,.5*s,.13*s,.5*s,dark);
    box(x,4.31*s,z,.42*s,.64*s,.42*s,glow('#ffd483',1.35));
    for(const dx of [-.25,.25])for(const dz of [-.25,.25])box(x+dx*s,4.3*s,z+dz*s,.07*s,.78*s,.07*s,dark);
    box(x,4.72*s,z,.68*s,.15*s,.68*s,dark);box(x,4.88*s,z,.4*s,.17*s,.4*s,dark);box(x,5.07*s,z,.12*s,.24*s,.12*s,dark);
  }
  function curb(x,z,w,d){
    box(x,.095,z,w+.18,.19,d+.18,'#847f6b');
    if(w>d){for(let dx=-w/2+.36;dx<w/2;dx+=.74)box(x+dx,.2,z,.7,.22,d,'#d0c8b1');}
    else for(let dz=-d/2+.36;dz<d/2;dz+=.74)box(x,.2,z+dz,w,.22,.7,'#d0c8b1');
  }
  function finish(){
    for(const [mat,matrices] of batches){const mesh=new T.InstancedMesh(cube,mat,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);}
    const assets=assembleFloor({objects,doors:[]},templates,{});root.add(assets.root);
    return {root,textures,assets,voxelCount:[...batches.values()].reduce((s,a)=>s+a.length,0)};
  }
  return {root,box,model,plane,material,glow,surface,tree,bush,bench,lamp,curb,sign,flowerbed,finish,textures};
}
