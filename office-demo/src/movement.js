export const MOVE_CODES = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
const KEY_FALLBACKS=new Map(Object.entries({
  w:'KeyW',ц:'KeyW',a:'KeyA',ф:'KeyA',s:'KeyS',ы:'KeyS',d:'KeyD',в:'KeyD',
  arrowup:'ArrowUp',arrowleft:'ArrowLeft',arrowdown:'ArrowDown',arrowright:'ArrowRight',
  shift:'ShiftLeft',escape:'Escape',esc:'Escape',home:'Home'
}));
const CONTROL_CODES=new Set(['ShiftLeft','ShiftRight','Escape','Home']);
const LEGACY_CODES=new Map([[87,'KeyW'],[65,'KeyA'],[83,'KeyS'],[68,'KeyD'],[38,'ArrowUp'],[37,'ArrowLeft'],[40,'ArrowDown'],[39,'ArrowRight'],[16,'ShiftLeft'],[27,'Escape'],[36,'Home']]);
function keyboardCode(event){
  // Prefer recognised physical controls, then the printed key (including remaps).
  // A non-empty but unrelated/incorrect code must not discard a usable D/В.
  if(MOVE_CODES.has(event.code)||CONTROL_CODES.has(event.code))return event.code;
  const key=event.key?.normalize('NFKC').toLowerCase();
  const mapped=KEY_FALLBACKS.get(key);if(mapped)return mapped;
  // Older keyboards/remote clients sometimes provide only the numeric value.
  // Never override a meaningful non-movement letter or an IME composition.
  if(!key||key==='unidentified')return LEGACY_CODES.get(event.keyCode||event.which)||'';
  return '';
}
function keyIdentity(event,code){
  if(event.code&&event.code!=='Unidentified')return 'physical:'+event.code;
  return 'resolved:'+code;
}

export function movementDirection(keys) {
  let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  let z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
  const length=Math.hypot(x,z);
  if(length){x/=length;z/=length;}
  return {x,z};
}

export function isTextEntry(target) {
  return !!target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
}

// Listeners share one input state. Physical key codes work with Russian layouts.
export function createKeyboardInput({eventTarget,onChange,onStop,onHome,canUse=()=>true}) {
  const keys=new Set(),held=new Map();
  function clear(){held.clear();if(keys.size){keys.clear();onChange();}}
  function down(event){
    const code=keyboardCode(event);
    if(code==='Escape'){clear();onStop();return;}
    if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing||isTextEntry(event.target)||!canUse()){clear();return;}
    if(code==='Home'){event.preventDefault();if(!event.repeat)onHome();return;}
    if(!MOVE_CODES.has(code)&&!code.startsWith('Shift'))return;
    if(MOVE_CODES.has(code))event.preventDefault();
    held.set(keyIdentity(event,code),code);
    if(!keys.has(code)){keys.add(code);onChange({pressed:code});}
  }
  function up(event){
    const resolved=keyboardCode(event),identity=keyIdentity(event,resolved);
    const code=held.get(identity)||resolved;
    if(held.has(identity))held.delete(identity);
    else for(const [id,value] of held)if(value===code)held.delete(id);
    if(![...held.values()].includes(code)&&keys.delete(code))onChange({released:code});
  }
  function blur(){clear();onStop();}
  function focus(event){if(isTextEntry(event.target)){clear();onStop();}}
  // Capture on the window before a focused control can stop bubble propagation.
  // Editable targets and open panels still explicitly block movement above.
  eventTarget.addEventListener('keydown',down,true);eventTarget.addEventListener('keyup',up,true);
  eventTarget.addEventListener('blur',blur);eventTarget.addEventListener('focusin',focus);
  return {keys,clear,dispose(){clear();eventTarget.removeEventListener('keydown',down,true);eventTarget.removeEventListener('keyup',up,true);eventTarget.removeEventListener('blur',blur);eventTarget.removeEventListener('focusin',focus);}};
}

class MinHeap {
  items=[];
  push(value){let i=this.items.length;this.items.push(value);while(i){const p=(i-1)>>1;if(this.items[p].f<=value.f)break;this.items[i]=this.items[p];i=p;}this.items[i]=value;}
  pop(){const root=this.items[0],tail=this.items.pop();if(this.items.length){let i=0;while(i*2+1<this.items.length){let c=i*2+1;if(c+1<this.items.length&&this.items[c+1].f<this.items[c].f)c++;if(this.items[c].f>=tail.f)break;this.items[i]=this.items[c];i=c;}this.items[i]=tail;}return root;}
}

export function createNavigation(obstacles,{minX=-11.4,maxX=11.4,minZ=-9.2,maxZ=9.2,radius=.28,cellSize=.35}={}) {
  const boxes=obstacles.map(o=>({left:o.x-o.w/2-radius,right:o.x+o.w/2+radius,top:o.z-o.d/2-radius,bottom:o.z+o.d/2+radius}));
  // Broad phase: check only obstacles in the current 2×2 metre bucket.
  const buckets=new Map(),bucketKey=(x,z)=>`${Math.floor(x/2)},${Math.floor(z/2)}`;
  for(const b of boxes)for(let x=Math.floor(b.left/2);x<=Math.floor(b.right/2);x++)for(let z=Math.floor(b.top/2);z<=Math.floor(b.bottom/2);z++){const k=`${x},${z}`;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(b);}
  function blocked(x,z){return x<minX||x>maxX||z<minZ||z>maxZ||(buckets.get(bucketKey(x,z))||[]).some(b=>x>b.left&&x<b.right&&z>b.top&&z<b.bottom);}
  function move(position,dx,dz){
    const startX=position.x,startZ=position.z,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.09));
    for(let i=0;i<steps;i++){
      const x=position.x+dx/steps;if(!blocked(x,position.z))position.x=x;
      const z=position.z+dz/steps;if(!blocked(position.x,z))position.z=z;
    }
    return Math.hypot(position.x-startX,position.z-startZ)>1e-7;
  }
  function clearSegment(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08));for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
  const nx=Math.floor((maxX-minX)/cellSize)+1,nz=Math.floor((maxZ-minZ)/cellSize)+1,total=nx*nz;
  const occupied=new Uint8Array(total),points=Array.from({length:total},(_,i)=>({x:minX+i%nx*cellSize,z:minZ+Math.floor(i/nx)*cellSize}));
  points.forEach((p,i)=>{occupied[i]=Number(blocked(p.x,p.z));});
  function nearest(p){
    const cx=Math.round((p.x-minX)/cellSize),cz=Math.round((p.z-minZ)/cellSize);let best=-1,distance=Infinity;
    for(let z=Math.max(0,cz-2);z<=Math.min(nz-1,cz+2);z++)for(let x=Math.max(0,cx-2);x<=Math.min(nx-1,cx+2);x++){
      const i=z*nx+x,d=Math.hypot(points[i].x-p.x,points[i].z-p.z);
      if(!occupied[i]&&d<distance&&clearSegment(p,points[i])){best=i;distance=d;}
    }return best;
  }
  function findPath(from,to){
    if(blocked(from.x,from.z)||blocked(to.x,to.z))return [];
    if(clearSegment(from,to))return [{x:to.x,z:to.z}];
    const start=nearest(from),end=nearest(to);if(start<0||end<0)return [];
    const costs=new Float64Array(total).fill(Infinity),parents=new Int32Array(total).fill(-1),closed=new Uint8Array(total),open=new MinHeap();
    const heuristic=i=>Math.hypot(points[i].x-points[end].x,points[i].z-points[end].z)/cellSize;
    costs[start]=0;open.push({id:start,f:heuristic(start)});
    while(open.items.length){
      const {id}=open.pop();if(closed[id])continue;
      if(id===end){const route=[{x:to.x,z:to.z}];for(let i=end;i!==-1;i=parents[i])route.push({...points[i]});route.reverse();
        const smooth=[];let anchor=from;for(let i=0;i<route.length;){let next=i;while(next+1<route.length&&clearSegment(anchor,route[next+1]))next++;smooth.push(route[next]);anchor=route[next];i=next+1;}return smooth;
      }
      closed[id]=1;const x=id%nx,z=Math.floor(id/nx);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const xx=x+dx,zz=z+dz,j=zz*nx+xx;if(xx<0||zz<0||xx>=nx||zz>=nz||closed[j]||occupied[j])continue;
        if(dx&&dz&&(occupied[z*nx+xx]||occupied[zz*nx+x]))continue;
        const cost=costs[id]+(dx&&dz?Math.SQRT2:1);
        if(cost>=costs[j]||!clearSegment(points[id],points[j]))continue;
        costs[j]=cost;parents[j]=id;open.push({id:j,f:cost+heuristic(j)});
      }
    }return [];
  }
  return {blocked,move,findPath,clearSegment};
}
