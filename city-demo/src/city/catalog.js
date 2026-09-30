import {AUTOFIX_SITE} from './autofixDemo.js';
import {buildingEntrance,buildingFootprint} from './buildingFrame.js';
export {CITY_BOUNDS} from './cityBoundary.js';

export const PROJECTS = [
  {id:'tynysh',name:'Tynysh',tag:'Управление банкетными залами',description:'Бронирование мероприятий, рассадка гостей, меню, задачи команды и финансы в одном рабочем пространстве.',stack:['React','TypeScript','NestJS','PostgreSQL'],x:-24,z:23,parcelX:-24,parcelZ:23,yaw:Math.PI/2,w:14,d:8,h:5.6,color:'#708a67',exteriorAsset:null,exteriorScale:[1,1,1],exteriorYaw:0},
  {id:'office',name:'Мой офис',tag:'Виртуальное пространство',description:'Четыре этажа, сотрудники, отделы и взаимодействия в настоящем 3D.',stack:['React','Three.js','GLB'],x:0,z:-23,parcelX:0,parcelZ:-23,w:15,d:8.8,h:9.84,heightScale:1.2,color:'#aa6644',exteriorAsset:null,exteriorScale:[1,1,1],exteriorYaw:0},
  {id:'pharmacy',name:'Аптека',tag:'CRM рекламных размещений',description:'Выбор рекламной полки, бронирование и согласование размещения. Здесь можно пройти короткий демонстрационный сценарий.',stack:['React','Python','PostgreSQL'],github:'https://github.com/Ye1nurN/pharmacy-advertising-crm',x:-24,z:0,parcelX:-24,parcelZ:0,yaw:Math.PI/2,w:15,d:8.2,h:6.75,heightScale:1.35,color:'#78bda4',exteriorAsset:null,exteriorScale:[1,1,1],exteriorYaw:0},
  {id:'argus',name:'ARGUS',tag:'Обнаружение сетевых атак',description:'Учебный проект обнаружения атак в AMI-сетях. В зале показан отдельный сценарий с синтетическими событиями, без подключения к реальной сети.',stack:['Python','FastAPI','CNN–LSTM'],github:'https://github.com/Ye1nurN/argus-ami-ids',x:24,z:0,parcelX:24,parcelZ:0,yaw:-Math.PI/2,w:15,d:8.8,h:7.425,heightScale:1.35,color:'#354c5b',exteriorAsset:null,exteriorScale:[1,1,1],exteriorYaw:0},
  {id:'autofix',name:'AutoFix Hub',tag:'Запись и управление детейлингом',description:'Платформа записи в детейлинг-центры: кабинеты клиента и компании, расписание боксов и аналитика. Командный проект с участием в полном цикле разработки.',stack:['React','TypeScript','Supabase','PostgreSQL'],website:AUTOFIX_SITE,websiteLabel:'Uniqs Detailing',github:'https://github.com/Uniqcorns/YX-1',privateRepository:true,x:24,z:23,parcelX:24,parcelZ:23,yaw:-Math.PI/2,w:14,d:8,h:5.2,color:'#b29250',exteriorAsset:null,exteriorScale:[1,1,1],exteriorYaw:0},
].map(project=>({...project,entry:buildingEntrance(project)}));
export const RESERVE_PLOTS = [
  {id:'04',x:-24,z:-23},{id:'05',x:24,z:-23},
];
export const CITY_SPAWN={x:0,z:17};
export const INTERIOR_BOUNDS={minX:-8.55,maxX:8.55,minZ:-6.6,maxZ:6.6,cellSize:.3,radius:.35};
export const CITY_OBSTACLES=PROJECTS.map(buildingFootprint);
export function exteriorPortals(projects=PROJECTS){
  return projects.map(p=>({id:p.id,type:'enter',title:'Войти · '+p.name,...p.entry,radius:2.7,project:p.id}));
}
export function getProject(id){return PROJECTS.find(p=>p.id===id);}
export function spawnOutside(id){const p=getProject(id);return p?{x:p.entry.x+Math.sin(p.yaw||0)*1.4,z:p.entry.z+Math.cos(p.yaw||0)*1.4}:CITY_SPAWN;}
export const SHELVES=[
  {id:'A-01',name:'Полка A-01',size:'60 × 30 см',price:18000,x:-2.3,z:2.45,fixture:'island'},
  {id:'A-02',name:'Полка A-02',size:'60 × 30 см',price:25000,x:-5.95,z:2.6,fixture:'vitamins'},
  {id:'B-01',name:'Полка B-01',size:'60 × 40 см',price:22000,x:4.45,z:4.45,fixture:'promo'},
];
