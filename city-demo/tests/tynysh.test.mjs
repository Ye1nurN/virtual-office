import test from 'node:test';
import assert from 'node:assert/strict';
import {createTynyshDemo,tynyshReducer,tynyshTotals,tableGuests} from '../src/city/tynyshDemo.js';
import {createTynyshDirector} from '../src/city/tynyshDirector.js';
import {TYNYSH_TABLES,TYNYSH_STAFF,TYNYSH_SPAWN,tynyshObstacles} from '../src/city/tynyshLayout.js';
import {INTERIOR_BOUNDS} from '../src/city/catalog.js';
import {createNavigation} from '../src/movement.js';
import {localReply} from '../src/guide/knowledge.js';

test('Banquet collision layout keeps every table service point reachable from the door and staff positions',()=>{
  const nav=createNavigation(tynyshObstacles(),INTERIOR_BOUNDS);
  for(const from of [TYNYSH_SPAWN,...TYNYSH_STAFF])for(const {approach:to} of TYNYSH_TABLES){
    assert.equal(nav.blocked(from.x,from.z),false);assert.equal(nav.blocked(to.x,to.z),false);
    let previous=from;const route=nav.findPath(from,to);assert.ok(route.length);
    for(const p of route){assert.ok(nav.clearSegment(previous,p));previous=p;}
  }
});
test('Conflicting or invalid booking cannot replace the active banquet; a valid booking resets tasks and finances',()=>{
  const start=createTynyshDemo();
  for(const date of ['2026-10-18','2026-02-30','invalid']){const next=tynyshReducer(start,{type:'BOOK',title:'Тестовый банкет',date,guests:48});assert.ok(next.error);assert.deepEqual(next.event,start.event);assert.deepEqual(next.payments,start.payments);}
  const next=tynyshReducer(start,{type:'BOOK',title:'Юбилей',date:'2026-10-19',guests:37});
  assert.equal(next.phase,'seating');assert.equal(next.tasks.filter(t=>t.done).length,0);assert.equal(next.payments.length,0);assert.equal(next.epoch,start.epoch+1);
  assert.equal(TYNYSH_TABLES.reduce((n,t)=>n+tableGuests(next,t.id),0),37);
  assert.equal(tynyshReducer(next,{type:'DONE',table:1,epoch:start.epoch,automatic:true}),next);
});
test('Guest and menu changes invalidate preparation and update the total; invalid payments are atomic',()=>{
  let s=createTynyshDemo();s=tynyshReducer(s,{type:'GUESTS',guests:36});s=tynyshReducer(s,{type:'MENU',menu:'festive'});
  assert.equal(tynyshTotals(s).total,36*19000);assert.ok(s.tasks.every(t=>!t.done));assert.equal(s.phase,'seating');
  const paid=tynyshReducer(s,{type:'PAYMENT',kind:'income',amount:100000,label:'Доплата'});assert.equal(tynyshTotals(paid).income,250000);
  for(const amount of [-1,1.5,Infinity,9999999]){const fail=tynyshReducer(paid,{type:'PAYMENT',kind:'income',amount,label:'Проверка'});assert.ok(fail.error);assert.deepEqual(fail.payments,paid.payments);}
});
test('Employee role can complete only assigned tasks and cannot change bookings or money',()=>{
  const start=tynyshReducer(createTynyshDemo(),{type:'ROLE',role:'staff'});
  for(const a of [{type:'PAYMENT',kind:'income',amount:1,label:'x'},{type:'GUESTS',guests:36},{type:'BOOK',title:'x',date:'2026-10-19',guests:6},{type:'DONE',table:4}]){const next=tynyshReducer(start,a);assert.ok(next.error);assert.deepEqual(next.event,start.event);assert.deepEqual(next.tasks,start.tasks);assert.deepEqual(next.payments,start.payments);}
  const next=tynyshReducer(start,{type:'DONE',table:3});assert.ok(next.tasks.find(t=>t.table===3).done);
});
test('A cheaper menu after payment produces a credit instead of a negative amount due',()=>{
  let s=tynyshReducer(createTynyshDemo(),{type:'BOOK',title:'Ужин',date:'2026-10-19',guests:6});
  s=tynyshReducer(s,{type:'MENU',menu:'festive'});s=tynyshReducer(s,{type:'PAYMENT',kind:'income',amount:114000,label:'Полная оплата'});
  s=tynyshReducer(s,{type:'MENU',menu:'classic'});assert.equal(tynyshTotals(s).balance,0);assert.equal(tynyshTotals(s).overpaid,24000);
});
test('The staff simulation respects pause, walks around furniture, finishes once, and restarts after reset',()=>{
  const director=createTynyshDirector(),nav=createNavigation(tynyshObstacles(),INTERIOR_BOUNDS);let s=createTynyshDemo();
  s=tynyshReducer(s,{type:'CONTROL',paused:true});const before=director.update(s,.05);
  for(let i=0;i<20;i++)assert.deepEqual(director.update(s,.1).actors.map(a=>[a.x,a.z]),before.actors.map(a=>[a.x,a.z]));
  s=tynyshReducer(s,{type:'CONTROL',paused:false,speed:2});let commands=0;
  for(let i=0;i<1500&&s.phase!=='ready';i++){
    const r=director.update(s,.05);for(const a of r.actors)assert.equal(nav.blocked(a.x,a.z),false,a.name+' stays on a free path');
    if(r.command){const table=TYNYSH_TABLES.find(t=>t.id===r.command.table),actor=r.actors.find(a=>a.table===table.id);assert.ok(Math.hypot(actor.x-table.approach.x,actor.z-table.approach.z)<.1);s=tynyshReducer(s,r.command);commands++;}
  }
  assert.equal(s.phase,'ready');assert.equal(commands,4);assert.equal(director.update(s,.1).command,null);
  s=tynyshReducer(s,{type:'RESET'});const reset=director.update(s,0);assert.equal(reset.actors[0].x,TYNYSH_STAFF[0].x);assert.equal(s.tasks.filter(t=>t.done).length,2);
});
test('Guide recognises the banquet project and explains the available demo',()=>{
  const reply=localReply('Покажи банкетный зал');assert.deepEqual(reply.sources,['tynysh']);assert.match(reply.text,/рассадк/);assert.ok(reply.actions.some(a=>a.type==='enter'&&a.project==='tynysh'));assert.doesNotMatch(reply.text,/локальн|домен|tynysh\.kz/i);
  assert.deepEqual(localReply('Покажи зал аптеки').sources,['pharmacy']);
});
