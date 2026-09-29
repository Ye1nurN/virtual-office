# Portfolio interface verification — 2026-09-29

Result: passed for the completed portfolio interface change.

## Scope

New welcome screen and navigation, city/resume presentations, three project
stories, technology search, project experience, skills linked to examples,
contact panel, project deep links and compact city controls. Name: **Елнур**.
Contact details, employment history, role and CV were not supplied; none were
invented. The confirmed GitHub profile is available from the contact panel.

## Independent verification

Other tasks were simultaneously changing rendering, cameras and ARGUS in the
same working directory. An isolated copy of committed source (`4d8d717`) plus
only this task's changes was built under ignored `node_modules/.cache`.
Unfinished camera integrations were kept in the working tree and excluded from
the portfolio change. This copy was checked as a production preview on 4187;
the combined development workspace was also exercised on 4174.

- All **63 tests passed**, including three new routing tests for all project
  links, mobile defaults, and rejection of unknown project IDs.
- Production build passed. Existing large Three.js/GLTF chunk warning remains.
- Browser: 1280×720 and 390×844, Codex in-app browser. No JavaScript errors in
  the checked portfolio flows.
- Mobile default opens the document, with **zero canvas elements**. Document
  width equals viewport width (390px), without horizontal overflow.
- Project dialog at 390px: 374px outer width, 357px scrollable content width;
  content remains readable and scrolls vertically. Escape closes it.
- Search by `FastAPI` returns ARGUS; city movement is disabled while searching.
- Copy link reports success; copied URL contains `view=resume&project=pharmacy`.
  Reloading a project URL opens the expected case.
- D moves the avatar; observed production position (0,17) → (0.136,16.922).
- “Пройти к зданию” starts a real collision-aware route. It reaches the pharmacy
  entry (approximately -16.678,0.032); E opens the pharmacy demo.
- Direct demo button opens the pharmacy; its return button brings the visitor
  back to the city at the entrance.
- Resume navigation, desktop/modal project cards, contact link, map and camera
  controls work. City/resume switching unmounts/remounts the scene.

## Screenshots

- `portfolio-city.png`: desktop welcome and city.
- `portfolio-resume.png`: desktop document view.
- `portfolio-mobile.png`: mobile document view.
- `portfolio-project-mobile.png`: mobile case drawer, after its opening animation.

Physical touch hardware, direct contact delivery and PDF download were not
tested: touch hardware was unavailable, and contact/CV data has not been added.
