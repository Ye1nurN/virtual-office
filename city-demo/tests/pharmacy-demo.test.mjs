import test from 'node:test';
import assert from 'node:assert/strict';
import {createPharmacyDemo,transitionPharmacyDemo as step,campaignStep,availableReport,demoMonths,pharmacyDemoReducer} from '../src/city/pharmacyDemo.js';
import {shelfDisplayTransform} from '../src/city/pharmacyCampaignDisplay.js';

const now=new Date(2026,8,28,12).getTime(),image='data:image/jpeg;base64,dGVzdA==';
const apply=(s,type,extra={})=>step(s,{type,now,...extra});
const role=(s,role)=>apply(s,'ROLE',{role});
function requested(portion='whole'){return apply(createPharmacyDemo(),'REQUEST',{campaign:'Забота',shelf:'A-02',portion,month:'2026-10'});}
function installed(){let s=apply(role(requested(),'admin'),'APPROVE_REQUEST');s=apply(role(s,'manager'),'CREATE_TASK');return apply(role(s,'staff'),'INSTALL');}
function submitted(){return apply(apply(installed(),'CAPTURE',{image}),'SUBMIT_REPORT');}

test('Campaign follows request → task → placement → reviewed report without conflating statuses',()=>{
  let s=requested('left');assert.equal(s.request.price,12500);assert.equal(campaignStep(s),1);assert.equal(s.task,null);
  s=apply(role(s,'admin'),'APPROVE_REQUEST');assert.equal(s.request.status,'approved');assert.equal(campaignStep(s),2);
  s=apply(role(s,'manager'),'CREATE_TASK');assert.equal(s.task.status,'open');assert.equal(campaignStep(s),3);
  s=apply(role(s,'staff'),'INSTALL');assert.equal(s.installed,true);assert.equal(s.task.status,'in_progress');assert.equal(campaignStep(s),4);
  s=apply(apply(s,'CAPTURE',{image}),'SUBMIT_REPORT');assert.equal(campaignStep(s),5);assert.equal(s.task.status,'in_progress');
  s=apply(role(s,'reviewer'),'APPROVE_REPORT');assert.equal(campaignStep(s),6);assert.equal(s.request.status,'approved');assert.equal(s.task.status,'done');
  s=role(s,'advertiser');assert.equal(availableReport(s).image,image);assert.equal(s.attempts[0].status,'approved');assert.equal(s.events.length,7);
});
test('Role and lifecycle guards prevent skipped approvals, double tasks and empty reports',()=>{
  assert.throws(()=>apply(requested(),'APPROVE_REQUEST'),/роль/);
  assert.throws(()=>apply(role(requested(),'manager'),'CREATE_TASK'),/после согласования/);
  assert.throws(()=>apply(role(requested(),'staff'),'INSTALL'),/получить задание/);
  assert.throws(()=>apply(installed(),'SUBMIT_REPORT'),/снимок/);
  assert.throws(()=>apply(role(installed(),'manager'),'CREATE_TASK'),/один раз/);
  assert.throws(()=>apply(role(installed(),'reviewer'),'APPROVE_REPORT'),/отправить/);
  assert.throws(()=>apply(role(submitted(),'reviewer'),'REJECT_REPORT',{reason:' '}),/причину/);
});
test('Reshoot keeps old attempt, requires a new photo and only publishes the accepted report',()=>{
  let s=submitted();assert.equal(availableReport(role(s,'advertiser')),null);
  s=apply(role(s,'reviewer'),'REJECT_REPORT',{reason:'Нужен крупный план.'});
  assert.equal(s.report.status,'rejected');assert.equal(s.report.image,null);assert.equal(s.task.status,'in_progress');
  assert.equal(s.attempts[0].image,image);assert.equal(s.attempts[0].reason,'Нужен крупный план.');assert.equal(campaignStep(s),4);
  s=role(s,'staff');assert.throws(()=>apply(s,'SUBMIT_REPORT'),/снимок/);
  const nextImage='data:image/jpeg;base64,bmV3';s=apply(apply(s,'CAPTURE',{image:nextImage}),'SUBMIT_REPORT');
  assert.equal(s.attempts.length,2);assert.equal(availableReport(role(s,'advertiser')),null);
  s=apply(role(s,'reviewer'),'APPROVE_REPORT');assert.equal(s.attempts[0].status,'rejected');assert.equal(s.attempts[1].status,'approved');assert.equal(availableReport(role(s,'advertiser')).image,nextImage);
  assert.throws(()=>apply(s,'APPROVE_REPORT'),/отправить/);
});
test('Bad input has no partial effects; reset clears images, events and reservations',()=>{
  const s=createPharmacyDemo(),invalid=pharmacyDemoReducer(s,{type:'REQUEST',now,shelf:'bogus'});
  assert.ok(invalid.error);assert.equal(invalid.request,null);assert.deepEqual(invalid.events,[]);
  assert.throws(()=>apply(s,'REQUEST',{campaign:'x',shelf:'A-01',portion:'whole',month:'2026-08'}),/месяцев/);
  assert.throws(()=>apply(installed(),'CAPTURE',{image:'https://example.com/photo.jpg'}),/снимок/);
  const cleared=apply(submitted(),'RESET'),empty=createPharmacyDemo();empty.automation.generation=1;assert.deepEqual(cleared,empty);
});
test('Month choices roll over the year and partial slots fit inside the same fixture',()=>{
  assert.deepEqual(demoMonths(new Date(2026,11,31)),['2027-01','2027-02','2027-03']);
  for(const id of ['A-01','A-02','B-01']){
    const all=shelfDisplayTransform(id),left=shelfDisplayTransform(id,'left'),right=shelfDisplayTransform(id,'right');
    assert.equal(left.width,all.width/2);assert.equal(right.width,all.width/2);
    assert.ok(Math.abs((left.x+right.x)/2-all.x)<1e-10);assert.ok(Math.abs((left.z+right.z)/2-all.z)<1e-10);
    assert.ok(Math.abs(Math.hypot(left.x-right.x,left.z-right.z)-all.width/2)<1e-10);
  }
  assert.equal(shelfDisplayTransform('missing'),null);
});
