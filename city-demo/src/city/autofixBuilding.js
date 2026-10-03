import {buildingPart} from './buildingPart.js';
import {buildCar} from './carModel.js';

export function buildAutofixBuilding(k,p){
  const {x,z,w,d,h}=p,front=z+d/2;
  k.box(x,.16,z,w+.5,.32,d+.5,'#a9997d');
  if(p.galleryDisplay){
    // A real recessed bay is needed behind the moving shutter.
    for(const side of [-1,1])k.box(x+side*(w/2-.15),h/2+.2,z,.3,h,d,'#d7d1b7');
    k.box(x,h/2+.2,z-d/2+.15,w,h,.3,'#a6a68b');
    k.box(x,h-.6,front,w,1.6,.3,'#d7d1b7');
    k.box(x,h+.02,z,w,.2,d,'#d7d1b7');
    k.box(x,1.8,front,4.1,3.3,.3,'#d7d1b7');
    for(const side of [-1,1])k.box(x+side*6.5,1.8,front,1,3.3,.3,'#d7d1b7');
    k.box(x-4.2,.34,z,3.55,.05,d-.4,'#767e71');
    buildingPart(k,'garage-light',()=>k.box(x-4.2,3.35,z,3.2,.08,d-.7,k.glow('#ffe9bd',.7)));
    buildCar({...k,box:(xx,y,zz,...rest)=>k.box(xx,y+.32,zz,...rest)},x-4.2,front-2,'#75a9a5',1.15);
  }else k.box(x,h/2+.2,z,w,h,d,'#d7d1b7');
  k.box(x,h+.2,z,w+.55,.32,d+.55,'#455c53');
  for(const dx of [-w/2+.2,0,w/2-.2])k.box(x+dx,2,front+.12,.28,3.8,.3,'#69796c');
  for(const dx of [-4.2,4.2]){
    buildingPart(k,dx<0?'garage-gate':'garage-fixed',()=>{
    k.box(x+dx,1.85,front+.2,3.6,3.2,.1,'#283e3b');
    for(let y=.45;y<3.4;y+=.36)k.box(x+dx,y,front+.29,3.5,.06,.08,'#69847a');
    k.box(x+dx,1.62,front+.32,3.2,.65,.04,k.glow('#7cb9b0',.2));
    });
    k.box(x+dx,3.59,front+.32,3.65,.1,.16,k.glow('#ffdd9a',.7));
  }
  k.box(x,1.57,front+.2,2.3,3,.18,'#304d49');k.box(x,1.76,front+.33,1.94,2.37,.05,k.glow('#afcdc0',.2));
  k.box(x+.65,1.3,front+.43,.06,.56,.1,'#e5c58f');
  k.box(x,4.36,front+.24,12.1,.92,.32,'#324d43');
  k.sign('AUTOFIX HUB',x,4.36,front+.43,11.6,.77,{bg:'#324d43',fg:'#f5dfb0',size:160});
  k.box(x,3.32,front+.68,2.7,.17,1.1,'#bca47c');
  k.box(x,.1,front+.67,2.8,.16,1.25,'#c5bca3');
  for(const dx of [-5,5])k.flowerbed(x+dx,front+2.45,3.15,.77,15);
  for(const dx of [-6.4,6.4]){k.box(x+dx,.32,front+1.28,1.1,.64,1.1,'#8a8568');k.model('plant_floor',x+dx,front+1.28,1.6,0,.32);}
  for(const dx of [-4.6,4.6]){k.box(x+dx,h+.5,z,2.4,.38,2.8,'#768579');k.box(x+dx,h+.72,z,2,.06,2.4,'#334e5a');}
}
