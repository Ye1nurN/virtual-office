import {createSceneKit} from './sceneKit.js';

// A small, non-interactive street view behind the interior portal. It shares
// the city's geometry palette, but never adds obstacles to the indoor route.
export function createEntranceOutlook({frontZ,heightScale=1}){
  const k=createSceneKit(new Map());
  k.box(0,-.18,30,100,.16,60,'#99ad76');
  k.box(0,-.10,9,34,.16,18,'#bbb39a');
  for(let x=-16.5;x<17;x+=1.5)for(let z=.75;z<18;z+=1.5){
    k.box(x,-.009,z,1.475,.018,1.475,(Math.round(x+z)%3)?'#e0d5ba':'#d6c9ad');
  }
  for(const x of [-12,-4,4,12]){
    k.tree(x,15.2,.9,Math.abs(x)*17);
    k.flowerbed(x,13.6,2.6,.8,Math.abs(x)*11);
  }
  for(const x of [-8,8])k.bench(x,11.2,Math.PI,.9);
  for(const x of [-13,13])k.lamp(x,8.5,.8);
  const {root}=k.finish();root.name='entrance-street-view';
  // Pharmacy artwork scales only height; the street remains human-sized.
  root.position.z=frontZ+.02;root.scale.y=1/heightScale;root.visible=false;
  return root;
}
