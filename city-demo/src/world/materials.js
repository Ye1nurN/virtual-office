// Runtime art direction; the authored GLBs and the model catalogue stay intact.
// sRGB colours retain distinct wood, upholstery and leaf shades in daylight.
const PALETTE={
  oak:'#c88732',oak_dark:'#805020',oak_light:'#edb655',oak_top:'#dfa042',
  green_velvet:'#356c51',green_edge:'#6c9467',green_shadow:'#234f3d',
  sage_dark:'#354d36',sage_light:'#819454',
  leaf:'#478322',leaf_mid:'#78a626',leaf_light:'#a4c22f',leaf_tip:'#c4d64c',
  terracotta:'#ab6338',pot_rim:'#c78c4b',
  book_blue:'#286987',book_teal:'#397766',book_red:'#a4432d',book_cream:'#d6b365'
};
export function styleOfficeMaterial(material){
  const colour=PALETTE[material.name];
  if(colour&&material.color)material.color.set(colour);
}
