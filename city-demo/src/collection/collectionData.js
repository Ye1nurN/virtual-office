import {CASES} from '../portfolio/content.js';

// Presentation copy only. Geometry and full case facts remain in their shared catalogues.
const presentation = {
  pharmacy: {label:'CRM', plaque:'CRM рекламных размещений', title:'CRM рекламных размещений', eyebrow:'Full-stack · Лето 2026', lead:'Платформа бронирования рекламных мест в аптечных сетях.', contribution:['Архитектура и REST API','Роли, бронирования и PostgreSQL','Развёртывание на Ubuntu'], stack:['React','Python','PostgreSQL']},
  autofix: {label:'Uniqs Detailing', plaque:'Uniqs Detailing', title:'Uniqs Detailing', eyebrow:'Командный проект · 2025–2026', lead:'От записи на детейлинг до аналитики загрузки боксов.', contribution:['Интерфейсы и интеграция с Supabase','Аналитика и административные экраны','Адаптивность и локализация'], stack:['React','TypeScript','Supabase']},
  argus: {label:'ARGUS-AMI', plaque:'ARGUS-AMI', title:'ARGUS-AMI', eyebrow:'Дипломная работа · 2025–2026', lead:'Исследование обнаружения сетевых атак с помощью CNN–LSTM.', contribution:['Подготовка синтетических данных','Модель классификации и FastAPI','Панель событий и Docker Compose'], stack:['Python','TensorFlow','FastAPI']},
  office: {label:'Виртуальный офис', plaque:'Виртуальный офис', title:'Виртуальный офис', eyebrow:'Интерактивный веб · 3D', lead:'Рабочее пространство, которое можно исследовать прямо в браузере.', contribution:['Четыре этажа и переходы между ними','Персонаж, камера и взаимодействия','GLB-модели и React-интерфейс'], stack:['React','Three.js','GLB']},
  tynysh: {label:'Tynysh', plaque:'Tynysh', title:'Tynysh', eyebrow:'Full-stack · B2B SaaS', lead:'Управление банкетным залом — от бронирования до работы команды.', contribution:['Календарь, клиенты и мероприятия','Задачи сотрудников и финансовый учёт','Роли и изоляция организаций'], stack:['Next.js','NestJS','PostgreSQL']},
};

export const COLLECTION = ['pharmacy','autofix','argus','office','tynysh'].map(id=>({...CASES.find(p=>p.id===id),...presentation[id]}));
export function readCollectionItem(href) {
  const id=new URL(href).searchParams.get('item');
  return id==='all'?null:COLLECTION.some(p=>p.id===id)?id:'pharmacy';
}
export function collectionItemUrl(href,id) {
  const url=new URL(href);
  url.searchParams.set('view','collection');
  url.searchParams.set('item',id===null?'all':COLLECTION.some(p=>p.id===id)?id:'pharmacy');
  url.searchParams.delete('place');url.searchParams.delete('project');url.hash='';
  return url;
}
