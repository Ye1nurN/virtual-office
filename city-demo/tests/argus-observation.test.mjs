import test from 'node:test';
import assert from 'node:assert/strict';
import {createExperiment,experimentReducer as reduce,experimentReport,METERS,ROWS} from '../src/argus/experiment.js';
import {LAB_BOUNDS,LAB_OBSTACLES,LAB_SPAWN,LAB_SPOTS} from '../src/argus/layout.js';
import {createNavigation} from '../src/movement.js';
const choose=(id)=>reduce(createExperiment(),{type:'SELECT',id});
test('a repeat needs two matching messages; wrong and partial selections stay investigable',()=>{
 let s=choose('031');
 s=reduce(s,{type:'CHECK'});assert.equal(s.feedback.kind,'error');assert.equal(s.complete,false);
 s=reduce(s,{type:'ROW',id:'a'});s=reduce(s,{type:'ROW',id:'b'});s=reduce(s,{type:'CHECK'});
 assert.equal(s.complete,false);assert.equal(s.feedback.kind,'error');
 s=reduce(s,{type:'ROW',id:'b'});s=reduce(s,{type:'ROW',id:'c'});s=reduce(s,{type:'CHECK'});
 assert.equal(s.complete,true);assert.equal(s.panel,'result');
 const report=experimentReport(s);assert.equal(report.node,'meter-031');assert.equal(report.evidence.length,2);
 assert.equal(report.modelExecuted,false);assert.equal(report.networkConnected,false);
});
test('normal meters never turn into confirmed replay, and choosing another node clears prior evidence',()=>{
 for(const meter of METERS.filter(m=>!m.suspect)){
  let s=choose(meter.id);s=reduce(s,{type:'CHECK'});assert.equal(s.complete,false);assert.equal(s.feedback.kind,'normal');assert.ok(s.checked.includes(meter.id));
  s=reduce(s,{type:'ROW',id:ROWS[meter.id][0].id});s=reduce(s,{type:'SELECT',id:'031'});assert.deepEqual(s.rows,[]);assert.equal(s.feedback,null);
 }
});
test('unknown nodes and messages cannot corrupt evidence; reset drops an old result',()=>{
 let s=choose('031');assert.deepEqual(reduce(s,{type:'SELECT',id:'private-node'}),s);
 assert.deepEqual(reduce(s,{type:'ROW',id:'missing'}),s);
 for(const id of ['a','b','c'])s=reduce(s,{type:'ROW',id});assert.deepEqual(s.rows,['b','c']);
 assert.deepEqual(reduce(s,{type:'RESET'}),createExperiment());assert.equal(experimentReport(createExperiment()),null);
});
test('panel close and pause preserve an investigation',()=>{
 let s=choose('031');s=reduce(s,{type:'ROW',id:'a'});s=reduce(s,{type:'PAUSE'});s=reduce(s,{type:'CLOSE'});
 assert.equal(s.paused,true);assert.equal(s.selected,'031');assert.deepEqual(s.rows,['a']);assert.equal(s.panel,null);
});
test('console, helper and exit have clear reachable approaches; props block passage',()=>{
 const nav=createNavigation(LAB_OBSTACLES,LAB_BOUNDS);assert.equal(nav.blocked(LAB_SPAWN.x,LAB_SPAWN.z),false);
 for(const spot of Object.values(LAB_SPOTS)){assert.equal(nav.blocked(spot.x,spot.z),false,spot.title);const route=nav.findPath(LAB_SPAWN,spot);assert.ok(route.length,spot.title);let p=LAB_SPAWN;for(const next of route){assert.ok(nav.clearSegment(p,next),spot.title);p=next;}}
 assert.equal(nav.blocked(0,-.25),true);assert.equal(nav.blocked(-7,-.9),true);assert.equal(nav.blocked(0,7),false);
});

test('confirmed evidence remains intact when another device is inspected',()=>{
 let s=choose('031');for(const id of ['a','c'])s=reduce(s,{type:'ROW',id});s=reduce(s,{type:'CHECK'});const original=experimentReport(s);
 s=reduce(s,{type:'SELECT',id:'014'});assert.deepEqual(experimentReport(s),original);s=reduce(s,{type:'RESET'});assert.equal(experimentReport(s),null);
});
