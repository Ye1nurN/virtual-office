import {rotatedFootprint} from './floors.js';

export function objectCollider(object,registry){
  if(!object.solid)return null;
  const [x,,z]=object.position,[sx,,sz]=object.scale;
  if(object.worldCollider)return {x,z,w:object.collider.w,d:object.collider.d,id:object.id};
  const dims=registry.get(object.assetId)?.dimensions||[1,1,1],w=object.collider?.[0]??dims[0],d=object.collider?.[1]??dims[1];
  return {...rotatedFootprint(x,z,w*sx,d*sz,object.yaw),id:object.id};
}

export function doorCollider(door,open){
  if(!open)return {...rotatedFootprint(door.x,door.z,door.width,.18,door.yaw),id:door.id};
  // A left-hinged door is parked perpendicular to its original opening.
  const localX=-door.width/2,localZ=door.width/2;
  return {...rotatedFootprint(door.x+Math.cos(door.yaw)*localX+Math.sin(door.yaw)*localZ,door.z-Math.sin(door.yaw)*localX+Math.cos(door.yaw)*localZ,.16,door.width,door.yaw),id:door.id};
}
