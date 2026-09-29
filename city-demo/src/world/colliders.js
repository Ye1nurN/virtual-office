import {rotatedFootprint} from './floors.js';

export function objectCollider(object,registry,localBounds=registry.get(object.assetId)?.bounds){
  if(!object.solid)return null;
  const [x,,z]=object.position,[sx,,sz]=object.scale;
  if(object.worldCollider)return {x,z,w:object.collider.w,d:object.collider.d,id:object.id};
  // A GLB pivot need not be the centre of its geometry (stairs and chairs).
  // Explicit footprint overrides describe intentional simplified ground colliders.
  if(localBounds&&!object.collider){
    const cx=(localBounds.min.x+localBounds.max.x)/2*sx,cz=(localBounds.min.z+localBounds.max.z)/2*sz;
    return {...rotatedFootprint(x+cx*Math.cos(object.yaw)+cz*Math.sin(object.yaw),z-cx*Math.sin(object.yaw)+cz*Math.cos(object.yaw),(localBounds.max.x-localBounds.min.x)*sx,(localBounds.max.z-localBounds.min.z)*sz,object.yaw),id:object.id};
  }
  const dims=registry.get(object.assetId)?.dimensions||[1,1,1],w=object.collider?.[0]??dims[0],d=object.collider?.[1]??dims[1];
  return {...rotatedFootprint(x,z,w*sx,d*sz,object.yaw),id:object.id};
}

export function doorCollider(door,open){
  if(!open)return {...rotatedFootprint(door.x,door.z,door.width,.18,door.yaw),id:door.id};
  // A left-hinged door is parked perpendicular to its original opening.
  const {hingeX:localX=-door.width/2,centerZ:localZ=door.width/2,thickness=.16,depth=door.width}=door.leaf||{};
  return {...rotatedFootprint(door.x+Math.cos(door.yaw)*localX+Math.sin(door.yaw)*localZ,door.z-Math.sin(door.yaw)*localX+Math.cos(door.yaw)*localZ,thickness,depth,door.yaw),id:door.id};
}
