// Shared by the walkable detailing shop and its collectible miniature.
export function buildCar(k,x,z,color,scale=1){
  const box=(dx,y,dz,w,h,d,c)=>k.box(x+dx*scale,y*scale,z+dz*scale,w*scale,h*scale,d*scale,c);
  box(0,.42,0,1.8,.42,3.9,'#253638');box(0,.76,0,1.96,.65,3.7,color);
  box(0,1.28,-.15,1.62,.56,1.9,'#34565c');box(0,1.61,-.2,1.68,.12,1.65,color);
  box(0,1.16,1,1.68,.12,.16,'#cee5da');box(0,.86,1.91,1.23,.12,.05,'#263937');
  for(const side of [-1,1]){
    for(const dz of [-1.15,1.15]){box(side*.99,.4,dz,.26,.7,.7,'#263132');box(side*1.14,.4,dz,.035,.36,.36,'#bfc9c3');}
    box(side*.69,.91,1.88,.44,.18,.09,k.glow('#fff0cb',.6));box(side*.7,.9,-1.88,.38,.14,.06,'#bb654a');
    box(side*.96,1.2,.62,.26,.16,.25,color);
  }
}
