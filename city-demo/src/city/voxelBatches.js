import * as T from 'three';

// Local bounds let Three cull distant gardens. Plain colours share one material
// through instanceColor; textured/emissive materials retain their own shaders.
export function createVoxelBatches(geometry,cellSize=12){
  const groups=new Map(),paint=new T.MeshStandardMaterial({color:'#ffffff',roughness:.88});
  let count=0;
  function add(matrix,material){
    const tinted=material.userData.voxelTint===true;
    const renderMaterial=tinted?paint:material;
    const x=Math.floor(matrix.elements[12]/cellSize),z=Math.floor(matrix.elements[14]/cellSize);
    const key=`${renderMaterial.uuid}/${x}/${z}`;
    if(!groups.has(key))groups.set(key,{material:renderMaterial,instances:[],tinted});
    groups.get(key).instances.push({matrix:matrix.clone(),color:tinted?material.color.clone():null});count++;
  }
  function finish(){
    const meshes=[];
    for(const {material,instances,tinted} of groups.values()){
      const mesh=new T.InstancedMesh(geometry,material,instances.length);
      instances.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);if(tinted)mesh.setColorAt(i,item.color);});
      mesh.castShadow=!material.transparent;mesh.receiveShadow=true;
      mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.updateMatrix();mesh.matrixAutoUpdate=false;
      meshes.push(mesh);
    }
    groups.clear();
    if(!meshes.some(mesh=>mesh.material===paint))paint.dispose();
    return {meshes,count};
  }
  return {add,finish};
}
