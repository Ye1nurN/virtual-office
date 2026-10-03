import test from 'node:test';
import assert from 'node:assert/strict';
import {COLLECTION,readCollectionItem,collectionItemUrl} from '../src/collection/collectionData.js';
import {portfolioUrl,readPortfolioRoute} from '../src/portfolio/content.js';
import {PROJECTS} from '../src/city/catalog.js';

test('Every souvenir is an existing city destination; selection and full case can share a URL',()=>{
  for(const p of COLLECTION){
    assert.ok(PROJECTS.some(building=>building.id===p.id));
    const selected=collectionItemUrl('https://example.com/?place=office&project=office&utm_source=cv#old',p.id);
    assert.equal(readCollectionItem(selected),p.id);
    assert.equal(selected.searchParams.get('place'),null);
    assert.equal(selected.searchParams.get('project'),null);
    assert.equal(selected.searchParams.get('utm_source'),'cv');
    const caseUrl=portfolioUrl(selected,{mode:'collection',project:p.id});
    assert.equal(readCollectionItem(caseUrl),p.id);
    assert.deepEqual(readPortfolioRoute(caseUrl),{mode:'collection',project:p.id});
    assert.equal(portfolioUrl(caseUrl,{mode:'resume'}).searchParams.get('item'),null);
  }
});
test('Collection overview, mobile deep links and invalid selections have explicit fallbacks',()=>{
  assert.equal(readCollectionItem(collectionItemUrl('https://example.com/',null)),null);
  assert.equal(readPortfolioRoute('https://example.com/?view=collection',true).mode,'collection');
  for(const item of ['', 'unknown','https://evil.example/'])assert.equal(readCollectionItem('https://example.com/?item='+encodeURIComponent(item)),'pharmacy');
});
