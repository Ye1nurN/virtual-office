import test from 'node:test';
import assert from 'node:assert/strict';
import {createPharmacyDirector,PHARMACY_BOTS,BOT_STATIONS} from '../src/city/pharmacyDirector.js';
import {createPharmacyDemo,transitionPharmacyDemo as reduce,availableReport} from '../src/city/pharmacyDemo.js';
import {createNavigation} from '../src/movement.js';
import {SHELVES,INTERIOR_BOUNDS} from '../src/city/catalog.js';
import {pharmacyObstacles} from '../src/city/pharmacyLayout.js';

const now=new Date(2026,8,28).getTime(),image='data:image/jpeg;base64,dGVzdA==';
function start(shelf='A-02',scenario='standard'){
  let s=createPharmacyDemo();s.automation.scenario=scenario;
  return reduce(s,{type:'REQUEST',campaign:'Тест команды',shelf,portion:'left',month:'2026-10',now});
}
function commit(s,command){return reduce(s,{...command,...(command.command==='CAPTURE'?{image}:{}),now});}
function simulate(s,director=createPharmacyDirector(),limit=2400){
  const actions=[],nav=createNavigation(pharmacyObstacles(),INTERIOR_BOUNDS);let carried=false;
  for(let i=0;i<limit;i++){
    const r=director.update(s,.05);
    for(const a of r.actors)assert.equal(nav.blocked(a.x,a.z),false,a.id+' stays outside furniture');
    carried||=r.actors.some(a=>a.carrying);
    if(r.command){actions.push(r.command.command);s=commit(s,r.command);}
    assert.notEqual(r.view.phase,'error',r.view.text);
    if(s.report?.status==='approved')return {state:s,actions,carried,seconds:(i+1)*.05,director};
  }
  assert.fail('Bots did not complete the campaign');
}
test('All bot homes, work stations and shelf delivery points are connected without furniture collisions',()=>{
  const nav=createNavigation(pharmacyObstacles(),INTERIOR_BOUNDS),points=[...PHARMACY_BOTS,...Object.values(BOT_STATIONS),...SHELVES];
  for(const from of points)for(const to of points){assert.equal(nav.blocked(from.x,from.z),false);assert.ok(nav.findPath(from,to).length,JSON.stringify({from,to}));}
});
test('Bots finish every shelf automatically; viewer stays advertiser and box is actually carried',()=>{
  for(const shelf of SHELVES){
    const r=simulate(start(shelf.id));assert.ok(r.carried);assert.ok(r.seconds>30&&r.seconds<80,r.seconds+' second scenario');
    assert.deepEqual(r.actions,['APPROVE_REQUEST','CREATE_TASK','INSTALL','CAPTURE','SUBMIT_REPORT','APPROVE_REPORT']);
    assert.equal(r.state.role,'advertiser');assert.equal(r.state.task.status,'done');assert.equal(availableReport(r.state).image,image);
    assert.ok(r.state.events.slice(1).every(e=>e.source==='bot'));
  }
});
test('Reshoot scenario retains rejected attempt and captures again before accepting',()=>{
  const r=simulate(start('B-01','reshoot'));
  assert.deepEqual(r.state.attempts.map(a=>a.status),['rejected','approved']);assert.equal(r.actions.filter(x=>x==='CAPTURE').length,2);
  assert.ok(r.actions.indexOf('REJECT_REPORT')<r.actions.lastIndexOf('CAPTURE'));
});
test('Pause freezes positions and work progress; x2 advances same work in half the time',()=>{
  const d=createPharmacyDirector();let s=start();const pose=structuredClone(d.update(s,1).actors);
  s=reduce(s,{type:'AUTO_CONFIG',paused:true});const before=structuredClone(d.update(s,0));
  for(let i=0;i<20;i++)assert.equal(d.update(s,.2).command,null);
  const after=d.update(s,0);assert.deepEqual(after.actors,before.actors);assert.deepEqual(after.actors,pose);assert.equal(after.view.progress,before.view.progress);
  s=reduce(s,{type:'AUTO_CONFIG',paused:false});assert.notEqual(d.update(s,.5).view.phase,'paused');
  const normal=simulate(start()),fastState=reduce(start(),{type:'AUTO_CONFIG',speed:2}),fast=simulate(fastState);
  assert.ok(Math.abs(normal.seconds/fast.seconds-2)<.08);
});
test('A command is emitted only once until acknowledged and stale commands cannot mutate reset/paused/manual state',()=>{
  const d=createPharmacyDirector();let s=start(),command;
  for(let i=0;i<400&&!command;i++)command=d.update(s,.1).command;
  assert.ok(command);assert.equal(d.update(s,1).command,null);assert.equal(d.update(s,1).command,null);
  for(const e of [{type:'RESET'},{type:'AUTO_CONFIG',paused:true},{type:'AUTO_CONFIG',mode:'manual'}]){
    const changed=reduce(s,e);assert.equal(reduce(changed,command),changed);
  }
  const approved=commit(s,command);assert.equal(reduce(approved,command),approved);
});
test('Manual takeover can perform a step then return to bots without duplicate approval; director survives leaving the room',()=>{
  let s=start();const d=createPharmacyDirector();d.update(s,1);
  s=reduce(s,{type:'AUTO_CONFIG',mode:'manual'});assert.equal(s.role,'admin');assert.equal(d.update(s,1).active,false);
  s=reduce(s,{type:'APPROVE_REQUEST',now});s=reduce(s,{type:'AUTO_CONFIG',mode:'auto',paused:false});
  const saved=structuredClone(d.actors); // No ticks while the scene is unmounted.
  assert.deepEqual(d.actors,saved);
  const result=simulate(s,d);assert.equal(result.state.events.filter(e=>e.text.includes('Администратор согласовал')).length,1);
  const reset=reduce(result.state,{type:'RESET'});const r=d.update(reset,0);assert.equal(r.view.phase,'idle');
  assert.deepEqual(r.actors.map(a=>[a.x,a.z]),PHARMACY_BOTS.map(a=>[a.x,a.z]));assert.ok(r.actors.every(a=>!a.carrying));
});
