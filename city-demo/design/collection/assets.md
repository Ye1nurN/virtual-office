# Материалы музейной витрины

- `reference.png` — вариант, выбранный пользователем 2026-10-03 (его приложенный файл codex-clipboard-a9c5a370-dc82-4b09-8556-4c8576a35afe.png), 1486 × 1059.
- `../../public/collection/walnut.png` — built-in imagegen, 1024 × 1024: fine horizontal walnut grain, medium-dark warm brown albedo, no objects, text or baked lighting.
- `../../public/collection/plaster.png` — built-in imagegen, 1254 × 1254: tileable warm charcoal-brown mineral plaster, fine irregular grain, no objects, text or lighting gradient.
- `../../public/collection/travertine.png` — built-in imagegen, 1254 × 1254: warm ivory travertine albedo, subtle pores and mineral grain, no grout, objects, text or baked shadows.

Текстуры сгенерированы для этого изменения. Статуэтки — настоящая геометрия пяти зданий существующего города и его GLB-растения, а не новые нарисованные замены. Изображения предназначены только для материалов и референса; здание можно осматривать с разных сторон.

Шрифт Lora Variable 5.3.0 поставляется локально через @fontsource-variable/lora (https://fonts.google.com/specimen/Lora). Лицензия SIL OFL: public/collection/LICENSE-Lora.txt. Интерфейс использует прежний Inter Variable.

## Physical shelf revision — 2026-10-03

- `../../public/collection/gallery-backdrop-v2.png` — built-in imagegen, 1536 × 1024. Prompt: dark warm charcoal/brown finely irregular plaster, warm grazing light at the far left and two soft lower-left pools around 75% height; out-of-focus dark green leaves narrowly at the left edge and bottom right; empty centre, nearly black right 40%; no shelves, buildings, interface, frames or text. Generated and inspected against `reference.png`; used by `collection-shell`.
- Timber shelves, shallow receding edges, travertine plinths and engraved brass plates are real geometry sharing each row's camera and shadow maps. The plate text remains linked to project data. World-scale UVs retain the stone pores instead of stretching them around the cylinder.
- The existing building factory is reused; `galleryDisplay` only raises and arranges the pharmacy roof equipment for the collection's lower camera. City placement, colliders and office lettering remain intact.
- Display headings use Times New Roman with Georgia fallback to match the supplied reference's narrower serif. Body copy and the collection overview use locally bundled Lora; UI uses Inter Variable.
