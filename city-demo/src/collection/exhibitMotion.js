export const EXHIBIT_REST_ANGLE=.32;
const approach=(value,target,rate,dt)=>Math.abs(value-target)<.0005?target:value+(target-value)*(1-Math.exp(-rate*dt));

// Absolute pointer/focus targets avoid rotation drift after rapid enter/leave.
// All animations settle, so the renderer can stop requesting frames at rest.
export function createExhibitMotion(ids){
  const states=new Map(ids.map(id=>[id,{angle:EXHIBIT_REST_ANGLE,scene:0,elapsed:0,manual:null}]));
  const interest={pointer:null,focus:null};let selected=null;
  return {
    states,
    interest(id,source,on){
      if(!(source in interest)||!states.has(id))return;
      if(on)interest[source]=id;else if(interest[source]===id)interest[source]=null;
    },
    clearInterest(){interest.pointer=interest.focus=null;},
    select(id){selected=states.has(id)?id:null;interest.pointer=interest.focus=null;for(const state of states.values())state.manual=null;},
    turn(id,amount,immediate=false){const state=states.get(id);if(!state)return;state.manual=(state.manual??state.angle)+amount;if(immediate)state.angle=state.manual;},
    step(dt,reduced=false){
      const active=interest.pointer??interest.focus??selected;let moving=false;
      dt=Math.min(Math.max(dt,0),.05);
      for(const [id,s] of states){
        const engaged=id===active||id===selected;
        s.elapsed=engaged?Math.min(1.7,s.elapsed+dt):0;
        const scene=engaged?Math.min(1,Math.max(0,(s.elapsed-.3)/1.25)):0;
        const angle=s.manual??(engaged?0:EXHIBIT_REST_ANGLE);
        if(reduced){s.elapsed=engaged?1.7:0;s.scene=engaged?1:0;s.angle=angle;}
        else{
          s.scene=approach(s.scene,scene,18,dt);
          s.angle=approach(s.angle,angle,9,dt);
          moving ||= s.scene!==scene||s.angle!==angle||(engaged&&s.elapsed<1.7);
        }
      }
      return moving;
    },
  };
}
