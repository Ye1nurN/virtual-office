import {PROJECTS} from '../city/catalog.js';

// Public portfolio copy lives here, independently of scene geometry.
// Add a role, CV and direct contacts only after the author provides them.
export const PROFILE = {
  name: 'Елнур',
  title: 'Портфолио проектов',
  intro: 'Веб-приложения, интерактивные пространства и эксперименты с машинным обучением.',
  github: 'https://github.com/Ye1nurN',
  handle: 'Ye1nurN',
  email: null,
  telegram: null,
  resume: null,
};

const stories = {
  autofix: {
    number:'01', category:'Full-stack · командный проект', title:'AutoFix Hub',
    period:'Осень 2025 — весна 2026', periodNote:'Дипломная работа',
    lead:'Запись и управление детейлингом — от клиента до кабинета компании.',
    problem:'Как связать выбор услуги и удобного времени с расписанием боксов и ежедневной работой детейлинг-центра?',
    role:'Full-stack-разработчик. Участие в полном цикле разработки командного проекта YX-1.',
    contribution:['Разработка интерфейсов и бизнес-логики, интеграция с базой данных.', 'Аналитический кабинет: динамика записей, загрузка боксов, фильтрация и отчёты.', 'Административные интерфейсы с Supabase, адаптивная вёрстка и локализация.'],
    built:['Кабинеты клиента и компании, каталог услуг и запись с учётом расписания и боксов.', 'Переносы и отмены записей, realtime-чат и уведомления.', 'Аналитика, выгрузка отчётов и интерфейс на русском и казахском языках.'],
    demo:'Выберите автомобиль, услугу и время. Откройте кабинет компании, завершите запись и посмотрите, как меняется аналитика.',
    scope:'Командный дипломный проект. Опубликованный сервис — Uniqs Detailing. Город показывает отдельную локальную демонстрацию на учебных данных и не создаёт записи в сервисе. Репозиторий приватный.',
    takeaway:'Полный цикл разработки: интерфейсы и бизнес-логика, Supabase, аналитика, адаптивность и локализация.',
  },
  office: {
    number: '04', category: 'Интерактивный веб', title: 'Виртуальный офис',
    lead: 'Рабочее пространство, по которому можно пройтись.',
    problem: 'Как представить отделы, сотрудников и взаимодействия в одном понятном пространстве?',
    built: ['Четыре этажа с комнатами и переходами.', 'Движение персонажа, камера и взаимодействие с объектами.', 'Интерфейс команд, сотрудников и развития.'],
    demo: 'Пройдитесь по офису, смените этаж и откройте карточку отдела.',
    scope: 'Интерактивный прототип. Сотрудники и рабочие процессы представлены демонстрационными данными.',
    takeaway: '3D-сцена и обычный интерфейс работают вместе в браузере.',
  },
  pharmacy: {
    number: '02', category: 'Бизнес-приложение', title: 'Аптечная CRM',
    period: 'Лето 2026', periodNote: 'Разработка CRM аптечных сетей',
    lead: 'От выбора рекламной полки до согласованного размещения.',
    problem: 'Как организовать бронирование рекламных мест в аптеке и отслеживать согласование заявки?',
    built: ['Каталог рекламных мест с параметрами и стоимостью.', 'Сценарий заявки и согласования размещения.', 'Интерактивная демонстрация процесса в торговом зале.'],
    demo: 'Выберите полку и пройдите сценарий размещения через интерфейс аптеки.',
    scope: 'В городе работает локальная демонстрация. Она не отправляет заявки в исходную CRM и не принимает платежи.',
    takeaway: 'Бизнес-процесс можно изучить через последовательность действий.',
  },
  argus: {
    number: '03', category: 'Безопасность · ML', title: 'ARGUS',
    period: 'Осень 2025 — весна 2026', periodNote: 'Дипломная работа',
    lead: 'Исследование обнаружения атак в сетях умных счётчиков.',
    problem: 'Как отличить штатную телеметрию AMI-сети от подозрительных последовательностей событий?',
    built: ['Учебный проект с архитектурой CNN–LSTM.', 'API на FastAPI и интерфейс для работы с результатами.', 'Отдельный демонстрационный зал с синтетическими событиями.'],
    demo: 'Откройте лабораторию и изучите подготовленный сценарий сетевых событий.',
    scope: 'Дипломный проект. Город показывает сценарий на синтетических данных; модель ML в браузере не запускается.',
    takeaway: 'Исследование машинного обучения связано с прикладным интерфейсом.',
  },
};

export const CASES = ['autofix','pharmacy','argus','office'].map(id => ({...PROJECTS.find(p=>p.id===id), ...stories[id]}));
export const SKILLS = [
  {title:'Интерфейсы', description:'React · TypeScript · адаптивные интерфейсы · локализация', projects:['autofix','office','pharmacy']},
  {title:'3D в браузере', description:'Three.js · GLB · навигация и взаимодействия', projects:['office']},
  {title:'API и данные', description:'Supabase · PostgreSQL · Python · FastAPI', projects:['autofix','pharmacy','argus']},
  {title:'Бизнес-процессы и аналитика', description:'Бронирование · расписания · Recharts · отчёты', projects:['autofix','pharmacy']},
  {title:'Машинное обучение', description:'CNN–LSTM · анализ сетевых событий', projects:['argus']},
];

export function readPortfolioRoute(href, compact = false) {
  const url = new URL(href);
  const requested = url.searchParams.get('view');
  const mode = requested === 'resume' ? 'resume' : requested === 'city' ? 'city' : compact ? 'resume' : 'city';
  const id = url.searchParams.get('project');
  return {mode, project:CASES.some(p => p.id === id) ? id : null};
}

export function portfolioUrl(href, {mode, project = null, section = null}) {
  const url = new URL(href);
  url.searchParams.delete('place');
  url.searchParams.set('view', mode === 'resume' ? 'resume' : 'city');
  if (CASES.some(p => p.id === project)) url.searchParams.set('project', project);
  else url.searchParams.delete('project');
  url.hash=['projects','experience','skills','about','contact'].includes(section)?'pf-'+section:'';
  return url;
}
