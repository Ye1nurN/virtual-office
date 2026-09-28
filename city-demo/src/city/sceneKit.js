import * as T from 'three';
import {assembleFloor} from '../world/assets.js';

// A shared set of small solid meshes, not sprites: paths and portals remain independent.
export const noise=(n)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function createSceneKit(templates,albedos={}){
  const root=new T.Group(),batches=new Map(),materials=new Map(),objects=[],textures=[...Object.values(albedos)];
  const cube=new T.BoxGeometry(1,1,1),matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion(),euler=new T.Euler();
  let serial=0;
  const foliage=['#245529','#367229','#518d29','#73a32c','#92b532','#b0c440'];
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
  function box(x,y,z,w,h,d,color,yaw=0,rx=0,rz=0){
    const mat=material(color);if(!batches.has(mat))batches.set(mat,[]);
    position.set(x,y,z);scale.set(w,h,d);rotation.setFromEuler(euler.set(rx,yaw,rz));
    matrix.compose(position,rotation,scale);batches.get(mat).push(matrix.clone());
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
  function bush(x,z,s=1,seed=0,y=.35){
    for(let i=0;i<32;i++){
      const a=noise(i+seed)*Math.PI*2,r=Math.sqrt(noise(i*3+seed))*s*.55;
      const yy=noise(i*7+seed),size=s*(.17+noise(i*13+seed)*.16);
      box(x+Math.cos(a)*r,y+yy*s*.7,z+Math.sin(a)*r,size,size*.8,size,foliage[Math.min(5,Math.floor(yy*4+noise(i)*2))],noise(i)*1.5);
    }
  }
  function tree(x,z,s=1,seed=0,{planter=true,base=0}={}){
    const wood=['#60402b','#795033','#94623b'];
    box(x,base+1.65*s,z,.42*s,3.3*s,.44*s,wood[0]);
    box(x+.12*s,base+1.7*s,z+.12*s,.12*s,3.35*s,.15*s,wood[1]);
    for(let i=0;i<5;i++){
      const a=i*2.4+seed,xx=x+Math.sin(a)*.5*s,zz=z+Math.cos(a)*.5*s;
      box(xx,base+2.5*s,zz,.18*s,1.8*s,.19*s,wood[i%3],a,0,.46);
    }
    // Fine leaf clusters give a rounded, irregular crown with gaps and coloured tips.
    const clusters=[[-.78,-.1,-.5],[.7,.05,-.5],[-.8,-.28,.68],[.78,-.17,.57],[0,.77,-.3],[.08,.4,.78],[0,-.4,0]];
    for(let i=0;i<560;i++){
      const cluster=clusters[i%clusters.length],a=noise(i+seed*941)*Math.PI*2,v=noise(i*3+seed*37)*2-1,r=.76+noise(i*7+seed)*.23;
      const rr=Math.sqrt(1-v*v),xx=cluster[0]+Math.cos(a)*r*rr,zz=cluster[2]+Math.sin(a)*r*rr,yy=cluster[1]+v*r*.9;
      const size=(.19+noise(i*19+seed)*.16)*s;
      const shade=Math.min(5,Math.max(0,Math.floor(2.1+yy*.8-xx*.48+noise(i*5)*2)));
      box(x+xx*s,base+(3.7+yy)*s,z+zz*s,size,size*(.6+noise(i+4)*.5),size,foliage[shade],noise(i*11)*1.6);
    }
    if(planter){
      box(x,base+.19,z,2.05*s,.38,2.05*s,'#b5ad97');box(x,base+.4,z,1.85*s,.08,1.85*s,'#716149');
      for(const dx of [-.8,.8])for(const dz of [-.8,.8])bush(x+dx*s,z+dz*s,.46*s,seed+dx*7+dz,base+.4);
    }
  }
  function flowerbed(x,z,w=3,d=1,seed=0,y=0){
    box(x,y+.17,z,w+.18,.34,d+.18,'#b7ab91');box(x,y+.35,z,w,.05,d,'#63513a');
    for(let xx=-w/2+.28;xx<w/2;xx+=.47)for(let zz=-d/2+.25;zz<d/2;zz+=.43){
      const n=seed+xx*11+zz*73;bush(x+xx,z+zz,.54,n,y+.35);
      for(let j=0;j<3;j++){
        const fx=x+xx+(noise(n+j)-.5)*.33,fz=z+zz+(noise(n+j*7)-.5)*.3,fy=y+.81+noise(n+j*3)*.21;
        const col=['#faf1c7','#f1c33b','#e89967','#ffffff'][Math.floor(noise(n*3+j)*4)];
        box(fx,fy,fz,.1,.08,.21,col);box(fx,fy,fz,.21,.08,.1,col);box(fx,fy+.055,fz,.065,.04,.065,'#d88c29');
      }
    }
  }
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
