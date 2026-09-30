export function buildTynyshBuilding(k,p){
  const {x,z,w,d,h}=p,front=z+d/2,cream='#e6d8b7',sage='#57745e',gold='#b39760';
  k.box(x,.18,z,w+.5,.36,d+.5,'#b4a78c');k.box(x,h/2+.2,z,w,h,d,cream);
  k.box(x,h+.25,z,w+.55,.32,d+.55,sage);k.box(x,h+.45,z,w-.7,.16,d-.7,'#adb49a');
  for(const dx of [-5.3,-2.9,2.9,5.3]){
    k.box(x+dx,2.6,front+.08,1.85,3.9,.15,sage);k.box(x+dx,2.6,front+.18,1.57,3.6,.06,k.glow('#eaca85',.7));
    for(const dy of [-1.77,0,1.77])k.box(x+dx,2.6+dy,front+.24,1.72,.075,.1,gold);
    k.box(x+dx,2.6,front+.25,.07,3.6,.1,gold);
    k.box(x+dx,.53,front+.28,2.02,.17,.56,'#f0e2c4');
  }
  for(const dx of [-w/2+.2,w/2-.2,-1.5,1.5])k.box(x+dx,2.65,front+.18,.35,5.1,.4,'#eee4c9');
  k.box(x,1.8,front+.15,2.5,3.5,.16,sage);k.box(x,1.9,front+.25,2.22,3.13,.06,k.glow('#bad1ad',.23));
  k.box(x,1.8,front+.31,.06,3.45,.08,gold);for(const dx of [-.19,.19])k.box(x+dx,1.4,front+.4,.055,.55,.09,gold);
  k.box(x,4.6,front+.3,4.6,.84,.35,sage);k.sign('Tynysh',x,4.6,front+.51,4.3,.7,{bg:sage,fg:'#fff0ce'});
  k.sign('БАНКЕТНЫЙ ЗАЛ',x,3.91,front+.44,3.8,.3,{bg:cream,fg:sage});
  k.box(x,.12,front+.72,3.2,.14,1.5,'#d8c7a3');
  for(const dx of [-6.5,6.5]){k.box(x+dx,.48,front+.95,.82,.96,.82,gold);k.model('plant_floor',x+dx,front+.95,1.5,0,.5);}
}
