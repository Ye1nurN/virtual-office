export const SHELF_SPACING=27;
export const shelfWeight=(id,selected)=>selected?(id===selected?1.9:.7):1;
export function clampShelfStart(start,count,total){return Math.max(0,Math.min(Math.round(start),Math.max(0,total-count)));}
export function revealShelfItem(start,index,count,total){
  if(index<0)return clampShelfStart(start,count,total);
  return clampShelfStart(index<start?index:index>=start+count?index-count+1:start,count,total);
}
const approach=(value,target,dt)=>Math.abs(value-target)<.001?target:value+(target-value)*(1-Math.exp(-10*dt));

// Absolute positions make fast reversals converge without piling up timelines.
// Every tray stays on the timber while its building moves towards the visitor.
export function createShelfCarousel(ids){
  const states=new Map(ids.map((id,index)=>[id,{x:(index-1.5)*SHELF_SPACING,z:0,scale:1}]));
  let start=0,count=4,selected=null;
  return {
    states,
    update(next){count=Math.max(1,next.count);start=clampShelfStart(next.start,count,ids.length);selected=ids.slice(start,start+count).includes(next.selected)?next.selected:null;},
    step(dt,reduced=false){
      let moving=false;
      const visible=ids.slice(start,start+count),totalWeight=visible.reduce((sum,id)=>sum+shelfWeight(id,selected),0);
      ids.forEach((id,index)=>{
        const state=states.get(id),active=id===selected;
        const before=visible.slice(0,Math.max(0,index-start)).reduce((sum,id)=>sum+shelfWeight(id,selected),0);
        const position=index>=start&&index<start+count?(before+shelfWeight(id,selected)/2)/totalWeight*count-count/2:index-start-(count-1)/2;
        const target={x:position*SHELF_SPACING,z:active?3:selected?-4:0,scale:active?(count===2?1.5:1.9):selected?.7:1};
        for(const key of ['x','z','scale']){state[key]=reduced?target[key]:approach(state[key],target[key],Math.max(0,Math.min(dt,.05)));moving ||= state[key]!==target[key];}
      });
      return moving;
    },
  };
}
