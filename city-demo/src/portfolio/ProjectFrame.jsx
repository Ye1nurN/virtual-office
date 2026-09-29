import React, {useEffect} from 'react';
import {ArrowLeft, ArrowUpRight} from '@phosphor-icons/react';
import {PortfolioHeader} from './PortfolioHeader.jsx';
import {CASES, PROFILE} from './content.js';
import './portfolio.css';
import './project-frame.css';

export function ProjectFrame({projectId, onLeave, onPortfolio, children}) {
  const project=CASES.find(item=>item.id===projectId);
  useEffect(()=>{document.title=project.title+' — '+PROFILE.name;},[project.title]);
  return <div className={'project-frame project-frame-'+projectId}>
    <div className="pf-app project-chrome">
      <a className="pf-skip" href="#project-demo">Перейти к демонстрации</a>
      <PortfolioHeader onHome={()=>onPortfolio({mode:'resume'})} onMode={mode=>mode==='city'?onLeave():onPortfolio({mode})} onSection={section=>onPortfolio({mode:'resume',section})}/>
      <nav className="project-context" aria-label="Текущий проект">
        <button onClick={onLeave}><ArrowLeft size={17}/><span>В город</span></button>
        <span className="project-context-title">{project.title}</span>
        <span className="project-demo-badge">Демо</span>
        <button className="project-about" onClick={()=>onPortfolio({mode:'resume',project:projectId})}>О проекте<ArrowUpRight size={16}/></button>
      </nav>
    </div>
    <div id="project-demo" className="project-viewport" tabIndex={-1}>{children}</div>
  </div>;
}
