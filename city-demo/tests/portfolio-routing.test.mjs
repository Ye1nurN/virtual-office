import test from 'node:test';
import assert from 'node:assert/strict';
import {CASES, readPortfolioRoute, portfolioUrl} from '../src/portfolio/content.js';

test('Portfolio deep links round-trip every project in either presentation', () => {
  for (const project of CASES) for (const mode of ['city','resume']) {
    const url=portfolioUrl('https://portfolio.example/?place=office&utm_source=cv', {mode,project:project.id});
    assert.deepEqual(readPortfolioRoute(url.href), {mode,project:project.id});
    assert.equal(url.searchParams.get('place'), null);
    assert.equal(url.searchParams.get('utm_source'), 'cv');
  }
});
test('Mobile defaults to resume while explicit city links remain walkable', () => {
  assert.equal(readPortfolioRoute('https://portfolio.example/',true).mode,'resume');
  assert.equal(readPortfolioRoute('https://portfolio.example/',false).mode,'city');
  assert.equal(readPortfolioRoute('https://portfolio.example/?view=city',true).mode,'city');
});
test('Invalid projects never become a modal or an external navigation target', () => {
  for (const id of ['missing','https://other.example/','<script>']) {
    const url=portfolioUrl('https://portfolio.example/',{mode:'resume',project:id});
    assert.equal(url.origin,'https://portfolio.example');
    assert.equal(readPortfolioRoute(url.href).project,null);
    assert.equal(readPortfolioRoute('https://portfolio.example/?project='+encodeURIComponent(id)).project,null);
  }
});
