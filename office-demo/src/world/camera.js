// A rigid camera rig keeps the avatar at one screen anchor without catch-up jitter.
const height=15,distance=18,azimuthDegrees=30;
const yaw=azimuthDegrees*Math.PI/180,sinYaw=Math.sin(yaw),cosYaw=Math.cos(yaw);
export const CAMERA_RIG={elevationDegrees:Math.atan2(height,distance)*180/Math.PI,azimuthDegrees,height,distance,targetHeight:.65,viewHeight:10.5,screenAnchor:.6};
// Convert screen-aligned keyboard directions to the office's fixed ground axes.
// Click routes and collision geometry remain in world coordinates.
export function cameraRelativeDirection({x,z}){
  return {x:x*cosYaw+z*sinYaw,z:-x*sinYaw+z*cosYaw};
}
export function followPlayer(camera,target,position){
  target.set(position.x,CAMERA_RIG.targetHeight,position.z);
  camera.position.set(position.x+CAMERA_RIG.distance*sinYaw,CAMERA_RIG.targetHeight+CAMERA_RIG.height,position.z+CAMERA_RIG.distance*cosYaw);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
}
