// Own route and position: the guide never reads or changes the visitor's path.
export const GUIDE_SPEED=3.4;
export function guideMeetingPoint(project,navigation){
  const yaw=project.yaw||0,entry=project.entry;
  for(const side of [1,-1]){
    const point={x:entry.x+Math.cos(yaw)*1.25*side+Math.sin(yaw)*.65,z:entry.z-Math.sin(yaw)*1.25*side+Math.cos(yaw)*.65};
    if(!navigation.blocked(point.x,point.z)&&navigation.clearSegment(entry,point))return point;
  }
  return {...entry};
}
export function createGuideWalker(navigation,initial){
  const position={x:initial.x,z:initial.z};
  let yaw=initial.yaw||0,phase='idle',route=[],targetYaw=yaw;
  const snapshot=()=>({...position,yaw,phase,moving:phase==='walking'});
  function pause(){route=[];if(phase==='walking')phase='paused';return snapshot();}
  return {
    snapshot,pause,
    restore(pose){if(pose&&Number.isFinite(pose.x)&&Number.isFinite(pose.z)&&!navigation.blocked(pose.x,pose.z)){position.x=pose.x;position.z=pose.z;yaw=Number.isFinite(pose.yaw)?pose.yaw:0;}route=[];phase='idle';},
    goTo(target,facing=0){
      route=[];targetYaw=facing;
      if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.z)||navigation.blocked(target.x,target.z)){phase='paused';return false;}
      if(Math.hypot(target.x-position.x,target.z-position.z)<.025){phase='arrived';yaw=targetYaw;return true;}
      route=navigation.findPath(position,target);phase=route.length?'walking':'paused';return !!route.length;
    },
    update(dt){
      let remaining=GUIDE_SPEED*Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
      while(route.length&&remaining>0){
        const next=route[0],dx=next.x-position.x,dz=next.z-position.z,distance=Math.hypot(dx,dz);
        if(distance<.001){route.shift();continue;}
        const step=Math.min(distance,remaining),before={...position};
        if(!navigation.move(position,dx/distance*step,dz/distance*step)){pause();break;}
        yaw=Math.atan2(position.x-before.x,position.z-before.z);remaining-=step;
        if(Math.hypot(next.x-position.x,next.z-position.z)<.001)route.shift();
      }
      if(phase==='walking'&&!route.length){phase='arrived';yaw=targetYaw;}
      return snapshot();
    },
  };
}
