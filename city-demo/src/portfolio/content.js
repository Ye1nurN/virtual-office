import {PROJECTS} from '../city/catalog.js';
import {RESUME_PROFILE, RESUME_STORIES} from './resume.js';

// Public portfolio copy lives here, independently of scene geometry.
// Only author-provided roles, education and project facts are published.
export const PROFILE = {
  name: 'Елнур',
  ...RESUME_PROFILE,
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
  tynysh: {
    number: '05', category: 'Full-stack · B2B SaaS', title: 'Tynysh',
    stack: ['Next.js', 'React', 'TypeScript', 'NestJS', 'PostgreSQL', 'Drizzle ORM'],
    lead: 'Управление банкетным залом — от бронирования до работы команды и финансов.',
    problem: 'Как объединить расписание залов, подготовку мероприятий, задачи сотрудников и финансовый учёт в одной системе?',
    built: [
      'Календарь бронирований, карточки клиентов и мероприятий, проверка доступности залов.',
      'Редактор планов залов и рассадки, меню и шаблоны мероприятий.',
      'Задачи, назначения сотрудников и личный экран рабочего дня.',
      'Учёт доходов, расходов и выплат сотрудникам, аналитика и выгрузка отчётов.',
      'Роли владельца, администратора и сотрудника, одноразовые приглашения и журнал действий.',
      'REST API на NestJS/Fastify, изоляция организаций через PostgreSQL RLS и ограничения БД против пересекающихся бронирований и назначений.',
    ],
    scope: 'B2B-приложение для управления банкетными залами и подготовкой мероприятий.',
    takeaway: 'Full-stack-приложение: интерфейсы на Next.js, API на NestJS и бизнес-правила в PostgreSQL — от бронирования до управления командой и финансового учёта.',
  },
};

export const CASES = ['autofix','pharmacy','argus','office','tynysh'].map(id => {
  const cityProject = PROJECTS.find(p=>p.id===id);
  return {...cityProject, ...stories[id], ...RESUME_STORIES[id], id, hasCityDemo:Boolean(cityProject)};
});
export const SKILLS = [
  {
    "title": "Frontend",
    "description": "React · JavaScript · TypeScript · адаптивная вёрстка · локализация · Next.js",
    "projects": [
      "pharmacy",
      "autofix",
      "tynysh"
    ]
  },
  {
    "title": "API и backend",
    "description": "Python · FastAPI · REST API · WebSocket · интеграция с Supabase · NestJS · Fastify · Drizzle ORM",
    "projects": [
      "argus",
      "pharmacy",
      "autofix",
      "tynysh"
    ]
  },
  {
    "title": "Данные",
    "description": "PostgreSQL · SQLite · проектирование схем · нормализация и импорт данных",
    "projects": [
      "pharmacy",
      "argus",
      "tynysh"
    ]
  },
  {
    "title": "Бизнес-логика",
    "description": "Бронирования · проверка пересечений · временные резервы · жизненный цикл заявок · RBAC · расписания · задачи · финансовый учёт",
    "projects": [
      "pharmacy",
      "tynysh"
    ]
  },
  {
    "title": "Визуализация",
    "description": "Recharts · интерактивные карты · аналитические панели · фильтрация и экспорт отчётов",
    "projects": [
      "autofix",
      "pharmacy"
    ]
  },
  {
    "title": "Машинное обучение",
    "description": "TensorFlow/Keras · CNN–LSTM · подготовка и масштабирование признаков · обучение и оценка классификаторов",
    "projects": [
      "argus"
    ]
  },
  {
    "title": "Инфраструктура",
    "description": "Linux/Ubuntu · Docker · Docker Compose · Nginx · reverse proxy",
    "projects": [
      "pharmacy",
      "argus"
    ]
  },
  {
    "title": "3D в браузере",
    "description": "Three.js · GLB-модели · управление персонажем и камерой · взаимодействия со сценой",
    "projects": [
      "office"
    ]
  },
  {
    "title": "Безопасность",
    "description": "Контроль доступа · обнаружение вторжений · CTF: криптография, цифровая криминалистика и веб-безопасность",
    "projects": [
      "pharmacy",
      "argus"
    ],
    "achievement": "BRICS 2024"
  }
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
