// Facades face local +Z. Use the same frame for meshes, entrances and navigation.
export function buildingPoint(project,x,z){
  const yaw=project.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
  return {x:project.x+x*c+z*s,z:project.z-x*s+z*c};
}
export function rotatedFootprint(w,d,yaw=0){
  const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
  return {w:w*c+d*s,d:w*s+d*c};
}
export function buildingFootprint(project){
  return {x:project.x,z:project.z,...rotatedFootprint(project.w,project.d,project.yaw)};
}
export function buildingEntrance(project,gap=1.3){return buildingPoint(project,0,project.d/2+gap);}
export function buildingBackGarden(project){
  const parcel={...project,x:project.parcelX??project.x,z:project.parcelZ??project.z};
  return {...buildingPoint(parcel,0,-8.2),...rotatedFootprint(14,1.4,project.yaw)};
}
