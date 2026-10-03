// City renderers keep their static batches. The collection can opt into named,
// independently animated parts without discovering meshes by colour or position.
export function buildingPart(kit,id,build){
  if(kit.part)kit.part(id,build);else build();
}
