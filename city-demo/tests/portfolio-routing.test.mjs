import test from 'node:test';
import assert from 'node:assert/strict';
import {CASES, readPortfolioRoute, portfolioUrl} from '../src/portfolio/content.js';

test('Portfolio deep links round-trip every project in either presentation', () => {
  for (const project of CASES) for (const mode of ['home','city','resume','collection']) {
    const url=portfolioUrl('https://portfolio.example/?place=office&utm_source=cv', {mode,project:project.id});
    assert.deepEqual(readPortfolioRoute(url.href), {mode,project:project.id});
    assert.equal(url.searchParams.get('place'), null);
    assert.equal(url.searchParams.get('utm_source'), 'cv');
  }
});
test('Home is the default on all screens while explicit city and resume links remain available', () => {
  assert.equal(readPortfolioRoute('https://portfolio.example/',true).mode,'home');
  assert.equal(readPortfolioRoute('https://portfolio.example/',false).mode,'home');
  assert.equal(readPortfolioRoute('https://portfolio.example/?view=city',true).mode,'city');
  assert.equal(readPortfolioRoute('https://portfolio.example/?view=resume').mode,'resume');
  assert.equal(readPortfolioRoute('https://portfolio.example/?view=unknown').mode,'home');
});

test('Returning home clears collection and interior state without dropping campaign parameters', () => {
  const url=portfolioUrl('https://portfolio.example/?view=collection&item=argus&place=office&project=argus&utm_source=cv#pf-about',{mode:'home'});
  assert.deepEqual(readPortfolioRoute(url),{mode:'home',project:null});
  assert.equal(url.searchParams.get('item'),null);
  assert.equal(url.searchParams.get('place'),null);
  assert.equal(url.searchParams.get('utm_source'),'cv');
  assert.equal(url.hash,'');
});
test('Invalid projects never become a modal or an external navigation target', () => {
  for (const id of ['missing','https://other.example/','<script>']) {
    const url=portfolioUrl('https://portfolio.example/',{mode:'resume',project:id});
    assert.equal(url.origin,'https://portfolio.example');
    assert.equal(readPortfolioRoute(url.href).project,null);
    assert.equal(readPortfolioRoute('https://portfolio.example/?project='+encodeURIComponent(id)).project,null);
  }
});

test('Leaving an interior opens a valid resume section and clears the building route', () => {
  for (const place of CASES.map(p=>p.id)) for (const section of ['projects','experience','skills','about','contact']) {
    const url=portfolioUrl(`https://portfolio.example/?place=${place}&project=office#old`,{mode:'resume',section});
    assert.equal(url.searchParams.get('place'),null);
    assert.equal(url.searchParams.get('project'),null);
    assert.equal(url.hash,'#pf-'+section);
    assert.equal(readPortfolioRoute(url.href).mode,'resume');
  }
  assert.equal(portfolioUrl('https://portfolio.example/#pf-skills',{mode:'city'}).hash,'');
  assert.equal(portfolioUrl('https://portfolio.example/',{mode:'resume',section:'unknown'}).hash,'');
});
