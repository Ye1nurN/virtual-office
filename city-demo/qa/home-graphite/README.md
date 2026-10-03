# Graphite homepage fidelity — 2026-10-03

Source visual truth: `design/home-graphite-approved.png`, the user's final black/white attachment. This supersedes the preceding warm version for the homepage only.

Implementation: `qa/home-graphite/desktop.jpg`, route `?view=home`, top of page, drawers closed, entrance animation settled. Both source and browser capture are **1485 × 1059** pixels, with a 1485 × 1059 CSS viewport and devicePixelRatio 1. No density normalization or stretch was applied.

## Findings and comparison history

1. **[P1, resolved] Palette and materials.** `compare-before.jpg` shows brown plaster/walnut versus the selected neutral black/white source. Replaced home materials with generated neutral charcoal rasters, pure-white identity and CTA, neutral borders and drawer colours. Existing 3D building/material assets remain intact.
2. **[P2, resolved] Grid and typography.** Earlier 12-column layout made the left cards too wide and the bottom award too large. Three shared tracks now measure 547:245:587 with 14 px horizontal / 16 px vertical gaps. At the reference viewport top rows measure 804.84/586.16 px, 424/248 px high; lower cards measure 546.20/844.80 px, 174 px high. Inter was replaced on home by locally packaged Roboto with Times New Roman display type. Corrected the project CTA to left alignment, separated stack items, restored the footer date and moved the full-resume action into About.
3. **[P2, resolved] First pass overflow and lighting.** `compare-iteration-1.jpg` / `typography-1.jpg` show the first revised stage. Lowered excessive panel grain/brightness using the generated raster over a neutral base, refined the name/role and numeral metrics, reduced the project subtitle to fit its measured text box. Removed unwanted desktop scrollbar caused by natural card heights.
4. **[P2, resolved] Responsive widths.** Browser inspection found a count overflow at 320 px, a long education row at 760 px and an unwrapped achievement description at 1024 px. Adjusted the small count, timeline typography and award wrapping. Rechecked these exact widths: no overflowing cards, text, or controls.
5. Final evidence: `comparison-final.jpg` (reference left, implementation right); focused `comparison-intro.jpg`, `comparison-projects.jpg`, `comparison-details.jpg`. All were opened and inspected after the fixes. `mobile-top.jpg` and `mobile-bottom.jpg` record the 390 × 844 layout.

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
