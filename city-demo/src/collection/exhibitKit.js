import {createSceneKit} from '../city/sceneKit.js';

// Route a named building part into its own batches. The city keeps the ordinary
// scene kit; this adapter owns all additional geometry/materials in the gallery.
export function createExhibitKit(templates,albedos){
  const main=createSceneKit(templates,albedos),parts=new Map(),pieces=[];
  let current=main;
  const kit=Object.fromEntries(Object.entries(main).map(([key,value])=>[
    key,typeof value==='function'?(...args)=>current[key](...args):value,
  ]));
  kit.part=(id,build)=>{
    if(parts.has(id))throw new Error('Duplicate exhibit part: '+id);
    const previous=current;current=createSceneKit(templates,albedos);
    try{build();const piece=current.finish();main.root.add(piece.root);parts.set(id,piece.root);pieces.push(piece);}
    finally{current=previous;}
  };
  kit.finish=()=>{
    const result=main.finish(),release=result.assets.release;
    return {...result,parts,textures:[...result.textures,...pieces.flatMap(p=>p.textures)],
      assets:{...result.assets,release(){release();for(const piece of pieces)piece.assets.release();}},
    };
  };
  return kit;
}
