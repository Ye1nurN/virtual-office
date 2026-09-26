"""Update human-readable delivery notes and source archive from actual exports."""
import json,collections,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'asset-library';OUT=ROOT/'public/models'
data=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'));assets=data['assets']
main=[a for a in assets if a['kit']!='reserve'];byid={a['id']:a for a in assets}
coverage={
 'Стены, простенки, углы и проёмы':['wall_module','wall_half','wall_corner','wall_pier','door_portal'],
 'Окна, стекло и двери':['window_section','glass_partition','glass_corner_post','door_interior','glass_door','entrance_double_door'],
 'Лестница, ограждения, лифт':['stair_u','railing_module','elevator_portal','elevator_cabin'],
 'Пол и свет':['floor_tile','floor_light_tile','wall_lamp','light_strip','ceiling_light'],
 'Рабочие места':['desk_compact','desk_open','desk_oak','cabinet_drawers','chair_task_green'],
 'Разные посадочные места':['chair_meeting','chair_auditorium','chair_training','stool_cafe','pouf_round','armchair_waiting'],
 'Лаунж и ожидание':['sofa_two','sofa_three','sofa_module','table_coffee','table_side'],
 'Переговорные и обучение':['table_meeting_small','table_meeting','table_training','table_round','desk_classroom'],
 'Доски, шкафы и полки':['whiteboard','whiteboard_vertical','bookshelf','bookshelf_low','cabinet_low','wall_shelf'],
 'Ресепшен и общий зал':['reception_counter','presentation_screen','desk_phone','coat_rack'],
 'Кофе-зона':['coffee_counter','sink_cabinet','coffee_machine','fridge_small','kettle','table_cafe'],
 'Служебные помещения':['toilet','washbasin','bathroom_mirror','stall_partition','waste_bin'],
 'Компьютеры, тестирование и серверная':['monitor','keyboard_mouse','computer_tower','laptop','tablet_device','server_rack','printer'],
 'Настольные детали':['coffee_mug','document_stack','binder_set','notice_frame'],
 'Варианты растений':['plant_desk','plant_floor','plant_slender','plant_broadleaf','plant_small_round'],
 'Персонажи и позы':['employee_base','employee_blond','employee_longhair','employee_seated','employee_seated_blond'],
}
for group,ids in coverage.items():
    assert all(i in byid for i in ids),group
counts=collections.Counter(a['category'] for a in main)
table='\n'.join(f'| {k} | {v} |' for k,v in counts.items())
readme=f'''# Office model kit · v2

{len(main)} модели и варианта для четырёхэтажного плана + 3 резервных объекта прошлого дизайна. Всего {len(assets)} самостоятельных GLB. Это реконструкции по `four-floor-plan.png`, а не оригинальные объекты исходного рендера. Размеры и невидимые поверхности интерпретированы; точное визуальное совпадение не подтверждается.

## Открыть и скачать

- Просмотр: http://127.0.0.1:4173/models.html — вращение, масштаб, сетка, поиск по названию или ID, категории, исходное изображение и три небольшие проверочные сборки.
- `../public/models/office-assets-pack.zip` — все GLB, manifest и инструкции.
- `office-assets.blend` — редактируемый исходник Blender 5.0.1. Отдельная коллекция на модель, именованные детали и материалы.
- `office-assets-source.zip` — исходник, генераторы, референс, таблица покрытия и отчёт проверки.
- `renders/category-*.png` — обзорные рендеры групп. `renders/library-overview.png` — весь комплект.
- `review/four-floor-coverage.md` — сопоставление с предыдущим аудитом.

## Состав основного набора

| Категория | Моделей / вариантов |
|---|---:|
{table}

Дерево атриума, большая каменная клумба и архивный металлический шкаф сохранены в категории «Резерв». Рабочие группы и этажи собираются повторением модулей; каждый стол на картинке не требует отдельного GLB. Примеры рабочего места, ресепшена и переговорной описаны в `src/model-presets.js`.

## Координаты и сборка

Единица — метр. В Blender Z вверх и фасад -Y, в GLB Y вверх и фасад +Z. Начало координат находится на нижней опорной плоскости объекта. Габариты manifest: **ширина, глубина, высота**. Из-за ручек, листьев и дверных коробок origin не обязательно совпадает с центром bounding box.

- Компактные и переговорные столы: верх y≈0,803 м. Техника и декор ставятся на эту высоту.
- Ресепшен: рабочий верх 0,78 м, стойка посетителя 1,02 м; кофейный модуль 0,92 м.
- Пол имеет толщину 0,03 м: при сборке либо опускайте его на -0,03, либо поднимайте мебель на 0,03.
- Стена: шаг 1,2 м, высота 2,65 м. Окно: ширина 1,8 м. Лестница: 18 подъёмов по 0,17 м, междуэтажная высота 3,06 м. Это выбранные проектные размеры, не измерения изображения.
- Настенные предметы тоже имеют нижний origin: высоту монтажа нужно задать при расстановке.
- Сидящие персонажи рассчитаны на сиденье около 0,52 м; положение относительно конкретного кресла и стола подгоняется при сборке.

```js
import {{GLTFLoader}} from 'three/addons/loaders/GLTFLoader.js';
const {{scene: desk}} = await new GLTFLoader().loadAsync('/models/desk_compact.glb');
scene.add(desk);
```

GLB объединяет статичные детали по материалам внутри отдельных поворотных узлов. В Blender исходные детали остаются раздельными. Всего в полном архиве {sum(a['triangles'] for a in assets):,} треугольников и {sum(a['size'] for a in assets)/1024/1024:.2f} МиБ несжатых GLB. Это показатели всех уникальных моделей, не оценка будущей сцены со всеми сотрудниками. Для массового повторения нужны совместное использование ресурсов, instancing и отдельный бюджет производительности.

## Подвижные узлы и ограничения

- Двери: `hinge_left`, `hinge_right`; вращение вокруг вертикали (Blender Z / GLB Y).
- Лифт: `slide_left`, `slide_right`; перемещение по X. Холодильник: `fridge_hinge`.
- Ноутбук: `screen_hinge`; поворот вокруг X.
- Персонажи: `head`, `arm_L`, `arm_R`, `leg_L`, `leg_R`. При уникализации Blender может добавить суффикс `.001`; узлы имеют метаданные оси движения.
- Это объектная иерархия. **Скелета со skinning и анимационных клипов пока нет.** Коллизии и навигационная сетка создаются при сборке этажей.
- Материалы PBR встроены в GLB, внешние текстуры не нужны. Стекло использует transmission, зеркало — металлический материал. Эмиссивные светильники требуют источников света в движке, чтобы освещать помещение.
- В рендере плана свет, плотность мелких деталей и отделка отличаются; дальнейшая художественная доводка проводится в собранной сцене.

## Допущения

Гардеробная стойка, устройство учебных мест, основания стульев и мелкие приборы интерпретированы по маленькому изображению. Для учебных мест включены оба варианта — отдельный стол и стул с планшетом. Потолочный светильник — дополнительное предложение: потолок на плане не показан. Поле `assumption` в manifest отмечает эти решения.

## Воспроизводимость

Blender: `--background --factory-startup --python-exit-code 1 --python asset-library/build_library.py`. Сценарий подключает `four_floor_models.py` и `four_floor_details.py`. Рендеры отдельно: открыть `.blend` в фоновом режиме и выполнить `render_library.py`.

Проверка GLB и упаковка: `python asset-library/validate_assets.py`. Подготовка описаний и исходного архива: `python asset-library/prepare_delivery.py`. Отчёт — `validation.json`.

Основное растровое демо остаётся на `/`, прежняя экспериментальная 3D-сцена — на `?view=3d`. Четыре этажа в этой поставке ещё не собраны.
'''
(SRC/'README.md').write_text(readme,encoding='utf-8')
coverage_md='# Покрытие четырёхэтажного плана · v2\n\n'+f'Подготовлено {len(main)} модели/варианта, плюс 3 резервных. Эта таблица закрывает перечень типов из `four-floor-audit.md`; она не подтверждает точное совпадение изображения, расстановку и вместимость этажей.\n\n'
coverage_md+='| Группа из аудита | Готовые GLB (ID) |\n|---|---|\n'
coverage_md+='\n'.join('| '+g+' | '+', '.join('`'+i+'`' for i in ids)+' |' for g,ids in coverage.items())
coverage_md+='\n\n## Неоднозначные детали\n\n'
coverage_md+='\n'.join('- **'+a['title']+'**: '+a['assumption'] for a in main if a.get('assumption'))
coverage_md+='\n\n## Следующий этап\n\nСборка этажей, дневной свет, коллизии/навигация, игровые анимации и контроль производительности. На первом этаже прямой путь от входа к ресепшену оставить свободным; ожидание разместить по бокам.\n'
(SRC/'review/four-floor-coverage.md').write_text(coverage_md,encoding='utf-8')
with zipfile.ZipFile(SRC/'office-assets-source.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['office-assets.blend','build_library.py','four_floor_models.py','four_floor_details.py','render_library.py','validate_assets.py','prepare_delivery.py','README.md','validation.json','review/four-floor-plan.png','review/four-floor-coverage.md']:
        z.write(SRC/name,'asset-library/'+name)
    z.write(OUT/'manifest.json','public/models/manifest.json')
    z.write(ROOT/'src/model-presets.js','src/model-presets.js')
    for name in ['inspect_source.py','source-validation.json','QA-v2.md']:
        if (SRC/name).exists():z.write(SRC/name,'asset-library/'+name)
print(json.dumps({'total':len(assets),'main':len(main),'categories':dict(counts),'sourceArchiveBytes':(SRC/'office-assets-source.zip').stat().st_size},ensure_ascii=False))
