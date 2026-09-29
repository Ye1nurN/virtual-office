# Portfolio header verification — 2026-09-29

The City / Resume switch is a child of the shared header. Desktop keeps it beside the brand; tablet uses two header rows; mobile gives the switch a full-width row inside the header.

Verified against committed baseline `39e70c5` plus only this change, in an isolated copy so unrelated in-progress work did not affect the checks.

- `npm test`: 66 tests passed.
- `npm run build`: passed (existing large-chunk warning).
- Production preview: 1280 × 720, 650 × 844, and 390 × 844.
- City → Resume and Resume → City work from the header. Resume unmounts the city canvas.
- One presentation switch, contained in the header, with correct pressed state.
- No horizontal overflow at desktop, tablet, or mobile widths.
- At 650 px, the header ends at y=118 and the welcome card starts at y=142 without stretching to the bottom.
- No browser console errors in the checked flows.

Screenshots: `portfolio-header-desktop.png`, `portfolio-header-mobile.png`.
