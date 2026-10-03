import {Group} from 'three';

const ramp=(value,start,end)=>{const t=Math.min(1,Math.max(0,(value-start)/(end-start)));return t*t*(3-2*t);};
function glow(root,rest=1,unlitTint=1){
  const materials=new Map();
  root?.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.emissiveIntensity>0)materials.set(m,{emission:m.emissiveIntensity,color:m.color.clone()});});
  return value=>{for(const [m,base] of materials){m.emissiveIntensity=base.emission*rest+value;m.color.copy(base.color).multiplyScalar(unlitTint+(1-unlitTint)*Math.min(1,value));}};
}
function hinge(root,x,z){
  if(!root)return null;
  const pivot=new Group();root.parent.add(pivot);pivot.position.set(x,0,z);pivot.add(root);root.position.set(-x,0,-z);return pivot;
}

export function createExhibitEffects(project,parts){
  const actions=[];
  if(project.id==='pharmacy'){
    const cross=glow(parts.get('pharmacy-cross'),.1,.3),left=glow(parts.get('display-left'),.5),right=glow(parts.get('display-right'),.5);
    actions.push(t=>{cross(ramp(t,0,.3)*2);left(ramp(t,.2,.65)*.8);right(ramp(t,.5,1)*.8);});
  }
  if(project.id==='autofix'){
    const gate=parts.get('garage-gate'),light=glow(parts.get('garage-light'));
    actions.push(t=>{const open=ramp(t,0,1);if(gate){gate.scale.y=1-.91*open;gate.position.y=3.45*(1-gate.scale.y);}light(open*1.8);});
  }
  if(project.id==='argus'){
    const scan=parts.get('argus-scan'),shield=glow(parts.get('argus-shield'),.25);
    actions.push(t=>{if(scan){scan.visible=t>.02&&t<.98;scan.position.y=ramp(t,0,.95)*3.5*(project.heightScale||1);}shield(ramp(t,.65,1)*1.8);});
  }
  if(project.id==='office'){
    const windows=[...parts].filter(([id])=>id.startsWith('office-window-')).map(([,part])=>glow(part,.35));
    const person=parts.get('office-employee');
    actions.push(t=>{
      windows.forEach((light,i)=>light(ramp(t,i*.12,i*.12+.35)*.95));
      if(person){person.visible=t>.65;person.position.x=.32*(1-ramp(t,.65,1));}
    });
  }
  if(project.id==='tynysh'){
    const front=project.d/2,left=hinge(parts.get('hall-door-left'),-1.16,front+.15),right=hinge(parts.get('hall-door-right'),1.16,front+.15);
    const lights=[...parts].filter(([id])=>id.startsWith('hall-window-')||id==='hall-light').map(([,part])=>glow(part,.45));
    actions.push(t=>{const open=ramp(t,0,.8);if(left)left.rotation.y=-open*1.15;if(right)right.rotation.y=open*1.15;lights.forEach((light,i)=>light(ramp(t,.1+i*.07,.6+i*.07)*.9));});
  }
  const update=t=>actions.forEach(action=>action(t));update(0);
  return {update};
}
