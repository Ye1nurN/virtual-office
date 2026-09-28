import * as T from 'three';

export async function loadExteriorSurfaces(){
  const loader=new T.TextureLoader(),loaded={};
  // Wait for all requests before cleanup, including one that finishes after a failure.
  const results=await Promise.allSettled(['grass','paving','brick'].map(async name=>{
      const map=await loader.loadAsync(`/textures/${name}-albedo.png`);
      map.name=name;map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
      map.anisotropy=8;loaded[name]=map;
    }));
  const failure=results.find(r=>r.status==='rejected');
  if(failure){Object.values(loaded).forEach(t=>t.dispose());throw failure.reason;}
  return loaded;
}
