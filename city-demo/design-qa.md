# Charcoal projects gallery — 2026-10-04

Reference: `design/collection/charcoal-reference.png`, user's exact selected image
(1485 × 1059). Compared at the same viewport and CRM selected state with the actual
browser capture `qa/collection-charcoal/desktop.jpg`. Both full frames were inspected
together; `type-comparison.jpg` compares source (left) and implementation (right) at
native resolution for the copy and primary actions.

Implemented: neutral black embossed wall, restrained under-shelf light, charcoal timber,
ivory porous stone, white four-screw plaques, white actions, bold Times heading with
Roboto copy, two physical shelf rows and the reference's narrower bottom shelf.
Removed duplicate secondary links/footer; equivalent navigation remains in the header
and breadcrumb. Consolidated historical collection CSS instead of stacking overrides.
Homepage theme and city/office geometry remain unchanged.

Fixed during QA:
- P1: heading wrapping to three lines pushed the lower row out of the viewport.
  Matched the reference's bold two-line title and adjusted the height-based type scale.
- P1: miniature plaques intersected timber and clipped their lettering. Positioned the
  complete plaque in front of the shelf edge, retaining physical contact and shadows.
- P2: low-height desktop had 1 px of overflow; reduced its thumbnail row within the
  viewport grid. No overflow masking was used.
- P2: first wall generation had broad plaster marks; replaced it with an edit of the
  existing fine embossed texture. Rejected texture is not shipped.

Browser verification:
- CRM 1485 × 1059, 1880 × 927 and 1280 × 680: scrollHeight equals viewport height;
  both shelves and both actions visible, no inspected text/control overflow.
- 1024 × 768: all-project overview and taller office model fit, no copy overflow.
- ARGUS selection, smooth model transition, ArrowRight rotation, case open and Escape
  close verified. A mobile Tynysh demo launch reached the actual local banquet scene.
- 390 × 844: readable single-column layout, two-column shelf, natural scrolling;
  Tynysh copy and controls have no horizontal overflow.
- Browser console errors: none. Reduced-motion handling retained in CSS and renderer.
- Final code: npm test (124 passed), npm run build passed; existing large shared chunk
  advisory only. No runtime dependency added.

Scope/visual limit: buildings remain the existing interactive Three.js city models as
required, with their original silhouettes, voxel foliage and window details. They are
not pixel-identical to the illustrated buildings in the reference. UI composition,
palette, materials and interaction checks pass. Further model-detail parity is a
separate art iteration; no blocking UI or functional findings remain.

final result: passed

---

# Collection fits the desktop viewport — 2026-10-04

Request: keep the selected project, description/actions and lower shelf visible without
scrolling. User screenshot: 1880 × 927, with the lower shelf cut off.

- Desktop grid now allocates height to header, breadcrumb, featured project, lower shelf
  and footer using dynamic viewport units. Model and type sizes respond to window height.
- Secondary project/resume navigation occupies the footer on desktop. No project facts,
  buttons or models were removed; scrolling remains available when content requires it.
- Miniature camera scale now fits the tallest building in a row as well as the cell width.
  Slot ResizeObserver notifications keep WebGL framing aligned after layout changes.
- Natural readable mobile/short-window layout remains. Desktop fitting applies at widths
  >= 1000 px and heights >= 680 px; it does not hide overflowing content or defeat zoom.

Browser checks:
- CRM at 1880 × 927, 1280 × 720, 1024 × 768 and 1280 × 680: scrollHeight equals
  clientHeight exactly; both shelves, all actions and footer are visible.
- ARGUS at 1366 × 768: no page overflow, ArrowRight rotates model, case opens and
  Escape closes it. Office at 1280 × 720: the taller building fits on its plinth.
- All-project overview fits at 1366 × 768, with all five models visible.
- 390 × 844: Tynysh copy/actions and two-row lower shelves remain readable and reachable;
  selecting Uniqs returns to the top with the correct model and heading.
- Window resize, animated project switches and footer navigation positions inspected.
  No inspected text/control overflow; no browser console errors.
- Evidence: `qa/collection-fit/desktop.jpg`, actual browser at 1880 × 927.
- Validation: 124 tests passed; production build passed; git diff --check passed.
  Existing shared bundle size advisory remains.

final result: passed

---

# Warm home and shelf restoration — 2026-10-04

Request: return to the user's warm homepage reference and earlier shelf design.
Visual source: `design/home-warm-restored-reference.png` (1485 × 1059).

- Home retains the measured responsive grid and typography, with warm charcoal surfaces,
  restrained bronze borders, cream stone monograms/contact action and a walnut projects card.
- Collection presentation and materials restored from `a06d8e2`: open copy beside the model,
  illuminated warm wall, physical walnut shelves, textured travertine plinths and cream labels.
- Existing project crossfades, direct model rotation, case content and routes retained.
  The removed rotate button remains removed. Shared drawers use the warm palette.
- `qa/warm-restored/home.jpg` and `projects.jpg`: actual browser captures at 1485 × 1059.
  The real-time 3D buildings are the existing implementation, not a pixel-identical reproduction
  of the generated souvenir artwork.
- Browser: Home → Projects → ARGUS → case → Escape → Home, ArrowRight model control,
  collection overview with all five models, and mobile Uniqs → CRM selection verified.
- Checked home and collection at 390 × 844, and collection at 320 × 844. Found and fixed
  overflowing CRM metrics at 320 px by wrapping them. No overflow in the inspected text,
  controls, headings or breadcrumbs after the fix. Browser console errors: none.
- Reduced-motion rules preserved in styles and renderer; reviewed, not OS-emulated.
- Validation: `npm test` (124 passed), `npm run build`, and `git diff --check`.
  Existing shared bundle size advisory remains. No dependencies or generated art added.

final result: passed

---

# Dark walnut shelf revision — 2026-10-04

User requested dark wooden shelves. Reused the existing walnut raster as albedo and bump, with a matte dark-walnut material and no metallic finish. The change applies to the hero shelf and every miniature shelf. White ceramic plinths, graphite page UI and building materials are preserved.

Browser verification: inspected 1485 x 1240 desktop and 390 x 844 mobile renders, and switched pharmacy to ARGUS. Both shelf levels display dark wood and the project transition remains functional. Console errors: none. Evidence: `qa/collection-graphite/dark-walnut.jpg`.

Validation: `npm test` 124/124 passed; `npm run build` passed, existing shared chunk-size advisory only; `git diff --check` passed.

final result: passed

---

# Shared graphite projects theme — 2026-10-04

Request: adapt the existing projects gallery to the approved homepage. The source of the visual language is `design/home-graphite-approved.png` and the working homepage. Preserve real 3D buildings, rotation, project changes and case/demo routes.

## Changes verified

- Shared neutral graphite/white palette, Roboto body, Times display headings, header sizing, white monogram, focus treatment, drawer and toast styling. These now live in `gallery-theme.css`; home no longer maintains a divergent override set.
- Reused existing charcoal wall and panel raster assets. Project copy sits in a rounded graphite card with white/outlined actions, matching home.
- Replaced gallery-only timber and warm stone colouring with matte graphite shelves, white ceramic plinths and neutral lighting. Building colours, windows, foliage, camera framing, contact geometry and shadow infrastructure are preserved.
- Removed historical collection CSS overrides and obsolete header/shelf/quote styles; kept one responsive layout and existing 460 ms WebGL crossfade.

## Browser evidence

- `desktop.jpg`, `overview.jpg`, `case.jpg` and `home-regression.jpg`: 1485 x 1059. Opened and visually inspected matching header, typography and neutral surfaces. Home retained its measured layout after extracting the shared theme.
- `final.jpg`: 1485 x 1240, complete featured pharmacy and miniature shelf visible.
- `rotated.jpg`: ARGUS after ArrowRight, with visible rotation and keyboard focus.
- `mobile-top.jpg`, `mobile-controls.jpg`: 390 x 844, model, copy, CTAs and two-column miniature shelves.
- `before.jpg`: historical 1280 x 720 warm gallery capture; not used as a pixel comparison with the wider final viewport.
- Checked 320, 390, 900, 1280 and 1485 px views. No overflowing text, project controls, headings, header or breadcrumbs found in the inspected states.
- Home -> Projects; pharmacy -> ARGUS -> all five projects -> Home; mobile pharmacy -> Uniqs; case opening and Escape; ArrowRight rotation; Uniqs demo launch and browser Back all worked. The live demo loaded its original 3D room and controls.
- Fresh final browser tab: no console errors, one canvas for the collection. An earlier development-only hot reload error occurred while replacing the CSS file, then disappeared on the fresh page.
- Reduced-motion rules retained in shared CSS and renderer; reviewed, not OS-emulated.

## Validation

`npm test`: 124/124 passed. `npm run build`: passed. The existing large shared city/GLTF chunk warning remains an advisory. No dependencies were added. City and interior source/materials were not changed.

## Findings

- Resolved: incompatible warm material/font/button palette between home and projects.
- Resolved during iteration: repeating panel albedo created obvious seams on the shelf; use a neutral material with subtle bump relief instead.
- Resolved during iteration: shared hover selector could obscure the white CTA label; the collection CTA now explicitly keeps dark text.
- No remaining P0/P1/P2 visual or interaction issues in tested states. Small 3D labels remain model-scale details on narrow screens; accessible button names identify every project.

final result: passed

---

# Graphite homepage fidelity — 2026-10-03

Source visual truth: `design/home-graphite-approved.png`, the user's final black/white attachment. This supersedes the preceding warm version for the homepage only.

Implementation: `qa/home-graphite/desktop.jpg`, route `?view=home`, top of page, drawers closed, entrance animation settled. Both source and browser capture are **1485 × 1059** pixels, with a 1485 × 1059 CSS viewport and devicePixelRatio 1. No density normalization or stretch was applied.

## Findings and comparison history

1. **[P1, resolved] Palette and materials.** `compare-before.jpg` shows brown plaster/walnut versus the selected neutral black/white source. Replaced home materials with generated neutral charcoal rasters, pure-white identity and CTA, neutral borders and drawer colours. Existing 3D building/material assets remain intact.
2. **[P2, resolved] Grid and typography.** Earlier 12-column layout made the left cards too wide and the bottom award too large. Three shared tracks now measure 547:245:587 with 14 px horizontal / 16 px vertical gaps. At the reference viewport top rows measure 804.84/586.16 px, 424/248 px high; lower cards measure 546.20/844.80 px, 174 px high. Inter was replaced on home by locally packaged Roboto with Times New Roman display type. Corrected the project CTA to left alignment, separated stack items, restored the footer date and moved the full-resume action into About.
3. **[P2, resolved] First pass overflow and lighting.** `compare-iteration-1.jpg` / `typography-1.jpg` show the first revised stage. Lowered excessive panel grain/brightness using the generated raster over a neutral base, refined the name/role and numeral metrics, reduced the project subtitle to fit its measured text box. Removed unwanted desktop scrollbar caused by natural card heights.
4. **[P2, resolved] Responsive widths.** Browser inspection found a count overflow at 320 px, a long education row at 760 px and an unwrapped achievement description at 1024 px. Adjusted the small count, timeline typography and award wrapping. Rechecked these exact widths: no overflowing cards, text, or controls.
5. **[P2, resolved] Responsive heading hierarchy.** A final laptop check exposed a generic section heading rule overriding the Projects title below 1380 px. Scoped the rule to Skills/Education and checked the final title sizes: 46 px at 1254, 42 px at 900, 38 px at 390 and 34 px at 320. All four rendered without overflow. `laptop.jpg` and refreshed `mobile-top.jpg` record the correction. Tests (124/124) and production build were rerun successfully after this change.
6. Final evidence: `comparison-final.jpg` (reference left, implementation right); focused `comparison-intro.jpg`, `comparison-projects.jpg`, `comparison-details.jpg`. All were opened and inspected after the fixes. `mobile-top.jpg` and `mobile-bottom.jpg` record the 390 × 844 layout.

## Required fidelity surfaces

- **Fonts/typography:** serif hierarchy, thinner sans body, correct line wrapping, footer and measured numeral placement. Roboto is packaged locally with Cyrillic coverage. The image-generated original has slightly different glyph contours/antialiasing from live Windows/browser typography (P3).
- **Spacing/layout rhythm:** matched section positions and heights; roughly 1–2 px residual edge differences due to rounded source geometry and fractional CSS tracks are P3. No desktop vertical overflow at the source viewport. Projects remain a separate route.
- **Colours/tokens:** neutral near-black / graphite / white, no bronze or green on home. White foregrounds, grey secondary copy, restrained raster highlights and borders. Surface samples compared against reference in the second pass.
- **Image quality/assets:** two purpose-generated WebP material rasters; editable HTML text and real Phosphor icons. No flattened screenshot used as interface. The exact microscopic texture and illustrative highlights remain a P3 difference. Existing typographic E. brand is retained as native type.
- **Copy/content:** matches the selected image, including five projects, skill labels, education, achievement, email and Telegram. Date marked with semantic time. No invented professional facts or new external service.

## Functional verification

- Home → Projects loads the real 3D pharmacy shelf and other project controls.
- Education opens; Escape closes it. About opens; Full resume changes the route and opens the preserved detailed resume. Its brand returns home.
- Responsive rendered checks at 320, 390, 760, 900, 1024, 1280 and 1485 CSS pixels; no final overflow.
- Contact hrefs checked: `https://t.me/ye1nurn` and `mailto:nurmukhanovyelnur@gmail.com`. No messages were sent.
- Home renders zero canvases. Console checked: no error entries.
- Reduced-motion handling is inherited from the gallery theme and reviewed; OS-level reduced-motion emulation was not available and is not claimed.
- `npm test`: **124 / 124 passed**.
- `npm run build`: **passed**. Existing shared Three.js/GLTF chunks still produce the size advisory; no build error.

## Open questions

None blocking this selected homepage. The projects gallery and city preserve their existing appearance.

## Implementation checklist

- [x] Copy exact chosen reference.
- [x] Match palette, measured grid, type and controls.
- [x] Connect generated materials and local font.
- [x] Verify desktop/mobile and primary navigation.
- [x] Review final full and focused visual comparisons.
- [x] Run tests/build.

## Follow-up polish

P3 only: tiny font contour, microtexture and fractional-position differences from generated source imagery. This is a functioning responsive implementation, not a claim of pixel-identical generated artwork.

final result: passed

---

# Previous iterations (historical)
# Последняя проверка — главная и проекты, 03.10.2026

Выбранный источник: `design/home-approved.jpg` (1485 × 1059). Браузерная реализация:
`qa/home/desktop.jpg` (1486 × 1059 CSS/physical px, плотность 1:1). Разница в один
пиксель ширины не масштабировалась. Совместные сравнения: `qa/home/comparison.jpg`
и крупный план `qa/home/typography-comparison.jpg`.

Шесть блоков главной, отдельный переход к проектам, единая тёплая тёмная палитра,
контакты, образование, кейсы и возвращение из демонстрации проверены в браузере.
Проверены ширины 320, 390, 900 и 1486 px. Исправлены фон/контраст камня, типографика,
мобильная шапка и переносы дат. Открытых P0/P1/P2 нет; различия художественного
освещения и растеризации шрифта отмечены как P3. Консоль без ошибок.

Подробные пять поверхностей сравнения, история исправлений, ограничения и
сценарии: [qa/home/README.md](qa/home/README.md).

final result: passed

---
# Последняя проверка — Tynysh, 01.10.2026

Выбранный источник: `design/tynysh-reference.png`. Реализация: `design/tynysh-desktop.jpg`; оба изображения 1487 × 1058 px, viewport 1487 × 1058 CSS px, DPR 1. Состояние: подготовка банкета на 48 гостей, выбран стол 3. Полное совместное сравнение — `design/tynysh-comparison.jpg`, крупная карточка — `design/tynysh-card-comparison.jpg`. Дополнительно проверены 390 × 844, формы и вход из города.

Исправлены перекрытие гида, проход у стойки, масштаб и доступные имена на телефоне, ввод даты и открытие управления в роли сотрудника. Повторные браузерные кадры подтверждают исправления. Шрифт, интервалы, цвета, растровые ресурсы и тексты проверены; допустимые отличия настоящей voxel-сцены от художественного эскиза перечислены в [полном отчёте](design/tynysh-qa.md). Там же сохранены история сравнений, пути к доказательствам и сценарии проверки. Ошибок error/warn в браузере не найдено. Открытых P0/P1/P2 нет.

final result: passed

---

# Проверка визуальной доработки — 27.09.2026

Рабочий сценарий рекламной кампании от 28.09.2026: [pharmacy-campaign-qa.md](design/pharmacy-campaign-qa.md).

Последующая адаптация аптечного интерьера от 28.09.2026 проверена отдельно: [pharmacy-qa.md](design/pharmacy-qa.md). Ниже сохранены результаты проверки городского квартала.

## Источники и состояние

- Целевой источник: `design/user-target.png`, 1536 × 1024 px, повторно приложенный пользователем художественный эскиз.
- Исходная реализация: `design/user-before.png`, пользовательский кадр со старой камерой и обрезкой. Он используется для оценки изменений, не для точного совмещения пикселей.
- Реализация после доработки: `qa/city-redesign-overview.png`, 1536 × 1024 px, CSS viewport 1536 × 1024, плотность итогового снимка 1 px / CSS px.
- Дополнительные состояния: `qa/city-redesign-walk.png`, 1536 × 1024; `qa/city-redesign-mobile.png`, 390 × 844.
- Состояние для основного сравнения: день, общий план центрального квартала, панели закрыты, три проекта и четыре резерва. Офисный интерфейс сохранён по отдельному требованию пользователя и потому занимает часть кадра, отсутствующую на эскизе.

## История сравнений

1. **До изменений — P1:** простые кубические кроны, голые крыши, однотонная трава, низкие фасады, пустые витрины. **P2:** диагональный ракурс, мелкие вывески, незаметная уличная мебель. Фактические изображения открыты и сопоставлены; перечень видимых различий записан в `design/reference-audit.md`.
2. **Первый проход — ещё P2:** после новых фасадов и озеленения крыши оставались слишком глубокими, текст на вывесках был сплющен. Исправлены глубина и высота корпусов, ракурс, разрешение текстовых поверхностей и высота знаков.
3. **Второй проход — P2:** плоские окна и визуально терявшиеся голубые стойки ARGUS. Добавлены несколько планов остекления, тёплые световые акценты, контактные тени; световые полосы вынесены перед облицовкой.
4. **Проверка после исправлений:** исходник и `qa/city-redesign-overview.png` открыты вместе в одном запросе сравнения. Отдельно осмотрен фактический крупный план аптеки `qa/city-redesign-walk.png`: рамки, дверь, витрины, вывеска, листва, клумбы и швы мощения. Этот крупный план имеет камеру прогулки и не выдаётся за пиксельное наложение исходного эскиза.

## Пять поверхностей сравнения

| Поверхность | Результат |
| --- | --- |
| Шрифты и типографика | Рабочий интерфейс сохраняет Inter и прежнюю иерархию. Фасадные названия и знаки 04–07 читаются в общем плане. Пропорции текстовой текстуры согласованы с физическим размером таблички. Художественная верхняя табличка заменена существующей рабочей навигацией намеренно. |
| Композиция и отступы | Сохранена сетка 3×3, офис сверху, аптека слева, ARGUS справа. Общий ракурс фронтальный, около 39,1°. Крыши менее глубокие, фасады выше. Декор не перекрывает входы и маршруты. Мобильный viewport не имеет горизонтального переполнения: document width = scroll width = 390. |
| Цвет и свет | Кирпичный офис, зелёная аптека, тёмный ARGUS, голубые акценты, тёплое мощение и зелёные газоны соответствуют назначению и палитре образца. Есть тёплые окна, контактные тени и слабое свечение. Художественное освещение эскиза не является физически идентичным браузерному. |
| Ассеты и детализация | Локальные albedo травы, камня и кирпича сгенерированы по референсу. Здания, кроны, клумбы, фонари, флаги, таблички и крыши — настоящая объёмная геометрия, как требует задача. Нет подмены сцены фоновой картинкой. Оригинальные модели персонажей и офисная библиотека сохранены. Тонкий живописный шум и отдельные микропредметы рисунка не скопированы. |
| Текст и содержание | Названия трёх проектов и участков сохранены. Никакие новые биографические сведения, результаты проектов, реальная CRM или сетевой сервис не заявлены. Демонстрационные сценарии по-прежнему явно обозначены. |

## Взаимодействия и техническая проверка

- D: персонаж сдвинулся с (0, 17) до (0.136, 16.922), камера перешла из общего плана в следование.
- «Пройти» к аптеке: завершённый путь к (-23.975, 7.319), появилась подсказка входа; новые посадки не блокируют маршрут.
- E открыл аптеку, выбор A-02 открыл прежнюю форму. Esc закрыл её, E вернул на улицу.
- Узкий экран 390 × 844: сохранены навигация, поиск, нижняя панель, масштаб и кнопка входа. Эффекты GTAO/bloom отключаются на узком экране. Реальное сенсорное устройство отдельно не тестировалось.
- Отсутствующих GLB нет; ошибок JavaScript в пройденных сценариях не найдено. Во время HMR появлялось предупреждение о повторном импорте Three.js; оно не сопровождалось ошибкой отрисовки.
- 42 автоматические проверки прошли, включая маршруты ко всем зданиям, карте и четырём табличкам с полным списком новых коллизий.
- Production-сборка успешна. Сохранилось предупреждение Vite о размере общего Three.js/GLTF-чанка (~832 КБ до gzip).

## Оставшаяся разница / P3

- Силуэты людей взяты из существующего офиса и отличаются от нарисованных персонажей референса — это сознательное сохранение модели проекта.
- Вблизи видны грани листвы и повторяемые модули посадок. Мелкие товары, отражения и оборудование проще художественного рисунка.
- Тени и цветовые переходы — результат рендера реальной сцены, без ручной живописной доработки каждого пикселя.

Приёмка относится к реализованной объёмной адаптации и сохранению взаимодействий. Пиксельное тождество эскизу не заявляется. Открытых P0/P1/P2 по этой адаптации после последнего прохода не найдено.

final result: passed

# Коллекция статуэток — приёмка 2026-10-03

## Источник и сравнение

- Источник: `design/collection/reference.png`, выбранный пользователем музейный вариант; 1486 × 1059 px.
- Реализация: `http://127.0.0.1:4185/?view=collection`, production-сборка, выбрана CRM, исходный ракурс, прокрутка 0.
- Финальный снимок: `qa/collection/desktop-final.jpg`, 1486 × 1059 px; viewport 1486 × 1059 CSS px, devicePixelRatio 1. Масштабирование перед сравнением не требовалось.
- Совместный просмотр источника и результата: `qa/collection/comparison-final.jpg`. Детали проверены отдельно в `qa/collection/compare-typography.jpg` и `qa/collection/compare-shelf.jpg`; обе стороны взяты из референса и финального браузерного снимка.
- Мобильная production-сборка: viewport 390 × 844 CSS px, DPR 1, снимки `qa/collection/mobile-top.jpg` и `qa/collection/mobile-shelf.jpg`. Ширина body — 390 px, горизонтального переполнения нет, один canvas.
- Промежуточная проверка общего вида: `qa/collection/mobile-overview.jpg`. Проверка перетаскивания: `qa/collection/drag-rotation.jpg`.

## История исправлений

1. Первый совместный просмотр — `qa/collection/comparison-first.jpg` (исходные `desktop-first.jpg` и reference, одинаковые 1486 × 1059). Результат был blocked: [P2] навигация смещена вправо, статуэтка показана с другой стороны, чрезмерно равномерный свет, тяжёлый системный шрифт и более низкий текстовый блок.
2. Исправлены центрирование навигации, направление камеры, интенсивности основного/заполняющего света, размеры и интервалы текста; `desktop-second.jpg` фиксирует этот проход. Последующий осмотр выявил [P2] отрыв миниатюр от полки при мобильных пропорциях и недостаточный контраст наследуемых светлых карточек в тёмной панели.
3. Основания миниатюр теперь проецируются на нижний край своей области независимо от высоты здания. Для карточек, образования, достижения, метрик и поиска заданы цвета тёмной темы. Шрифт Lora Variable с кириллицей размещается локально; Inter сохранён для навигации. Финальный совместный просмотр и два увеличенных фрагмента повторены после этих исправлений. Открытых P0/P1/P2 для функциональной 3D-адаптации не осталось.

## Обязательные поверхности

- **Типографика:** локальный Lora 400 для крупного заголовка/описания и прежний Inter для интерфейса. Двухстрочный заголовок CRM, иерархия, кириллица, подписи и кнопки читаемы. Точное совпадение неизвестного шрифта нарисованного эскиза не заявляется.
- **Ритм и сетка:** крупная модель слева, текст справа, четыре оставшиеся статуэтки на нижней полке; на мобильном — модель, описание и две колонки миниатюр. Навигация, кейс, демо, резюме и контакты доступны без обрезки.
- **Цвет:** тёмная тёплая стена, текстуры дерева/камня, латунные таблички, светлый текст и зелёный CTA. Контраст вложенных карточек проверен отдельно в открытой панели «Обо мне».
- **Изображения и геометрия:** настоящие пять зданий из `PROJECTS` / `buildProjectBuilding`, исходные GLB-растения. Дерево, штукатурка и камень — растровые материалы из imagegen. Сознательное отличие по требованию пользователя: сохранены реальные фасады сайта, включая их пропорции и детали, вместо подмены статичной нарисованной сценой. Модели можно повернуть.
- **Текст:** факты взяты из существующих CASES/резюме. 430+ и 16 000+ — данные каталога. ARGUS — дипломный исследовательский прототип; Uniqs — командный проект. Неподтверждённая accuracy не добавлена. Образование, достижение и контакты сохранены.

## Функциональная и техническая проверка

- Выбраны все пять проектов; большая статуэтка и текст меняются согласованно. «Закрыть» показывает всю коллекцию.
- Проверены поворот кнопкой, стрелкой → при фокусе на модели и перетаскивание мышью.
- Открыт кейс ARGUS, закрыт через Escape; проверена панель «Обо мне» с BRICS и образованием.
- Переход в аптеку открыл существующую сцену и форму кампании. Возврат через навигацию и «Назад» браузера возвращает коллекцию. Реальных заявок не отправлялось.
- Мобильная прокрутка, полки и выбор проекта проверены при 390 × 844. На реальном сенсорном устройстве отдельно не тестировалось. Ограничение движения по prefers-reduced-motion реализовано; системная настройка пользователя не менялась.
- Production-сборка в отдельной вкладке: ошибок и предупреждений консоли нет. Предупреждение устаревшего PCFSoftShadowMap первого прохода устранено переходом на PCFShadowMap.
- `npm run build` завершился успешно. Vite предупреждает о размере существующих общих чанков Three.js/города; код коллекции загружается отдельно.
- В исходном рабочем дереве `npm test`: 122 passed, 1 failed — заранее существующий незакоммиченный тест вывески офиса в `tests/building-orientation.test.mjs`. Он не изменялся и не входит в этот коммит.
- Проверен изолированный состав коммита: актуальные src/tests/server/package.json, исходные public, версия постороннего теста из HEAD. `npm test`: **122/122 passed**. Копия проверки находится в игнорируемом `node_modules/.collection-verify-20261003`; исходный незавершённый тест сохранён.
- `git diff --check` выполнен. Исходный office-demo и посторонний music-island-prototype не изменялись.

## Допустимые отличия / P3

Эскиз содержит художественное освещение, более сложную листву, отражения и размытые растения перед камерой. Витрина использует существующие модели города и свет реального времени; этих декоративных деталей она не воспроизводит буквально. Форма полок и микрофактура основания также упрощены. Приёмка относится к интерактивной адаптации выбранной композиции, а не к попиксельному совпадению с генеративным рендером.

final result: passed

# Объёмные полки и совпадение композиции — 2026-10-03

## Источник и фактическое сравнение

- Повторно выбранный пользователем референс: `design/collection/reference.png` (1486 × 1059).
- Финальная production-сборка: `http://127.0.0.1:4185/?view=collection`, CRM, исходный ракурс, прокрутка 0; viewport 1486 × 1059.
- Снимок: `qa/collection/physical-stage-final.jpg`. Общий просмотр бок о бок: `physical-comparison.jpg`; отдельные сравнения основания, миниатюр и типографики: `physical-compare-support.jpg`, `physical-compare-miniatures.jpg`, `physical-compare-typography.jpg` в той же папке. Все четыре сравнения открыты и осмотрены после финальных правок.
- Мобильная production-сборка, 390 × 844: `physical-mobile-top.jpg`, `physical-mobile-shelf.jpg`; body 390 px, один canvas, горизонтального переполнения нет.

## Исправленные дефекты

1. [P2] Статуэтки и плоские CSS-полки имели разные проекции и выглядели подвешенными. Полки, основания, таблички и здания теперь рендерятся совместно; нижняя грань каждой подставки лежит на поверхности полки. Два мобильных ряда получают отдельные сцены с общей камерой для объектов каждого ряда.
2. [P2] Главная табличка находилась на деревянной полосе, камень напоминал дерево из-за растяжения UV. Табличка закреплена на цилиндрическом основании, материал использует координаты в масштабе сцены; добавлены толщина и фаски деревянных полок.
3. [P2] Высокое здание офиса обрезалось. Главная камера учитывает реальную высоту выбранного здания, а области нижнего ряда расширены вверх. Проверен офис в исходном и повёрнутом ракурсе.
4. Согласованы фон, тёплый свет, глубина полок, расположение миниатюр, ширина правой колонки и перенос заголовка. Добавлено затенение в стыках (GTAO, только desktop), сглаживание и окружение для отражений. Исправлен центр вращения относительно подставки. Снимки `physical-stage-v2.jpg` и `physical-mobile-v2.jpg` сохраняют промежуточный проход.

## Пять поверхностей проверки

- **Типографика:** Times New Roman 400 для узкого двухстрочного заголовка, локальный Lora 400 для описания и списка, Inter 400 для навигации. Иерархия, русские подписи и CTA проверены в браузере.
- **Сетка:** крупная статуэтка слева, описание справа, четыре проекта снизу; модель и плита не оторваны от деревянной поверхности. На 390 px — последовательный контент и два ряда по две модели.
- **Цвет и материалы:** тёплая тёмная стена, дерево, светлый камень, латунь и зелёный CTA; добавлены размытие растений по краям и боковое освещение стены. Материалы создавались через imagegen, происхождение записано в `design/collection/assets.md`.
- **Геометрия:** используются реальные здания города и GLB-растения. Полки и текст на табличках находятся в 3D. У аптеки только в коллекции оборудование крыши поднято и разнесено, чтобы читаться с низкой камеры; размещение и коллизии города сохранены.
- **Текст:** биографические и проектные данные не изменены. Все пять проектов, кейсы, контакты и демонстрационные ограничения сохранены.

## Проверки

- Полка всех пяти проектов открывается через «Все проекты»; выбор CRM и офиса обновляет модель и описание. Проверены переходы через миниатюры на desktop и mobile.
- Проверены вращение кнопкой, стрелкой вправо и перетаскиванием. Основание и полка остаются неподвижны, модель вращается вокруг центра своего участка.
- «Открыть кейс» открывает подробности CRM; «Закрыть панель» возвращает на витрину. «Попробовать демо» открывает полностью загрузившуюся аптеку; переключатель «Коллекция» возвращает витрину. Реальных заявок не создавалось.
- Проверено отсутствие обрезки высокого офиса после вращения и обе мобильные полки. Реальное сенсорное устройство отдельно не тестировалось.
- Финальная production-вкладка: ошибок и предупреждений в собранном журнале нет. В одном из промежуточных проходов драйвер выдал предупреждение X4122 о точности шейдера GTAO; ошибки рендера не возникло.
- `npm test`: **123/123 passed**, включая исправление вывески офиса из предыдущего самостоятельного коммита `4d6c9dd`.
- `npm run build`: успешно; остаётся предупреждение Vite о размере общих чанков города/Three.js.
- `git diff --check`: без ошибок. Исходный `office-demo` и посторонний `music-island-prototype/` не изменялись.

## Оставшиеся визуальные отличия

Композиция и физическая опора воспроизведены, однако результат не тождественен исходному художественному рендеру попиксельно: исходные фасады города, геометрия растений, мелкие товары, рисунок древесины/камня и отражения отличаются. Не подменяем работающие модели статичной картинкой и не заявляем буквального совпадения. Открытых P0/P1/P2 в проверенных взаимодействиях и размещении моделей не осталось; указанные различия детализации остаются дальнейшей визуальной полировкой (P3).

final result: passed

### Проверка после публикации: средний экран

На опубликованном коммите `3156930` при 1280 × 720 обнаружен [P2]: фиксированная ширина CTA сдвигала правую кнопку за край текстовой колонки. Максимальная ширина 220 px теперь применяется от 1400 px (кнопка может сжиматься вместе с колонкой), диапазон 1201–1399 px использует компактные интервалы/подписи. В финальной production-сборке при 1280 px правая граница кнопки и колонки совпадает (1212.86 px). Снимок: `qa/collection/physical-medium-final.jpg`. На границе 1400 px проверено совпадение правых границ кнопки и колонки (1327.45 px). Референсные 1486 px и мобильные правила не затронуты. Повторные `npm test` (123/123) и `npm run build` прошли.

final result: passed

# Плавная смена проектов — 2026-10-03

- При выборе статуэтки 3D-кадры смешиваются за 460 мс с плавным началом/завершением. Камера выбранной модели приближается на 1.8%; описание появляется за 400 мс с последовательной задержкой до 65 мс. После перехода композиция полностью совпадает с прежней.
- Снимок исходного кадра создаётся до смены React-элементов. Повторный выбор во время перехода использует текущий смешанный кадр, а не возвращается к предыдущему проекту. Повторный выбор уже открытого проекта не запускает лишнюю анимацию и запись истории.
- Материалы зданий и GLB не меняют прозрачность. Два временных буфера освобождаются после перехода, изменения размера, ручной прокрутки, скрытия вкладки, потери контекста или размонтирования. Рендер по запросу сохранён.
- Проверены все пять проектов, быстрые переходы ARGUS → Tynysh → Uniqs, возврат браузером, общий обзор и повторный вход. Итоговые модель, табличка, заголовок и URL соответствуют последнему выбору. Ошибок/предупреждений консоли не обнаружено.
- Desktop: 1486 × 1059. Снимок завершённого перехода: `qa/collection/motion-desktop.jpg`; последовательность реальных браузерных кадров CRM → ARGUS собрана в `qa/collection/project-transition.gif` (паузы начала/конца продлены для просмотра).
- Mobile: 390 × 844, выбор с нижней полки возвращает к началу страницы и плавно меняет модель; проверены обзор и офис. Снимок: `qa/collection/motion-mobile.jpg`. Реальное сенсорное устройство отдельно не проверялось.
- `prefers-reduced-motion` отключает смешивание, движение камеры и появление текста; обработано изменение предпочтения во время перехода. Системная настройка пользователя при проверке не менялась.
- `npm test`: 123/123; `npm run build`: успешно, прежнее предупреждение о размере общих чанков. `git diff --check`: без ошибок. Новых зависимостей нет; город, офис и посторонний прототип не изменялись.

final result: passed
