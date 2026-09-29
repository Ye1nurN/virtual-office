import React from 'react';
import {ArrowUpRight, FileText, GithubLogo, MapTrifold} from '@phosphor-icons/react';
import {PROFILE} from './content.js';

export function PortfolioHeader({mode='city', activeSection, onHome, onMode, onSection}) {
  return <header className="pf-header">
    <button className="pf-brand" onClick={onHome} aria-label="Елнур — главная"><span className="pf-monogram">Е.</span><span><strong>{PROFILE.name}</strong><small>{PROFILE.title}</small></span></button>
    <div className="pf-mode-switch" role="group" aria-label="Представление портфолио"><button aria-pressed={mode==='city'} onClick={()=>onMode('city')}><MapTrifold size={17}/>Город</button><button aria-pressed={mode==='resume'} onClick={()=>onMode('resume')}><FileText size={17}/>Резюме</button></div>
    <nav className="pf-navigation" aria-label="Портфолио">{[['projects','Проекты'],['experience','Опыт'],['skills','Навыки'],['about','Обо мне']].map(([id,label])=><button key={id} className={activeSection===id?'is-active':''} onClick={()=>onSection(id)}>{label}</button>)}</nav>
    <div className="pf-header-actions"><a href={PROFILE.github} target="_blank" rel="noreferrer" className="pf-github" aria-label="GitHub"><GithubLogo size={21}/><span>GitHub</span><ArrowUpRight size={17}/></a><button className="pf-button pf-primary" onClick={()=>onSection('contact')}>Связаться<ArrowUpRight size={17}/></button></div>
  </header>;
}
