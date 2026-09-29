# Shared portfolio navigation in buildings — 2026-09-29

Office, pharmacy, and ARGUS now use the same `PortfolioHeader` as the city and resume. A project context row provides an exit and the matching case study. The interior viewport sits below the header so project controls do not collide with site navigation.

The embedded office uses a compact floor/team/development/search toolbar. Its legacy header and profile dock are not mounted. The pharmacy retains its campaign workflow; the ARGUS prototype retains its event scenario. The separate `office-demo` application is unchanged.

Validation was performed in a committed-source copy plus this task's changes, excluding unrelated unfinished changes. The final baseline is `0074d88`, including the saved guide, camera, vegetation, and building placement updates.

- `npm test`: 89 tests passed, including new interior-to-resume route coverage.
- `npm run build`: passed; existing large-bundle warning remains.
- Desktop 1280 × 720: office floor changes, team and development panels, camera mode, common header, pharmacy entry from a case study, and ARGUS event playback.
- Mobile 390 × 844: office floor controls/search/help and development panel; pharmacy campaign creation, bot start/pause, and return to the city.
- Interior → Skills opens the resume at the skills section below the header.
- Interior → About project opens the corresponding case study.
- City return from a direct `?view=resume&place=argus` link explicitly selects city mode; browser Back restores the interior.
- No duplicate legacy header or profile dock; no horizontal overflow in the checked mobile flows.

Screenshots: `interior-portfolio-office.png`, `interior-portfolio-pharmacy-mobile.png`.
