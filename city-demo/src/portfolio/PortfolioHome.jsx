import React from 'react';
import {ArrowRight, ArrowUpRight, Code, EnvelopeSimple, FolderSimple, GraduationCap, PaperPlaneTilt, Trophy} from '@phosphor-icons/react';
import {CASES, PROFILE} from './content.js';
import {ACHIEVEMENTS, EDUCATION} from './resume.js';
import {GalleryHeader} from './GalleryHeader.jsx';

const educationLabels={iitu:['МУИТ','2021–2026'],kyungdong:['Kyungdong','2023'],hof:['Hof University','2024–2025']};
const educationOrder=['iitu','kyungdong','hof'];
const tools=[['Frontend',['React · TypeScript','Next.js']],['Backend',['Python · FastAPI','NestJS']],['Данные',['PostgreSQL','Docker · Linux']]];
function IconTile({children}){return <span className="home-icon" aria-hidden="true">{children}</span>;}

export default function PortfolioHome({onMode,onSection}) {
  const award=ACHIEVEMENTS[0];
  return <div className="home-scroll">
    <GalleryHeader mode="home" onMode={onMode}/>
    <main id="pf-main" className="home-main" tabIndex={-1}>
      <div className="home-grid">
        <section className="home-card home-intro" aria-labelledby="home-name">
          <div className="home-identity"><span className="home-monogram" aria-hidden="true">Е.</span><div><h1 id="home-name">{PROFILE.name}</h1><p className="home-role">{PROFILE.title}</p></div></div>
          <p className="home-bio">{PROFILE.shortIntro}</p>
          <p className="home-stack">{PROFILE.stack}</p>
          <div className="home-links"><button onClick={()=>onSection('about')}>Подробнее обо мне<ArrowUpRight size={23}/></button><a href={PROFILE.github} target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={23}/></a></div>
        </section>
        <section className="home-card home-projects" aria-labelledby="home-projects-title">
          <div className="home-section-heading"><IconTile><FolderSimple size={40}/></IconTile><div><h2 id="home-projects-title">Проекты</h2><p>Кейсы, мой вклад и интерактивные демонстрации.</p></div></div>
          <div className="home-project-count"><strong>{String(CASES.length).padStart(2,'0')}</strong><span>проектов</span></div>
          <button className="home-project-link" onClick={()=>onMode('collection')}>Перейти к проектам<ArrowRight size={25}/></button>
        </section>
        <section className="home-card home-skills" aria-labelledby="home-skills-title">
          <div className="home-section-heading"><IconTile><Code size={34}/></IconTile><h2 id="home-skills-title">С чем работаю</h2></div>
          <div className="home-tool-columns">{tools.map(([title,lines])=><div key={title}><h3>{title}</h3>{lines.map(line=><p key={line}>{line}</p>)}</div>)}</div>
        </section>
        <section className="home-card home-education" aria-labelledby="home-education-title">
          <div className="home-section-heading"><IconTile><GraduationCap size={35}/></IconTile><h2 id="home-education-title">Образование</h2></div>
          <ol>{educationOrder.map(id=>{const item=EDUCATION.find(e=>e.id===id);return <li key={id} title={item.institution}><span>{educationLabels[id][0]}</span><span>·</span><span>{educationLabels[id][1]}</span></li>;})}</ol>
          <button className="home-detail-link" onClick={()=>onSection('education')}>Подробнее<ArrowUpRight size={22}/></button>
        </section>
        <section className="home-card home-achievement" aria-labelledby="home-award-title">
          <IconTile><Trophy size={35}/></IconTile><div><h2 id="home-award-title">{award.result}</h2><p>{award.title}</p><span>{award.year} · CTF</span></div>
        </section>
        <section className="home-card home-contact" aria-labelledby="home-contact-title">
          <div className="home-section-heading"><IconTile><PaperPlaneTilt size={31} weight="fill"/></IconTile><div><h2 id="home-contact-title">Обсудим ваш проект?</h2><p>Интерфейс, API, база данных и развёртывание.</p></div></div>
          <div className="home-contact-links"><a className="home-contact-primary" href={PROFILE.telegram} target="_blank" rel="noreferrer">Написать в Telegram<ArrowUpRight size={24}/></a><a className="home-email" href={'mailto:'+PROFILE.email}><EnvelopeSimple size={26}/><span>{PROFILE.email}</span></a></div>
        </section>
      </div>
      <footer className="home-footer"><span>{PROFILE.name} · Портфолио проектов</span><button onClick={()=>onMode('resume')}>Полное резюме<ArrowUpRight size={16}/></button></footer>
    </main>
  </div>;
}
