import {Matrix4} from 'three';

export const noise=(n)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const foliage=['#245529','#367229','#518d29','#73a32c','#92b532','#b0c440'];
const details={original:{tree:560,bush:32,grow:1},balanced:{tree:140,bush:12,grow:1.46}};

// Bounds of the yaw-rotated leaf boxes, without allocating temporary geometries.
function bounds(leaves,grow=1){
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const [x,y,z,w,h,d,,yaw=0] of leaves){
    const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
    const centre=[x,y,z],half=[(c*w+s*d)*grow/2,h*grow/2,(s*w+c*d)*grow/2];
    for(let a=0;a<3;a++){min[a]=Math.min(min[a],centre[a]-half[a]);max[a]=Math.max(max[a],centre[a]+half[a]);}
  }
  return {min,max};
}

// Farthest-point selection keeps foliage across the crown instead of removing
// consecutive leaf clusters. Incremental distances avoid sorting on every step.
function spread(leaves,count){
  const distances=new Float64Array(leaves.length).fill(Infinity),selected=[];
  let next=0;
  for(let i=1;i<leaves.length;i++)if(leaves[i][1]>=leaves[next][1])next=i;
  while(selected.length<count){
    const leaf=leaves[next];selected.push(leaf);distances[next]=-1;
    let farthest=-1;
    for(let i=0;i<leaves.length;i++){
      if(distances[i]<0)continue;
      const candidate=leaves[i],distance=(candidate[0]-leaf[0])**2+(candidate[1]-leaf[1])**2+(candidate[2]-leaf[2])**2;
      distances[i]=Math.min(distances[i],distance);
      if(distances[i]>farthest){farthest=distances[i];next=i;}
    }
  }
  return selected;
}

function drawLeaves(box,leaves,count,grow){
  if(count>=leaves.length){for(const leaf of leaves)box(...leaf);return;}
  const chosen=spread(leaves,count),original=bounds(leaves),actual=bounds(chosen,grow);
  const ratio=original.max.map((v,i)=>(v-original.min[i])/(actual.max[i]-actual.min[i]));
  // Fit the whole patch, after leaf rotation. This retains the approved variant's
  // envelope even for narrow beds, raised planters and differently seeded trees.
  const fit=new Matrix4().makeScale(...ratio);
  fit.setPosition(...original.min.map((v,i)=>v-actual.min[i]*ratio[i]));
  for(const [x,y,z,w,h,d,color,yaw=0] of chosen)box(x,y,z,w*grow,h*grow,d*grow,color,yaw,0,0,fit);
}

// Keep the original level for geometry comparisons. The city uses balanced by
// default; this is a fixed quality level, not distance-dependent LOD switching.
export function createVegetation(box,{detail='balanced'}={}){
  const preset=details[detail];
  if(!preset)throw new Error('Unknown vegetation detail: '+detail);
  function bush(x,z,s=1,seed=0,y=.35){
    const leaves=[];
    for(let i=0;i<32;i++){
      const a=noise(i+seed)*Math.PI*2,r=Math.sqrt(noise(i*3+seed))*s*.55;
      const yy=noise(i*7+seed),size=s*(.17+noise(i*13+seed)*.16);
      leaves.push([x+Math.cos(a)*r,y+yy*s*.7,z+Math.sin(a)*r,size,size*.8,size,foliage[Math.min(5,Math.floor(yy*4+noise(i)*2))],noise(i)*1.5]);
    }
    drawLeaves(box,leaves,preset.bush,preset.grow);
  }
  function tree(x,z,s=1,seed=0,{planter=true,base=0}={}){
    const wood=['#60402b','#795033','#94623b'];
    box(x,base+1.65*s,z,.42*s,3.3*s,.44*s,wood[0]);
    box(x+.12*s,base+1.7*s,z+.12*s,.12*s,3.35*s,.15*s,wood[1]);
    for(let i=0;i<5;i++){
      const a=i*2.4+seed,xx=x+Math.sin(a)*.5*s,zz=z+Math.cos(a)*.5*s;
      box(xx,base+2.5*s,zz,.18*s,1.8*s,.19*s,wood[i%3],a,0,.46);
    }
    const clusters=[[-.78,-.1,-.5],[.7,.05,-.5],[-.8,-.28,.68],[.78,-.17,.57],[0,.77,-.3],[.08,.4,.78],[0,-.4,0]],leaves=[];
    for(let i=0;i<560;i++){
      const cluster=clusters[i%clusters.length],a=noise(i+seed*941)*Math.PI*2,v=noise(i*3+seed*37)*2-1,r=.76+noise(i*7+seed)*.23;
      const rr=Math.sqrt(1-v*v),xx=cluster[0]+Math.cos(a)*r*rr,zz=cluster[2]+Math.sin(a)*r*rr,yy=cluster[1]+v*r*.9;
      const size=(.19+noise(i*19+seed)*.16)*s;
      const shade=Math.min(5,Math.max(0,Math.floor(2.1+yy*.8-xx*.48+noise(i*5)*2)));
      leaves.push([x+xx*s,base+(3.7+yy)*s,z+zz*s,size,size*(.6+noise(i+4)*.5),size,foliage[shade],noise(i*11)*1.6]);
    }
    drawLeaves(box,leaves,preset.tree,preset.grow);
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
  return {tree,bush,flowerbed};
}
