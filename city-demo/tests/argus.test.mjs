import test from 'node:test';
import assert from 'node:assert/strict';
import {createArgusDemo,argusDemoReducer as reduce,ARGUS_ACTIONS,ARGUS_SCENARIOS,argusReport} from '../src/city/argusDemo.js';
import {createArgusDirector} from '../src/city/argusDirector.js';
import {ARGUS_BOTS,ARGUS_STATIONS,argusObstacles} from '../src/city/argusLayout.js';
import {createNavigation} from '../src/movement.js';
import {INTERIOR_BOUNDS} from '../src/city/catalog.js';
const start=(scenario='dos')=>reduce(reduce(createArgusDemo(),{type:'SELECT',scenario}),{type:'START'});
const nav=()=>createNavigation(argusObstacles(),INTERIOR_BOUNDS);
function finish(initial,director=createArgusDirector()){
  let s=initial,seen=new Set(),frames=0;
  for(;frames<6000&&s.phase!=='complete';frames++){
    const r=director.update(s,.05);assert.notEqual(r.view.phase,'error',r.view.text);
    for(const a of r.actors){assert.equal(nav().blocked(a.x,a.z),false,`${a.id} collided`);if(a.moving)seen.add(a.id);}
    if(r.command)s=reduce(s,r.command);
  }
  assert.equal(s.phase,'complete');return {state:s,seen,frames,director};
}
test('ARGUS stations, homes, console and exit are collision-free and connected',()=>{
  const n=nav(),points=[{x:0,z:4.4},{x:0,z:5.8},...ARGUS_BOTS,...Object.values(ARGUS_STATIONS)];
  for(const p of points){assert.equal(n.blocked(p.x,p.z),false,JSON.stringify(p));assert.ok(n.findPath({x:0,z:4.4},p).length||p===points[0]);}
});
test('All ARGUS scenarios complete through three moving bots, with distinct results and truthful reports',()=>{
  for(const scenario of Object.keys(ARGUS_SCENARIOS)){
    const {state,seen}=finish(start(scenario));assert.equal(state.events.length,6);assert.equal(seen.size,3);
    assert.equal(state.decision,scenario==='normal'?'observe':'contain');assert.equal(state.events.filter(e=>e.source==='bot').length,5);
    const report=argusReport(state);assert.equal(report.modelExecuted,false);assert.equal(report.networkConnected,false);assert.equal(report.demo,true);assert.equal(report.node,ARGUS_SCENARIOS[scenario].node);
  }
  assert.equal(argusReport(start()),null);
});
test('Pause freezes time, actor positions and work; speed 2 completes the same work faster',()=>{
  let s=start();const d=createArgusDirector();for(let i=0;i<12;i++)d.update(s,.1);
  s=reduce(s,{type:'CONTROL',paused:true});const before=JSON.stringify(d.update(s,0));for(let i=0;i<20;i++)assert.equal(JSON.stringify(d.update(s,1)),before);
  const normal=finish(start()),fast=finish(reduce(start(),{type:'CONTROL',speed:2}));assert.ok(fast.frames<normal.frames*.6);assert.deepEqual(fast.state.events,normal.state.events);
});
test('Duplicate and stale bot commands cannot advance reset, paused or manually controlled incidents',()=>{
  let s=start(),d=createArgusDirector(),command;
  for(let i=0;i<500&&!command;i++)command=d.update(s,.1).command;
  assert.ok(command);assert.equal(d.update(s,1).command,null);
  const applied=reduce(s,command);assert.equal(reduce(applied,command),applied);
  for(const event of [{type:'RESET'},{type:'CONTROL',paused:true},{type:'CONTROL',mode:'manual'},{type:'CONTROL',speed:2}]){const next=reduce(s,event);assert.equal(reduce(next,command),next);}
});
test('Manual takeover respects roles and sequence, rejects the wrong decision, and returns to bots',()=>{
  let s=reduce(start('normal'),{type:'CONTROL',mode:'manual'});
  s=reduce(s,{type:'ROLE',role:'engineer'});const wrong=reduce(s,{type:'MANUAL_COMMAND',command:'COLLECT'});assert.equal(wrong.phase,'stream');assert.ok(wrong.error);
  s=reduce(s,{type:'ROLE',role:'operator'});
  for(const command of ['COLLECT','DETECT','ANALYZE'])s=reduce(s,{type:'MANUAL_COMMAND',command});
  assert.equal(s.phase,'respond');assert.equal(s.role,'engineer');
  const denied=reduce(s,{type:'MANUAL_COMMAND',command:'RESPOND',decision:'contain'});assert.equal(denied.phase,'respond');assert.equal(denied.events.length,s.events.length);assert.ok(denied.error);
  s=reduce(denied,{type:'MANUAL_COMMAND',command:'RESPOND',decision:'observe'});assert.equal(s.error,null);assert.equal(s.phase,'verify');
  const final=finish(reduce(s,{type:'CONTROL',mode:'auto'})).state;assert.equal(final.phase,'complete');assert.equal(final.events.length,6);
});
test('A director keeps its progress while unmounted; reset creates a fresh case with no stale report',()=>{
  let s=start('replay'),d=createArgusDirector();for(let i=0;i<20;i++)d.update(s,.1);
  const before=d.update(s,0),positions=JSON.stringify(before.actors),clock=before.clock;
  assert.equal(JSON.stringify(d.update(s,0).actors),positions);assert.equal(d.update(s,0).clock,clock);
  s=finish(s,d).state;s=reduce(s,{type:'RESET'});assert.equal(s.events.length,0);assert.equal(argusReport(s),null);
  const reset=d.update(s,0);assert.equal(reset.clock,0);assert.equal(reset.view.phase,'idle');assert.deepEqual(reset.actors.map(({x,z})=>({x,z})),ARGUS_BOTS.map(({x,z})=>({x,z})));
});
