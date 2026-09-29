import test from 'node:test';
import assert from 'node:assert/strict';
import {createAutofixDemo,autofixReducer,autofixMetrics,availableAutofixSlots,AUTOFIX_SITE} from '../src/city/autofixDemo.js';
import {AUTOFIX_OBSTACLES,AUTOFIX_TERMINAL} from '../src/city/autofixLayout.js';
import {createNavigation} from '../src/movement.js';
import {INTERIOR_BOUNDS} from '../src/city/catalog.js';
import {CASES} from '../src/portfolio/content.js';
import {localReply} from '../src/guide/knowledge.js';
import {validatePayload} from '../server/guideHandler.mjs';

test('Booking is shared with company analytics; only completed work earns demo revenue',()=>{
  let state=createAutofixDemo();
  state=autofixReducer(state,{type:'book',car:'sedan',service:'wash',start:720});
  const id=state.lastCreated,booking=state.bookings.find(b=>b.id===id);
  assert.equal(booking.box,0,'second bay is occupied by the seeded polishing booking');
  assert.equal(autofixMetrics(state).total,3);assert.equal(autofixMetrics(state).revenue,12000);
  assert.equal(autofixReducer(state,{type:'status',id,status:'completed'}),state,'must start work before completion');
  state=autofixReducer(state,{type:'status',id,status:'in-progress'});
  state=autofixReducer(state,{type:'status',id,status:'completed'});
  assert.equal(autofixMetrics(state).revenue,24000);assert.equal(autofixMetrics(state).completed,2);
  assert.equal(autofixReducer(state,{type:'status',id,status:'cancelled'}),state,'completed work is terminal');
});

test('An overlapping booking cannot double-book the car; cancellation frees the slot',()=>{
  let state=createAutofixDemo();
  state=autofixReducer(state,{type:'book',car:'sedan',service:'polish',start:780});
  const id=state.lastCreated;
  assert.ok(!availableAutofixSlots(state,'wash','sedan').some(s=>s.start===840));
  const conflict=autofixReducer(state,{type:'book',car:'sedan',service:'wash',start:840});
  assert.equal(conflict.bookings.length,state.bookings.length);assert.ok(conflict.error);
  state=autofixReducer(state,{type:'status',id,status:'cancelled'});
  assert.ok(availableAutofixSlots(state,'wash','sedan').some(s=>s.start===840));
  assert.equal(autofixMetrics(state).cancelled,1);
});

test('Two bays enforce capacity, adjacent bookings fit, and services cannot run after closing',()=>{
  let state=createAutofixDemo();
  state=autofixReducer(state,{type:'book',car:'sedan',service:'wash',start:660});
  assert.ok(!availableAutofixSlots(state,'wash','suv').some(s=>s.start===660));
  assert.ok(availableAutofixSlots(state,'wash','sedan').some(s=>s.start===720));
  assert.ok(!availableAutofixSlots(state,'interior','suv').some(s=>s.start>900));
  for(const action of [{car:'invalid',service:'wash',start:840},{car:'sedan',service:'invalid',start:840},{car:'sedan',service:'wash',start:601}]){
    assert.equal(autofixReducer(state,{type:'book',...action}).bookings.length,state.bookings.length);
  }
  assert.deepEqual(autofixReducer(state,{type:'reset'}),createAutofixDemo());
});

test('Both bays remain solid while the desk and exit are reachable through the centre aisle',()=>{
  const nav=createNavigation(AUTOFIX_OBSTACLES,INTERIOR_BOUNDS),spawn={x:0,z:4.4};
  for(const target of [AUTOFIX_TERMINAL,{x:0,z:5.6}]){
    assert.equal(nav.blocked(target.x,target.z),false);const route=nav.findPath(spawn,target);assert.ok(route.length);
    let previous=spawn;for(const point of route){assert.ok(nav.clearSegment(previous,point));previous=point;}
  }
  for(const obstacle of AUTOFIX_OBSTACLES)assert.equal(nav.blocked(obstacle.x,obstacle.z),true);
});

test('The resume and guide expose the real site and distinguish the local scenario',()=>{
  assert.equal(CASES[0].id,'autofix');assert.equal(CASES[0].website,AUTOFIX_SITE);assert.equal(CASES[0].privateRepository,true);
  assert.match(CASES[0].scope,/локальную демонстрацию/);
  const reply=localReply('Покажи AutoFix Hub');assert.deepEqual(reply.sources,['autofix']);assert.match(reply.text,/учебных/);
  assert.deepEqual(validatePayload({message:'Что здесь?',context:{location:'autofix',project:'autofix'}}).context,{location:'autofix',project:'autofix'});
});
