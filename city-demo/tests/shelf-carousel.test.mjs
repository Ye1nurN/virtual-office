import test from 'node:test';
import assert from 'node:assert/strict';
import {clampShelfStart,revealShelfItem,createShelfCarousel,SHELF_SPACING} from '../src/collection/shelfCarousel.js';
const ids=['pharmacy','autofix','argus','office','tynysh'];
function settle(motion){for(let i=0;i<240;i++)if(!motion.step(1/60))return;assert.fail('Shelf animation did not settle');}

test('Shelf windows stay full at both ends and grow to a larger catalogue',()=>{
  for(const total of [1,4,5,12,37])for(const count of [2,4])for(let start=-3;start<total+3;start++){
    const first=clampShelfStart(start,count,total);
    assert.ok(first>=0&&first<=Math.max(0,total-count));
    assert.equal(Math.min(count,total-first),Math.min(count,total));
  }
  assert.equal(revealShelfItem(0,4,4,5),1);
  assert.equal(revealShelfItem(3,0,2,5),0);
  assert.equal(revealShelfItem(0,4,2,5),3);
});

test('Selection moves the chosen model forwards and others backwards, then restores the layout',()=>{
  const shelf=createShelfCarousel(ids);shelf.update({start:0,count:4,selected:'argus'});settle(shelf);
  assert.equal(shelf.states.get('argus').scale,1.9);assert.equal(shelf.states.get('argus').z,3);
  assert.equal(shelf.states.get('office').scale,.7);assert.equal(shelf.states.get('office').z,-4);
  assert.ok(shelf.states.get('argus').x-shelf.states.get('autofix').x>SHELF_SPACING);
  shelf.update({start:0,count:4,selected:null});settle(shelf);
  for(const state of shelf.states.values()){assert.equal(state.scale,1);assert.equal(state.z,0);}
});

test('Rapid navigation and selection reversals settle into the last target without drift',()=>{
  const shelf=createShelfCarousel(ids);
  for(let i=0;i<20;i++){shelf.update({start:i%2,count:4,selected:ids[i%5]});shelf.step(1/60);}
  shelf.update({start:1,count:4,selected:'tynysh'});settle(shelf);
  assert.ok(shelf.states.get('tynysh').x>0&&shelf.states.get('tynysh').x<1.5*SHELF_SPACING);
  assert.equal(shelf.states.get('tynysh').scale,1.9);
  assert.equal(shelf.step(1/60),false);
});

test('A selection leaving the visible window resets; reduced motion jumps to the end state',()=>{
  const shelf=createShelfCarousel(ids);
  shelf.update({start:1,count:4,selected:'pharmacy'});
  assert.equal(shelf.step(0,true),false);
  for(const state of shelf.states.values()){assert.equal(state.scale,1);assert.equal(state.z,0);}
  shelf.update({start:3,count:2,selected:'tynysh'});shelf.step(0,true);
  assert.ok(shelf.states.get('tynysh').x>0&&shelf.states.get('tynysh').x<SHELF_SPACING/2);
  assert.equal(shelf.states.get('tynysh').scale,1.5);
});
