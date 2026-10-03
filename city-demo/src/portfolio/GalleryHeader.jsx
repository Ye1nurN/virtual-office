import React from 'react';
import '@fontsource-variable/roboto/wght.css';
import {PaperPlaneTilt} from '@phosphor-icons/react';
import {PROFILE, portfolioUrl} from './content.js';

// Keep real links for new-tab, keyboard and browser navigation.
export function GalleryHeader({mode, onMode, onProjects}) {
  function navigate(event, next) {
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(next==='collection'&&onProjects)onProjects();
    else onMode(next);
  }
  const href=next=>{const url=portfolioUrl(window.location.href,{mode:next});if(next==='collection'&&onProjects)url.searchParams.set('item','all');return url.href;};
  return <header className="gallery-header">
    <a className="gallery-brand" href={href('home')} onClick={e=>navigate(e,'home')} aria-label="Елнур — главная"><span className="gallery-monogram" aria-hidden="true">Е.</span><strong>{PROFILE.name}</strong></a>
    <nav aria-label="Основная навигация">{[['home','Главная'],['collection','Проекты'],['city','Город']].map(([id,label])=><a key={id} href={href(id)} aria-current={mode===id?'page':undefined} onClick={e=>navigate(e,id)}>{label}</a>)}</nav>
    <a className="gallery-telegram" href={PROFILE.telegram} target="_blank" rel="noreferrer"><PaperPlaneTilt size={28} weight="fill"/><span>{PROFILE.telegramHandle}</span></a>
  </header>;
}
