import {PROJECTS} from '../city/catalog.js';

export const GUIDE_POSITION={x:-4.5,z:4.5};
export const GUIDE_NAME='Гид';
export const GUIDE_FACTS={
  author:{name:'Елнур',github:'https://github.com/Ye1nurN',bio:'Автор города проектов. Подтверждённые сведения об образовании, местах работы, стаже и контактах пока не добавлены.'},
  projects:PROJECTS.map(({id,name,description,stack,github})=>({id,name,description,stack,github:github||null,
    scope:id==='pharmacy'?'В городе работает локальная демонстрация рекламного размещения. Реальные бронирования, платежи и сервер исходной CRM не подключены.':id==='argus'?'Учебный проект. Город показывает синтетические события; реальная сеть и inference модели не подключены.':'В браузере доступен четырёхэтажный 3D-офис. Реальные сотрудники, голосовая связь и многопользовательский сервер не подключены.',
    try:id==='pharmacy'?'Войдите, выберите рекламную полку и откройте карточку размещения. Затем пройдите доступные этапы демонстрационной заявки.':id==='argus'?'Войдите в ARGUS и откройте мониторинг. Изучите доступный учебный сценарий сетевых событий.':'Войдите в офис, попробуйте движение и переключение этажей, подойдите к интерактивным объектам.',
  })),
};
export const projectFacts=id=>GUIDE_FACTS.projects.find(p=>p.id===id);
export const INTRO='Привет! Я гид по городу проектов Елнура. Помогу выбрать, что посмотреть, объясню технологии и подскажу, с чего начать. Что тебе интересно?';
export const STARTERS=['Покажи самое интересное','Хочу посмотреть backend','Расскажи об авторе','Как устроен этот город?'];
export const actionLabel=a=>a.type==='walk'?'Гид, покажи дорогу':a.type==='enter'?'Войти в '+(projectFacts(a.project)?.name||'проект'):a.type==='project'?'Подробнее о проекте':a.type==='tour'?'Начать экскурсию':'Об авторе';
export function validAction(a){return !!a&&(['walk','enter','project'].includes(a.type)?!!projectFacts(a.project):['about','tour'].includes(a.type)&&a.project===null);}
export function cleanReply(value){
  if(!value||typeof value.text!=='string'||!value.text.trim())return null;
  const seen=new Set();
  const actions=(Array.isArray(value.actions)?value.actions:[]).filter(a=>{const key=a?.type+'/'+a?.project;if(!validAction(a)||seen.has(key))return false;seen.add(key);return true;}).slice(0,3).map(({type,project})=>({type,project}));
  const sources=[...new Set((Array.isArray(value.sources)?value.sources:[]).filter(id=>id==='author'||!!projectFacts(id)))];
  return {text:value.text.trim().slice(0,2400),actions,sources};
}
export function detailReply(id){const p=projectFacts(id);return p?{text:`${p.name}: ${p.description}\n\nТехнологии: ${p.stack.join(', ')}.\n\n${p.scope}\n\nЧто попробовать: ${p.try}`,actions:[{type:'walk',project:id},{type:'enter',project:id}],sources:[id]}:null;}
export function localReply(message,{location='city',project=null}={},history=[]){
  const q=message.trim().toLocaleLowerCase('ru');
  const mentioned=q.includes('аптек')||q.includes('crm')?'pharmacy':q.includes('argus')||q.includes('аргус')||q.includes('безопас')?'argus':q.includes('офис')?'office':null;
  const previous=[...history].reverse().find(m=>m.sources?.some(id=>projectFacts(id)))?.sources.find(id=>projectFacts(id));
  const id=mentioned||project||(location!=='city'?location:null)||previous;
  if(/автор|елнур|ельнур|резюме|опыт|стаж|образован|контакт/.test(q))return {text:`Автор города — ${GUIDE_FACTS.author.name}. Здесь собраны его проекты: виртуальный офис, аптечная CRM и учебный ARGUS. Биография, места работы и подтверждённый стаж ещё не добавлены — я не буду их придумывать. Исходные проекты можно изучить в GitHub.`,actions:[{type:'tour',project:null}],sources:['author']};
  if(/экскурс|самое интересное|покажи город|с чего начать/.test(q))return {text:'Предлагаю короткий маршрут: аптека → ARGUS → офис. Сначала попробуем бизнес-сценарий, затем учебный мониторинг сети и закончим четырёхэтажным пространством. Каждый этап можно пропустить или остановить.',actions:[{type:'tour',project:null}],sources:['pharmacy','argus','office']};
  if(/backend|бэкенд|бэкен|баз[аыуе] дан|postgres|sql/.test(q))return {text:'Начать можно с аптечной CRM: её исходный проект использует Python и PostgreSQL. База данных хранит структурированные данные; сервер проверяет правила и обрабатывает запросы. В городе показан локальный сценарий размещения, поэтому реальных записей в PostgreSQL эта демонстрация не создаёт.',actions:[{type:'project',project:'pharmacy'},{type:'walk',project:'pharmacy'}],sources:['pharmacy']};
  if(/frontend|фронтен|three|3d|тр[её]хмер|устроен.*город/.test(q))return {text:'Здесь настоящий 3D-мир: Three.js рисует здания, персонажей и освещение, а React отвечает за интерфейс. Путь ко входу рассчитывается с учётом препятствий. Модели GLB можно менять отдельно от логики взаимодействий.',actions:[{type:'project',project:'office'}],sources:['office']};
  if(/\bapi\b|апи/.test(q))return {text:'API — способ, которым программы обмениваются запросами и ответами. Например, интерфейс CRM может попросить сервер сохранить заявку. В городской демонстрации данные локальные, а в исходных проектах можно посмотреть серверную часть.',actions:[{type:'project',project:'pharmacy'}],sources:['pharmacy']};
  if(id&&/стек|технолог|почему|решени|архитект/.test(q)){const p=projectFacts(id);if(p)return {text:`В описании «${p.name}» указан стек: ${p.stack.join(', ')}. Причины выбора и подробные авторские решения пока не описаны. Я могу показать известные возможности проекта, но не буду выдавать предположения за слова Елнура.`,actions:[{type:'project',project:id}],sources:[id]};}
  if(id&&(mentioned||/это|здесь|что|попроб|покажи|расскажи|веди|пойд[её]м|туда|давай/.test(q)))return detailReply(id);
  if(/спасибо|круто|понятно/.test(q))return {text:'Пожалуйста! Можем продолжить знакомство с проектами или разобрать, что ты только что попробовал.',actions:[{type:'tour',project:null}],sources:[]};
  if(/привет|здравств|кто ты|как дела/.test(q))return {text:'Привет! Я помощник Елнура и проводник по этому городу. Сейчас у меня режим готовых ответов: могу рассказать о проектах, объяснить несколько базовых понятий и показать дорогу к зданию. Следовать за мной или нет — решать тебе. Для свободной беседы нужно подключить AI.',actions:[{type:'tour',project:null},{type:'about',project:null}],sources:[]};
  if(/управлен|ходить|клавиш/.test(q))return {text:'WASD, ЦФЫВ или стрелки — движение. E или У — действие рядом с объектом. Можно нажать на свободную дорожку. Во время разговора движение приостановлено; закрой диалог, чтобы продолжить.',actions:[],sources:[]};
  return {text:'В режиме готовых ответов я пока не умею свободно обсуждать этот вопрос. Могу рассказать об аптечной CRM, ARGUS, офисе, backend или управлении городом. С какого направления начнём?',actions:[{type:'tour',project:null}],sources:[]};
}
