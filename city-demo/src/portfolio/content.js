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
  office: {
    number: '01', category: 'Интерактивный веб', title: 'Виртуальный офис',
    lead: 'Рабочее пространство, по которому можно пройтись.',
    problem: 'Как представить отделы, сотрудников и взаимодействия в одном понятном пространстве?',
    built: ['Четыре этажа с комнатами и переходами.', 'Движение персонажа, камера и взаимодействие с объектами.', 'Интерфейс команд, сотрудников и развития.'],
    demo: 'Пройдитесь по офису, смените этаж и откройте карточку отдела.',
    scope: 'Интерактивный прототип. Сотрудники и рабочие процессы представлены демонстрационными данными.',
    takeaway: '3D-сцена и обычный интерфейс работают вместе в браузере.',
  },
  pharmacy: {
    number: '02', category: 'Бизнес-приложение', title: 'Аптечная CRM',
    lead: 'От выбора рекламной полки до согласованного размещения.',
    problem: 'Как организовать бронирование рекламных мест в аптеке и отслеживать согласование заявки?',
    built: ['Каталог рекламных мест с параметрами и стоимостью.', 'Сценарий заявки и согласования размещения.', 'Интерактивная демонстрация процесса в торговом зале.'],
    demo: 'Выберите полку и пройдите сценарий размещения через интерфейс аптеки.',
    scope: 'В городе работает локальная демонстрация. Она не отправляет заявки в исходную CRM и не принимает платежи.',
    takeaway: 'Бизнес-процесс можно изучить через последовательность действий.',
  },
  argus: {
    number: '03', category: 'Безопасность · ML', title: 'ARGUS',
    lead: 'Исследование обнаружения атак в сетях умных счётчиков.',
    problem: 'Как отличить штатную телеметрию AMI-сети от подозрительных последовательностей событий?',
    built: ['Учебный проект с архитектурой CNN–LSTM.', 'API на FastAPI и интерфейс для работы с результатами.', 'Отдельный демонстрационный зал с синтетическими событиями.'],
    demo: 'Откройте лабораторию и изучите подготовленный сценарий сетевых событий.',
    scope: 'Учебный проект. Город показывает сценарий на синтетических данных; модель ML в браузере не запускается.',
    takeaway: 'Исследование машинного обучения связано с прикладным интерфейсом.',
  },
};

export const CASES = PROJECTS.map(project => ({...project, ...stories[project.id]}));
export const SKILLS = [
  {title:'Интерфейсы', description:'React · интерактивные сценарии · состояние приложения', projects:['office','pharmacy']},
  {title:'3D в браузере', description:'Three.js · GLB · навигация и взаимодействия', projects:['office']},
  {title:'API и данные', description:'Python · FastAPI · PostgreSQL', projects:['pharmacy','argus']},
  {title:'Машинное обучение', description:'CNN–LSTM · анализ сетевых событий', projects:['argus']},
];

export function readPortfolioRoute(href, compact = false) {
  const url = new URL(href);
  const requested = url.searchParams.get('view');
  const mode = requested === 'resume' ? 'resume' : requested === 'city' ? 'city' : compact ? 'resume' : 'city';
  const id = url.searchParams.get('project');
  return {mode, project:CASES.some(p => p.id === id) ? id : null};
}

export function portfolioUrl(href, {mode, project = null}) {
  const url = new URL(href);
  url.searchParams.delete('place');
  url.searchParams.set('view', mode === 'resume' ? 'resume' : 'city');
  if (CASES.some(p => p.id === project)) url.searchParams.set('project', project);
  else url.searchParams.delete('project');
  return url;
}
