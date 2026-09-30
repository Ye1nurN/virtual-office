import React from 'react';
import {GraduationCap, Trophy} from '@phosphor-icons/react';
import {ACHIEVEMENTS, EDUCATION} from './resume.js';
import './resume.css';

export function ProfileHeading({profile}) {
  return <div className="pf-profile-heading"><p className="pf-role">{profile.title}</p><p className="pf-profile-stack">{profile.stack}</p></div>;
}

export function ProjectResults({project}) {
  if (!project.metrics?.length) return null;
  return <section className="pf-case-section pf-project-results">
    <h3>{project.id === 'argus' ? 'Модель и методика обучения' : 'Масштаб каталога'}</h3>
    <dl className="pf-metrics">{project.metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>
    <p className="pf-metric-note">{project.metricsNote}</p>
  </section>;
}

export function ResumeBackground() {
  return <div className="pf-background">
    <section aria-labelledby="pf-achievements-title" className="pf-achievements">
      <h3 id="pf-achievements-title"><Trophy size={23} weight="duotone"/>Достижения</h3>
      {ACHIEVEMENTS.map(item => <article key={item.id} className="pf-award">
        <div className="pf-award-result"><strong>{item.result}</strong><span>{item.year}</span></div>
        <div><h4>{item.title}</h4><p>{item.description}</p></div>
      </article>)}
    </section>
    <section aria-labelledby="pf-education-title" className="pf-education">
      <h3 id="pf-education-title"><GraduationCap size={24} weight="duotone"/>Образование</h3>
      <div className="pf-education-list">{EDUCATION.map(item => <article key={item.id}>
        <p className="pf-education-period">{item.period}</p>
        <h4>{item.institution}</h4><p className="pf-education-program">{item.program}</p>
        <p className="pf-education-location">{item.location}</p>
        {item.detail&&<p className="pf-education-detail">{item.detail}</p>}
      </article>)}</div>
    </section>
  </div>;
}
